from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.patient import Patient
from app.models.user import User
from app.schemas.patient import PatientResponse, PatientUpdate

router = APIRouter(prefix="/patients", tags=["patients"])


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
