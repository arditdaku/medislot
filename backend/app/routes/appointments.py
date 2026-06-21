"""Appointment booking routes.

Implements atomic slot booking using PostgreSQL row-level locking
(``SELECT ... FOR UPDATE``) so that two concurrent requests can never
double-book the same slot.
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.exc import IntegrityError
from sqlalchemy import and_
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_current_user
from app.routes.auth import require_role
from app.db.session import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.models.patient import Patient
from app.models.service import Service
from app.models.slot import AppointmentSlot, SlotStatus
from app.models.provider import Provider
from app.models.user import User
from app.schemas.appointment import AdminAppointmentListResponse

router = APIRouter(prefix="/appointments", tags=["appointments"])


class BookingRequest(BaseModel):
    slot_id: UUID
    service_id: int
    # Optional: when omitted, the patient is resolved from the authenticated
    # user (the normal API path). Explicit callers may pass it directly.
    patient_id: Optional[UUID] = None


class AppointmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    patient_id: UUID
    slot_id: UUID
    service_id: int
    status: AppointmentStatus
    created_at: datetime
    updated_at: datetime


class ProviderBrief(BaseModel):
    full_name: str
    specialty: str


class SlotBrief(BaseModel):
    provider_id: int
    start_time: datetime
    end_time: datetime


class ServiceBrief(BaseModel):
    name: str
    department: str


class MyAppointmentResponse(BaseModel):
    """Enriched appointment for the patient's own list — embeds doctor, slot
    and service details so the UI can render without extra round-trips."""

    id: UUID
    status: AppointmentStatus
    created_at: datetime
    updated_at: datetime
    provider: Optional[ProviderBrief] = None
    slot: Optional[SlotBrief] = None
    service: Optional[ServiceBrief] = None


@router.post(
    "",
    response_model=AppointmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def book_appointment(
    payload: BookingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Atomically book an available slot.

    The slot row is locked with ``SELECT ... FOR UPDATE`` for the whole
    transaction. Concurrent booking requests for the same slot are therefore
    serialized: the first one commits the booking and flips the slot to
    ``booked``; any request waiting on the lock then sees the slot is no longer
    available and receives a ``409``. The UNIQUE constraint on
    ``appointments.slot_id`` is a second, database-level guarantee.
    """
    # Resolve the booking patient: prefer an explicit patient_id when given,
    # otherwise fall back to the authenticated user's patient profile.
    if payload.patient_id is not None:
        patient = (
            db.query(Patient)
            .filter(Patient.id == payload.patient_id)
            .first()
        )
    else:
        patient = (
            db.query(Patient)
            .filter(Patient.user_id == current_user.id)
            .first()
        )
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can book appointments",
        )

    try:
        service = (
            db.query(Service.id)
            .filter(Service.id == payload.service_id)
            .first()
        )
        if service is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service not found",
            )

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

        # New bookings start as "waiting" (Pending) until the doctor confirms.
        appointment = Appointment(
            patient_id=patient.id,
            slot_id=slot.id,
            service_id=payload.service_id,
            status=AppointmentStatus.waiting,
        )
        slot.status = SlotStatus.booked

        db.add(appointment)
        db.commit()
        db.refresh(appointment)
        return appointment
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Slot is already booked",
        )
    except Exception:
        db.rollback()
        raise


@router.get("/me", response_model=list[MyAppointmentResponse])
def my_appointments(
    status_filter: Optional[AppointmentStatus] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the authenticated patient's own appointments, enriched with the
    doctor, slot and service details.

    ``get_current_user`` enforces a valid Bearer token (401 otherwise). The
    user must have a patient profile; non-patients receive a 403. An optional
    ``?status=`` query parameter filters by appointment status.
    """
    patient = (
        db.query(Patient)
        .filter(Patient.user_id == current_user.id)
        .first()
    )
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can view appointment history",
        )

    query = db.query(Appointment).filter(Appointment.patient_id == patient.id)
    if status_filter is not None:
        query = query.filter(Appointment.status == status_filter)

    appointments = query.order_by(Appointment.created_at.desc()).all()

    result = []
    for appt in appointments:
        slot = appt.slot
        provider = slot.provider if slot else None
        result.append(
            {
                "id": appt.id,
                "status": appt.status,
                "created_at": appt.created_at,
                "updated_at": appt.updated_at,
                "provider": (
                    {"full_name": provider.full_name, "specialty": provider.specialty}
                    if provider
                    else None
                ),
                "slot": (
                    {
                        "provider_id": slot.provider_id,
                        "start_time": slot.start_time,
                        "end_time": slot.end_time,
                    }
                    if slot
                    else None
                ),
                "service": (
                    {"name": appt.service.name, "department": appt.service.department}
                    if appt.service
                    else None
                ),
            }
        )
    return result


@router.delete(
    "/{appointment_id}",
    status_code=status.HTTP_200_OK,
)
def cancel_appointment(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appointment = (
        db.query(Appointment)
        .filter(Appointment.id == appointment_id)
        .with_for_update()
        .first()
    )

    if appointment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    is_admin = current_user.role == "admin"
    patient_profile = current_user.patient
    is_owner = (
        patient_profile is not None
        and appointment.patient_id == patient_profile.id
    )

    if not is_owner and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to cancel this appointment",
        )

    slot = (
        db.query(AppointmentSlot)
        .filter(AppointmentSlot.id == appointment.slot_id)
        .with_for_update()
        .first()
    )
    if slot:
        slot.status = SlotStatus.available

    appointment.status = AppointmentStatus.cancelled

    db.commit()
    db.refresh(appointment)

    return {
        "message": "Appointment cancelled successfully",
        "appointment_id": str(appointment.id),
    }


class RescheduleRequest(BaseModel):
    slot_id: UUID


@router.patch("/{appointment_id}/reschedule", response_model=AppointmentResponse)
def reschedule_appointment(
    appointment_id: UUID,
    payload: RescheduleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Move an appointment to a different available slot.

    Frees the old slot, books the new one (locked with ``SELECT ... FOR
    UPDATE``), and resets the appointment to ``waiting`` so the doctor
    re-confirms the new time.
    """
    appointment = (
        db.query(Appointment)
        .filter(Appointment.id == appointment_id)
        .with_for_update()
        .first()
    )
    if appointment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    is_admin = current_user.role == "admin"
    patient_profile = current_user.patient
    is_owner = (
        patient_profile is not None
        and appointment.patient_id == patient_profile.id
    )
    if not is_owner and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to reschedule this appointment",
        )

    if appointment.status in (
        AppointmentStatus.cancelled,
        AppointmentStatus.completed,
        AppointmentStatus.no_show,
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This appointment can no longer be rescheduled",
        )

    if payload.slot_id == appointment.slot_id:
        return appointment  # no-op: same slot

    try:
        new_slot = (
            db.query(AppointmentSlot)
            .filter(AppointmentSlot.id == payload.slot_id)
            .with_for_update()
            .first()
        )
        if new_slot is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Slot not found",
            )
        if new_slot.status != SlotStatus.available:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Slot is already booked",
            )

        old_slot = (
            db.query(AppointmentSlot)
            .filter(AppointmentSlot.id == appointment.slot_id)
            .with_for_update()
            .first()
        )
        if old_slot is not None:
            old_slot.status = SlotStatus.available

        new_slot.status = SlotStatus.booked
        appointment.slot_id = new_slot.id
        appointment.status = AppointmentStatus.waiting

        db.commit()
        db.refresh(appointment)
        return appointment
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Slot is already booked",
        )


class AppointmentStatusUpdate(BaseModel):
    status: AppointmentStatus


VALID_STATUS_TRANSITIONS = {
    AppointmentStatus.waiting: {
        AppointmentStatus.confirmed,
        AppointmentStatus.in_progress,
        AppointmentStatus.cancelled,
        AppointmentStatus.no_show,
    },
    AppointmentStatus.confirmed: {
        AppointmentStatus.in_progress,
        AppointmentStatus.completed,
        AppointmentStatus.cancelled,
        AppointmentStatus.no_show,
    },
    AppointmentStatus.in_progress: {
        AppointmentStatus.completed,
        AppointmentStatus.cancelled,
        AppointmentStatus.no_show,
    },
    AppointmentStatus.completed: set(),
    AppointmentStatus.no_show: set(),
    AppointmentStatus.cancelled: set(),
}

@router.patch("/{appointment_id}/status", response_model=AppointmentResponse)
def update_appointment_status(
    appointment_id: UUID,
    payload: AppointmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update appointment status for queue management.

    Restricted to admins and doctors. Doctors may only update their own
    appointments (403 otherwise). Invalid transitions return 400.
    Cancelling releases the slot back to ``available`` in the same
    transaction.
    """
    if current_user.role not in ("admin", "doctor"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and doctors can update appointment status",
        )

    appointment = (
        db.query(Appointment)
        .filter(Appointment.id == appointment_id)
        .with_for_update()
        .first()
    )
    if appointment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    is_admin = current_user.role == "admin"
    if not is_admin:
        provider_profile = current_user.provider
        slot = (
            db.query(AppointmentSlot)
            .filter(AppointmentSlot.id == appointment.slot_id)
            .first()
        )
        is_owner = (
            provider_profile is not None
            and slot is not None
            and slot.provider_id == provider_profile.id
        )
        if not is_owner:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this appointment",
            )

    allowed_next = VALID_STATUS_TRANSITIONS.get(appointment.status, set())
    if payload.status not in allowed_next:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition from {appointment.status} to {payload.status}",
        )

    try:
        if payload.status == AppointmentStatus.cancelled:
            slot = (
                db.query(AppointmentSlot)
                .filter(AppointmentSlot.id == appointment.slot_id)
                .with_for_update()
                .first()
            )
            if slot:
                slot.status = SlotStatus.available

        appointment.status = payload.status
        db.commit()
        db.refresh(appointment)
        return appointment
    except Exception:
        db.rollback()
        raise


@router.get("/admin/", response_model=AdminAppointmentListResponse)
def get_all_appointments_admin(
    status: Optional[AppointmentStatus] = Query(None),
    service_id: Optional[int] = Query(None),
    date: Optional[datetime] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"])),
):
    """Admin console: list appointments enriched with patient, doctor and service."""
    q = (
        db.query(Appointment, Patient)
        .join(Patient, Patient.id == Appointment.patient_id)
        .options(
            joinedload(Appointment.slot)
            .joinedload(AppointmentSlot.provider)
            .joinedload(Provider.user),
            joinedload(Appointment.service),
        )
    )
    if status is not None:
        q = q.filter(Appointment.status == status)
    if service_id is not None:
        q = q.filter(Appointment.service_id == service_id)
    if date is not None:
        q = q.filter(Appointment.created_at == date)

    total = q.count()

    rows = (
        q.order_by(Appointment.created_at.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )

    items = []
    for appointment, patient in rows:
        slot = appointment.slot
        provider = slot.provider if slot is not None else None
        service = appointment.service

        age = None
        if patient and getattr(patient, "dob", None):
            today = datetime.today().date()
            dob = patient.dob
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

        items.append(
            {
                "id": appointment.id,
                "patient_name": patient.full_name if patient else None,
                "patient_age": age,
                "doctor_name": provider.full_name if provider else None,
                "service_name": service.name if service else None,
                "fee": provider.fees if provider else None,  # doctor's consultation fee
                "appointment_datetime": slot.start_time if slot is not None else appointment.created_at,
                "status": appointment.status,
            }
        )

    return {"total": total, "limit": limit, "offset": offset, "items": items}
