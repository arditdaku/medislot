from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.appointment import Appointment
from app.models.patient import Patient
from app.models.user import User
from app.routes.auth import require_role
from app.schemas.patient import PatientAdminResponse, PatientResponse, PatientUpdate

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("", response_model=list[PatientAdminResponse])
def list_patients(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_role(["admin"])),
):
    """Admin-only: list all patients with email and total appointment count."""
    count_subq = (
        db.query(
            Appointment.patient_id.label("patient_id"),
            func.count(Appointment.id).label("cnt"),
        )
        .group_by(Appointment.patient_id)
        .subquery()
    )

    rows = (
        db.query(
            Patient,
            User.email,
            func.coalesce(count_subq.c.cnt, 0).label("total_appointments"),
        )
        .join(User, Patient.user_id == User.id)
        .outerjoin(count_subq, count_subq.c.patient_id == Patient.id)
        .order_by(Patient.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return [
        PatientAdminResponse(
            id=patient.id,
            full_name=patient.full_name,
            email=email,
            phone=patient.phone,
            date_of_birth=patient.dob,
            total_appointments=total_appointments,
        )
        for patient, email, total_appointments in rows
    ]


def _resolve_patient(db: Session, user: User) -> Patient:
    """Return the patient profile for the authenticated user.

    Raises 403 if the user is not a patient, 404 if no profile exists.
    """
    if user.role != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients have a patient profile",
        )

    patient = db.query(Patient).filter(Patient.user_id == user.id).first()
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found",
        )

    return patient


@router.get("/me", response_model=PatientResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the logged-in user's patient profile."""
    return _resolve_patient(db, current_user)


@router.put("/me", response_model=PatientResponse)
def update_my_profile(
    payload: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update the logged-in user's patient profile."""
    patient = _resolve_patient(db, current_user)

    patient.full_name = payload.full_name
    patient.phone = payload.phone
    patient.dob = payload.dob
    patient.address = payload.address
    patient.gender = payload.gender

    db.commit()
    db.refresh(patient)
    return patient
