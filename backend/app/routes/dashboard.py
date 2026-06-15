"""Aggregated dashboard data for the patient home screen."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.models.notification import Notification
from app.models.patient import Patient
from app.models.prescription import Prescription
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _appt_view(appt: Appointment) -> dict:
    slot = appt.slot
    provider = slot.provider if slot else None
    return {
        "id": str(appt.id),
        "doctor": provider.full_name if provider else "—",
        "specialty": provider.specialty if provider else "—",
        "start_time": slot.start_time if slot else None,
        "status": appt.status,
        "clinic": None,
    }


def _start(appt: Appointment):
    slot = appt.slot
    if slot is None or slot.start_time is None:
        return None
    st = slot.start_time
    return st.replace(tzinfo=timezone.utc) if st.tzinfo is None else st


@router.get("/patient")
def patient_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Everything the patient dashboard needs, in one call.

    Appointment-derived figures come from the live ``appointments`` data;
    prescriptions, notifications and medical records come from their tables.
    """
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients have a dashboard",
        )

    now = datetime.now(timezone.utc)
    appts = db.query(Appointment).filter(Appointment.patient_id == patient.id).all()

    upcoming = sorted(
        (
            a
            for a in appts
            if a.status in (AppointmentStatus.waiting, AppointmentStatus.confirmed)
            and _start(a) is not None
            and _start(a) > now
        ),
        key=_start,
    )
    completed = [a for a in appts if a.status == AppointmentStatus.completed]

    next_appt = upcoming[0] if upcoming else None
    others = upcoming[1:]

    active_prescriptions_q = (
        db.query(Prescription)
        .filter(Prescription.patient_id == patient.id, Prescription.is_active.is_(True))
        .order_by(Prescription.created_at.desc())
        .all()
    )
    unread_notifications = (
        db.query(Notification)
        .filter(Notification.patient_id == patient.id, Notification.is_read.is_(False))
        .count()
    )

    recent = (
        db.query(Notification)
        .filter(Notification.patient_id == patient.id)
        .order_by(Notification.created_at.desc())
        .limit(6)
        .all()
    )

    return {
        "stats": {
            "upcoming_appointments": len(upcoming),
            "completed_visits": len(completed),
            "active_prescriptions": len(active_prescriptions_q),
            "new_notifications": unread_notifications,
        },
        "next_appointment": _appt_view(next_appt) if next_appt else None,
        "upcoming": [_appt_view(a) for a in others],
        "prescriptions": [
            {
                "id": p.id,
                "medication": p.medication,
                "dosage": p.dosage,
                "prescribed_by": p.prescribed_by,
                "created_at": p.created_at,
            }
            for p in active_prescriptions_q
        ],
        "recent_activity": [
            {
                "type": n.type,
                "title": n.title,
                "message": n.message,
                "created_at": n.created_at,
            }
            for n in recent
        ],
        "health_summary": {
            "recent_visits": len(completed),
            "total_appointments": len(appts),
            "prescriptions": len(active_prescriptions_q),
        },
    }


@router.delete("/patient/activity")
def clear_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Clear the patient's recent activity (deletes their notifications)."""
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients have a dashboard",
        )

    deleted = (
        db.query(Notification)
        .filter(Notification.patient_id == patient.id)
        .delete(synchronize_session=False)
    )
    db.commit()
    return {"cleared": deleted}
