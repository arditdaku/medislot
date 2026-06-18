from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.appointment import Appointment
from app.models.user import User
from app.models.visit_record import VisitRecord
from app.schemas.visit_record import VisitRecordCreate, VisitRecordResponse

router = APIRouter(prefix="/visit-records", tags=["visit-records"])


@router.post("", response_model=VisitRecordResponse, status_code=status.HTTP_201_CREATED)
def create_visit_record(
    payload: VisitRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
   
    provider_profile = current_user.provider
    if current_user.role != "doctor" or provider_profile is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can create visit records",
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
            detail="Not authorized to record a visit for this appointment",
        )

    visit_record = VisitRecord(
        appointment_id=payload.appointment_id,
        doctor_id=provider_profile.id,
        notes=payload.notes,
    )

    try:
        db.add(visit_record)
        db.commit()
        db.refresh(visit_record)
        return visit_record
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A visit record already exists for this appointment",
        )


@router.get("/{appointment_id}", response_model=VisitRecordResponse)
def get_visit_record(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Doctor/admin only. 404 if not found."""
    if current_user.role not in ("doctor", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors and admins can view visit records",
        )

    visit_record = (
        db.query(VisitRecord)
        .filter(VisitRecord.appointment_id == appointment_id)
        .first()
    )
    if visit_record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visit record not found",
        )

    return visit_record