from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.provider import Provider
from app.models.user import User
from app.routes.auth import require_role
from app.schemas.provider import DoctorCreate, ProviderResponse
from app.core.security import hash_password

router = APIRouter(prefix="/providers", tags=["providers"])


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
            working_hours=doctor_in.working_hours,
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
