from datetime import datetime, time, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.models.patient import Patient
from app.models.slot import AppointmentSlot
from app.models.provider import Provider
from app.models.user import User
from app.routes.auth import require_role
from app.schemas.admin import QueueAppointmentResponse

router = APIRouter()


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
        items.append(
            {
                "appointment_id": appointment.id,
                "patient_name": patient.full_name if patient else None,
                "service_name": service.name if service else None,
                "status": appointment.status,
                "start_time": slot.start_time if slot is not None else appointment.created_at,
            }
        )

    return items
