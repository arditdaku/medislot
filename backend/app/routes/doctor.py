"""Doctor-facing routes.

Currently exposes the logged-in doctor's daily slot schedule, which the admin
"All Appointments" view (SCRUM-106) and the doctor dashboard build on.
"""
from datetime import date as date_type, datetime, time
from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.appointment import Appointment
from app.models.patient import Patient
from app.models.provider import Provider
from app.models.service import Service
from app.models.slot import AppointmentSlot, SlotStatus
from app.models.user import User
from app.routes.auth import require_role
from app.schemas.slot import ScheduleSlotResponse

router = APIRouter(prefix="/doctor", tags=["doctor"])


@router.get("/schedule", response_model=List[ScheduleSlotResponse])
def get_schedule(
    date: date_type = Query(..., description="Day to fetch, as YYYY-MM-DD"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["doctor"])),
):
    """Return the authenticated doctor's slots for a given date.

    Includes every slot status (available / booked / blocked). Booked slots are
    enriched with the patient's name and the booked service's name so the UI can
    render the schedule without extra round-trips. An invalid ``date`` value is
    rejected by FastAPI with a ``422`` before this handler runs.
    """
    provider = (
        db.query(Provider)
        .filter(Provider.user_id == current_user.id)
        .first()
    )
    if provider is None:
        # The user is a doctor but has no provider profile yet — empty schedule.
        return []

    day_start = datetime.combine(date, time.min)
    day_end = datetime.combine(date, time.max)

    slots = (
        db.query(AppointmentSlot)
        .filter(
            AppointmentSlot.provider_id == provider.id,
            AppointmentSlot.start_time >= day_start,
            AppointmentSlot.start_time <= day_end,
        )
        .order_by(AppointmentSlot.start_time)
        .all()
    )

    # Resolve patient + service names for booked slots in a single query rather
    # than one per slot.
    booked_ids = [s.id for s in slots if s.status == SlotStatus.booked]
    booking_info: dict = {}
    if booked_ids:
        rows = (
            db.query(
                Appointment.slot_id,
                Patient.full_name,
                Service.name,
            )
            .join(Patient, Appointment.patient_id == Patient.id)
            .join(Service, Appointment.service_id == Service.id)
            .filter(Appointment.slot_id.in_(booked_ids))
            .all()
        )
        booking_info = {
            slot_id: (patient_name, service_name)
            for slot_id, patient_name, service_name in rows
        }

    result = []
    for slot in slots:
        patient_name, service_name = booking_info.get(slot.id, (None, None))
        result.append(
            ScheduleSlotResponse(
                id=slot.id,
                start_time=slot.start_time,
                end_time=slot.end_time,
                status=slot.status,
                patient_name=patient_name,
                service_name=service_name,
            )
        )
    return result
