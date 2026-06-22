from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.schemas.provider import DoctorCreate, ProviderResponse, ProviderUpdate
from app.db.session import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.models.provider import Provider
from app.models.slot import AppointmentSlot
from app.models.user import User
from app.models.visit_record import VisitRecord
from app.routes.auth import require_role
from app.core.security import hash_password

# A doctor can't be deleted while they still have live commitments; finished
# appointments (completed/cancelled/no-show) don't block deletion.
ACTIVE_APPOINTMENT_STATUSES = (
    AppointmentStatus.waiting,
    AppointmentStatus.in_progress,
)

router = APIRouter(prefix="/providers", tags=["providers"])

# Default Mon–Fri 09:00–17:00 schedule applied when an admin creates a doctor
# without specifying working hours, so slot generation works out of the box.
DEFAULT_WORKING_HOURS = {
    day: {"start": "09:00", "end": "17:00"}
    for day in ("monday", "tuesday", "wednesday", "thursday", "friday")
}


@router.get("", response_model=list[ProviderResponse])
def list_providers(db: Session = Depends(get_db)):
    return db.query(Provider).filter(Provider.is_active.is_(True)).all()


@router.get("/me", response_model=ProviderResponse)
def get_my_provider(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["doctor"])),
):
    provider = (
        db.query(Provider)
        .filter(Provider.user_id == current_user.id)
        .first()
    )
    if provider is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No provider record found for current user",
        )
    return provider


@router.post("", response_model=ProviderResponse, status_code=status.HTTP_201_CREATED)
def create_doctor(
    doctor_in: DoctorCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_role(["admin"])),
):
    """Admin-only: create a doctor (User with role=doctor + Provider) atomically.

    Both rows are created in a single transaction; if anything fails, neither
    is persisted. Returns 409 if the email is already registered.
    """
    existing = db.query(User).filter(User.email == doctor_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    try:
        user = User(
            full_name=doctor_in.full_name,
            email=doctor_in.email,
            password_hash=hash_password(doctor_in.password),
            role="doctor",
        )
        db.add(user)
        db.flush()  # assigns user.id without committing the transaction

        provider = Provider(
            user_id=user.id,
            specialty=doctor_in.specialty,
            working_hours=doctor_in.working_hours or DEFAULT_WORKING_HOURS,
            experience=doctor_in.experience,
            fees=doctor_in.fees,
            address=doctor_in.address,
            about=doctor_in.about,
        )
        db.add(provider)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    except Exception:
        db.rollback()
        raise

    db.refresh(provider)
    return provider



@router.put("/{provider_id}", response_model=ProviderResponse)
def update_provider(
    provider_id: int,
    payload: ProviderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "doctor"])),
):
    provider = db.query(Provider).filter(Provider.id == provider_id).first()
    if provider is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider not found",
        )

    if current_user.role == "doctor" and provider.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctors may only update their own provider record",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(provider, field, value)

    db.commit()
    db.refresh(provider)
    return provider


@router.delete("/{provider_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_provider(
    provider_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"])),
):
    """Admin-only: permanently delete a doctor (provider + login account).

    Blocked (409) only while the doctor has **active** appointments
    (waiting/in-progress). Once every appointment is finished
    (completed/cancelled/no-show), the doctor — together with their slots,
    finished appointments and visit records — is removed.
    """
    provider = db.query(Provider).filter(Provider.id == provider_id).first()
    if provider is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider not found",
        )

    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete providers",
        )

    active_count = (
        db.query(Appointment)
        .join(AppointmentSlot, AppointmentSlot.id == Appointment.slot_id)
        .filter(AppointmentSlot.provider_id == provider.id)
        .filter(Appointment.status.in_(ACTIVE_APPOINTMENT_STATUSES))
        .count()
    )
    if active_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Cannot delete a doctor with {active_count} active "
                "appointment(s). Complete, cancel or mark them as no-show first."
            ),
        )

    user = db.query(User).filter(User.id == provider.user_id).first()
    slot_ids = [
        row[0]
        for row in db.query(AppointmentSlot.id)
        .filter(AppointmentSlot.provider_id == provider.id)
        .all()
    ]

    # Cascade-remove in FK-safe order: visit records → appointments → slots →
    # provider → user. Patients/services are untouched.
    db.query(VisitRecord).filter(
        VisitRecord.doctor_id == provider.id
    ).delete(synchronize_session=False)
    if slot_ids:
        db.query(Appointment).filter(
            Appointment.slot_id.in_(slot_ids)
        ).delete(synchronize_session=False)
        db.query(AppointmentSlot).filter(
            AppointmentSlot.id.in_(slot_ids)
        ).delete(synchronize_session=False)
    db.delete(provider)
    db.flush()
    if user is not None:
        db.delete(user)
    db.commit()
    return None