from datetime import datetime, time, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.db.session import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.models.patient import Patient
from app.models.slot import AppointmentSlot
from app.models.provider import Provider
from app.models.user import User
from app.routes.auth import require_role
from app.schemas.admin import QueueAppointmentResponse
from app.schemas.admin import StatsResponse
from app.models.slot import SlotStatus

router = APIRouter()

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/queue", response_model=List[QueueAppointmentResponse])
def get_queue(
    status: Optional[AppointmentStatus] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"])),
):
    """Return all appointments for today, ordered by slot start time.

    Restricted to admins. Optional `status` query param filters by appointment status.
    """
    today = datetime.today().date()
    start = datetime.combine(today, time.min)
    end = start + timedelta(days=1)

    q = (
        db.query(Appointment, Patient)
        .join(Patient, Patient.id == Appointment.patient_id)
        .join(AppointmentSlot, AppointmentSlot.id == Appointment.slot_id)
        .options(
            joinedload(Appointment.slot)
            .joinedload(AppointmentSlot.provider)
            .joinedload(Provider.user),
            joinedload(Appointment.service),
        )
        .filter(AppointmentSlot.start_time >= start)
        .filter(AppointmentSlot.start_time < end)
    )

    if status is not None:
        q = q.filter(Appointment.status == status)

    q = q.order_by(AppointmentSlot.start_time.asc())

    rows = q.all()

    items = []
    for appointment, patient in rows:
        slot = appointment.slot
        service = appointment.service
        
        patient_age = None
        if patient is not None and getattr(patient, "dob", None) is not None:
            dob = patient.dob
            today_date = today
            patient_age = (
                today_date.year
                - dob.year
                - ((today_date.month, today_date.day) < (dob.month, dob.day))
            )

        fee = None
        if slot is not None and getattr(slot, "provider", None) is not None:
            fee = slot.provider.fees

        payment_method = None

        items.append(
            {
                "appointment_id": appointment.id,
                "patient_name": patient.full_name if patient else None,
                "service_name": service.name if service else None,
                "age": patient_age,
                "fee": fee,
                "payment_method": payment_method,
                "status": appointment.status,
                "start_time": slot.start_time if slot is not None else appointment.created_at,
            }
        )

    return items



@router.get("/stats", response_model=StatsResponse)
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"])),
):
    """Return aggregated admin statistics for today.

    Restricted to admins. All values are computed from the database.
    """
    today = datetime.today().date()
    start = datetime.combine(today, time.min)
    end = start + timedelta(days=1)

    total_doctors = db.query(func.count(Provider.id)).filter(Provider.is_active == True).scalar() or 0

    total_patients = db.query(func.count(Patient.id)).scalar() or 0

    appointments_today = (
        db.query(func.count(Appointment.id))
        .join(AppointmentSlot, Appointment.slot_id == AppointmentSlot.id)
        .filter(AppointmentSlot.start_time >= start)
        .filter(AppointmentSlot.start_time < end)
        .scalar() or 0
    )

    available_slots = (
        db.query(func.count(AppointmentSlot.id))
        .filter(AppointmentSlot.start_time >= start)
        .filter(AppointmentSlot.start_time < end)
        .filter(AppointmentSlot.status == SlotStatus.available)
        .scalar() or 0
    )

    no_shows = (
        db.query(func.count(Appointment.id))
        .join(AppointmentSlot, Appointment.slot_id == AppointmentSlot.id)
        .filter(Appointment.status == AppointmentStatus.no_show)
        .filter(AppointmentSlot.start_time >= start)
        .filter(AppointmentSlot.start_time < end)
        .scalar() or 0
    )

    queue_now = (
        db.query(func.count(Appointment.id))
        .join(AppointmentSlot, Appointment.slot_id == AppointmentSlot.id)
        .filter(Appointment.status.in_([AppointmentStatus.waiting, AppointmentStatus.in_progress]))
        .filter(AppointmentSlot.start_time >= start)
        .filter(AppointmentSlot.start_time < end)
        .scalar() or 0
    )

    earnings_total = (
        db.query(func.coalesce(func.sum(Provider.fees), 0))
        .join(AppointmentSlot, Provider.id == AppointmentSlot.provider_id)
        .join(Appointment, Appointment.slot_id == AppointmentSlot.id)
        .filter(Appointment.status == AppointmentStatus.completed)
        .scalar() or 0
    )

    return {
        "total_doctors": int(total_doctors),
        "total_patients": int(total_patients),
        "appointments_today": int(appointments_today),
        "available_slots": int(available_slots),
        "no_shows": int(no_shows),
        "queue_now": int(queue_now),
        "earnings_total": int(earnings_total),
    }
