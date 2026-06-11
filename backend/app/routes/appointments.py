"""Appointment booking routes.

Implements atomic slot booking using PostgreSQL row-level locking
(``SELECT ... FOR UPDATE``) so that two concurrent requests can never
double-book the same slot.
"""
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.models.slot import AppointmentSlot, SlotStatus

router = APIRouter(prefix="/appointments", tags=["appointments"])


class BookingRequest(BaseModel):
    slot_id: UUID
    patient_id: UUID
    service_id: int


class AppointmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    patient_id: UUID
    slot_id: UUID
    service_id: int
    status: AppointmentStatus
    created_at: datetime
    updated_at: datetime


@router.post(
    "/book",
    response_model=AppointmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def book_appointment(payload: BookingRequest, db: Session = Depends(get_db)):
    """Atomically book an available slot.

    The slot row is locked with ``SELECT ... FOR UPDATE`` for the whole
    transaction. Concurrent booking requests for the same slot are therefore
    serialized: the first one commits the booking and flips the slot to
    ``booked``; any request waiting on the lock then sees the slot is no longer
    available and receives a ``409``. The UNIQUE constraint on
    ``appointments.slot_id`` is a second, database-level guarantee.
    """
    try:
        # Row-level lock: blocks other transactions touching this slot until
        # we commit or roll back. This is what makes the booking atomic.
        slot = (
            db.query(AppointmentSlot)
            .filter(AppointmentSlot.id == payload.slot_id)
            .with_for_update()
            .first()
        )

        if slot is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Slot not found",
            )

        if slot.status != SlotStatus.available:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Slot is already booked",
            )

        appointment = Appointment(
            patient_id=payload.patient_id,
            slot_id=slot.id,
            service_id=payload.service_id,
            status=AppointmentStatus.confirmed,
        )
        slot.status = SlotStatus.booked

        db.add(appointment)
        db.commit()  # commits the slot update + appointment, releasing the lock
        db.refresh(appointment)
        return appointment
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError:
        # Backstop: UNIQUE(slot_id) was violated by a racing transaction.
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Slot is already booked",
        )
    except Exception:
        db.rollback()
        raise
