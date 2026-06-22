from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.appointment import Appointment
from app.models.prescription import Prescription
from app.models.user import User
from app.schemas.prescription import PrescriptionCreate, PrescriptionResponse

router = APIRouter(prefix="/prescriptions", tags=["prescriptions"])


@router.post(
    "", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED
)
def create_prescription(
    payload: PrescriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Doctor-only: prescribe medication for the patient of one of their own
    appointments. The patient then sees it on their dashboard, along with the
    prescribing doctor's name.
    """
    provider_profile = current_user.provider
    if current_user.role != "doctor" or provider_profile is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can create prescriptions",
        )

    appointment = (
        db.query(Appointment)
        .filter(Appointment.id == payload.appointment_id)
        .first()
    )
    if appointment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    slot = appointment.slot
    is_owner = slot is not None and slot.provider_id == provider_profile.id
    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to prescribe for this appointment",
        )

    if not payload.medication.strip() or not payload.dosage.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Medication and dosage are required",
        )
    if payload.duration_days <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duration must be at least 1 day",
        )

    prescription = Prescription(
        patient_id=appointment.patient_id,
        medication=payload.medication.strip(),
        dosage=payload.dosage.strip(),
        duration_days=payload.duration_days,
        prescribed_by=provider_profile.full_name,
        is_active=True,
    )
    db.add(prescription)
    db.commit()
    db.refresh(prescription)
    return prescription


@router.get(
    "/appointment/{appointment_id}", response_model=List[PrescriptionResponse]
)
def list_prescriptions_for_appointment(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Prescriptions for the appointment's patient, newest first.

    A doctor sees only the prescriptions they gave that patient (and only for
    appointments they own); admins see all of the patient's prescriptions.
    """
    appointment = (
        db.query(Appointment)
        .filter(Appointment.id == appointment_id)
        .first()
    )
    if appointment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    q = db.query(Prescription).filter(
        Prescription.patient_id == appointment.patient_id
    )

    if current_user.role == "doctor":
        provider_profile = current_user.provider
        slot = appointment.slot
        is_owner = (
            provider_profile is not None
            and slot is not None
            and slot.provider_id == provider_profile.id
        )
        if not is_owner:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this patient's prescriptions",
            )
        q = q.filter(Prescription.prescribed_by == provider_profile.full_name)
    elif current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors and admins can view prescriptions",
        )

    return q.order_by(Prescription.created_at.desc()).all()
