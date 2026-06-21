"""Doctor-facing routes.

Currently exposes the logged-in doctor's daily slot schedule, which the admin
"All Appointments" view (SCRUM-106) and the doctor dashboard build on.
"""
from datetime import date as date_type, datetime, time, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import case, func

from app.db.session import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.models.patient import Patient
from app.models.provider import Provider
from app.models.service import Service
from app.models.slot import AppointmentSlot, SlotStatus
from app.models.user import User
from app.routes.auth import require_role
from app.schemas.slot import ScheduleSlotResponse
from app.schemas.doctor import QueueAppointmentResponse
from app.schemas.doctor import DoctorStatsResponse

router = APIRouter(prefix="/doctor", tags=["doctor"])


def _serialize_queue_rows(rows) -> list:
    """Build the enriched queue payload from (Appointment, Patient) rows."""
    today = datetime.today().date()
    items = []
    for appointment, patient in rows:
        slot = appointment.slot
        service = appointment.service

        patient_age = None
        if patient is not None and getattr(patient, "dob", None) is not None:
            dob = patient.dob
            patient_age = (
                today.year
                - dob.year
                - ((today.month, today.day) < (dob.month, dob.day))
            )

        fee = None
        if slot is not None and getattr(slot, "provider", None) is not None:
            fee = slot.provider.fees

        items.append(
            {
                "appointment_id": appointment.id,
                "patient_name": patient.full_name if patient else None,
                "service_name": service.name if service else None,
                "age": patient_age,
                "fee": fee,
                "payment_method": None,
                "status": appointment.status,
                "start_time": slot.start_time
                if slot is not None
                else appointment.created_at,
            }
        )
    return items


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



@router.get("/queue", response_model=List[QueueAppointmentResponse])
def get_queue(
    status: Optional[AppointmentStatus] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["doctor"])),
):
    """Return the authenticated doctor's appointments for today, ordered by slot start time.

    Optional `status` query param filters by appointment status.
    """
    provider = (
        db.query(Provider)
        .filter(Provider.user_id == current_user.id)
        .first()
    )
    if provider is None:
        return []

    today = datetime.today().date()
    start = datetime.combine(today, time.min)
    end = start + timedelta(days=1)

    q = (
        db.query(Appointment, Patient)
        .join(Patient, Patient.id == Appointment.patient_id)
        .join(AppointmentSlot, AppointmentSlot.id == Appointment.slot_id)
        .options(
            joinedload(Appointment.slot)
            .joinedload(AppointmentSlot.provider),
            joinedload(Appointment.service),
        )
        .filter(AppointmentSlot.provider_id == provider.id)
        .filter(AppointmentSlot.start_time >= start)
        .filter(AppointmentSlot.start_time < end)
    )

    if status is not None:
        q = q.filter(Appointment.status == status)

    q = q.order_by(AppointmentSlot.start_time.asc())

    return _serialize_queue_rows(q.all())


@router.get("/appointments", response_model=List[QueueAppointmentResponse])
def get_appointments(
    status: Optional[AppointmentStatus] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["doctor"])),
):
    """Return all of the authenticated doctor's appointments (any date).

    Unlike ``/doctor/queue`` (which is limited to today), this powers the
    doctor's "All Appointments" page, so future and past bookings are included.
    Ordered by slot start time, newest first. Optional `status` filter.
    """
    provider = (
        db.query(Provider)
        .filter(Provider.user_id == current_user.id)
        .first()
    )
    if provider is None:
        return []

    q = (
        db.query(Appointment, Patient)
        .join(Patient, Patient.id == Appointment.patient_id)
        .join(AppointmentSlot, AppointmentSlot.id == Appointment.slot_id)
        .options(
            joinedload(Appointment.slot).joinedload(AppointmentSlot.provider),
            joinedload(Appointment.service),
        )
        .filter(AppointmentSlot.provider_id == provider.id)
    )

    if status is not None:
        q = q.filter(Appointment.status == status)

    # Soonest first: upcoming appointments ordered nearest→furthest, with past
    # appointments after them.
    now = datetime.now(timezone.utc)
    q = q.order_by(
        case((AppointmentSlot.start_time >= now, 0), else_=1),
        AppointmentSlot.start_time.asc(),
    )

    return _serialize_queue_rows(q.all())



@router.get("/stats", response_model=DoctorStatsResponse)
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["doctor"])),
):
    """Return aggregated stats for the authenticated doctor.

    Values are computed from the database and scoped to the doctor's provider profile.
    """
    provider = (
        db.query(Provider)
        .filter(Provider.user_id == current_user.id)
        .first()
    )
    if provider is None:
        return {
            "earnings_total": 0,
            "appointments_count": 0,
            "patients_count": 0,
        }

    appointments_count = (
        db.query(func.count(Appointment.id))
        .join(AppointmentSlot, Appointment.slot_id == AppointmentSlot.id)
        .filter(AppointmentSlot.provider_id == provider.id)
        .scalar() or 0
    )

    patients_count = (
        db.query(func.count(func.distinct(Appointment.patient_id)))
        .join(AppointmentSlot, Appointment.slot_id == AppointmentSlot.id)
        .filter(AppointmentSlot.provider_id == provider.id)
        .scalar() or 0
    )

    earnings_total = (
        db.query(func.coalesce(func.sum(Provider.fees), 0))
        .join(AppointmentSlot, Provider.id == AppointmentSlot.provider_id)
        .join(Appointment, Appointment.slot_id == AppointmentSlot.id)
        .filter(AppointmentSlot.provider_id == provider.id)
        .filter(Appointment.status == AppointmentStatus.completed)
        .scalar() or 0
    )

    return {
        "earnings_total": int(earnings_total),
        "appointments_count": int(appointments_count),
        "patients_count": int(patients_count),
    }
