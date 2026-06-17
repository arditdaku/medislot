from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta, time
from typing import List, Optional
from uuid import UUID
from app.db.session import get_db
from app.models.slot import AppointmentSlot, SlotStatus
from app.models.provider import Provider
from app.models.user import User
from app.schemas.slot import SlotGenerate, SlotResponse
from app.routes.auth import require_role

router = APIRouter(prefix="/slots", tags=["slots"])


def _authorize_slot(db: Session, slot_id: UUID, user: User) -> AppointmentSlot:
    """Fetch a slot and ensure `user` may modify it.

    Admins may modify any slot; doctors only their own. Raises 404 if the slot
    does not exist, 403 if a doctor targets a slot that isn't theirs.
    """
    slot = db.query(AppointmentSlot).filter(AppointmentSlot.id == slot_id).first()
    if slot is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Slot not found"
        )

    if user.role == "doctor":
        provider = (
            db.query(Provider).filter(Provider.user_id == user.id).first()
        )
        if provider is None or slot.provider_id != provider.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to modify this slot",
            )

    return slot


@router.get("", response_model=List[SlotResponse])
def get_slots(
    provider_id: Optional[int] = Query(None),
    date: Optional[date] = Query(None),
    status: Optional[SlotStatus] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(AppointmentSlot)

    if provider_id is not None:
        query = query.filter(AppointmentSlot.provider_id == provider_id)

    if date is not None:
        query = query.filter(
            AppointmentSlot.start_time >= datetime.combine(date, time.min),
            AppointmentSlot.start_time <= datetime.combine(date, time.max),
        )

    # When no status is given, return every slot (available + booked + blocked)
    # so callers can show booked times as disabled rather than hiding them.
    if status is not None:
        query = query.filter(AppointmentSlot.status == status)

    return query.order_by(AppointmentSlot.start_time).all()

@router.post("/generate", response_model=List[SlotResponse])
def generate_slots(
    request: SlotGenerate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["admin"]))
):
    provider = db.query(Provider).filter(Provider.id == request.provider_id).first()
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider not found"
        )

    working_hours = provider.working_hours
    if not working_hours:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provider has no working hours configured"
        )

    day_of_week = request.date.weekday()
    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    day_name = days[day_of_week]

    if day_name not in working_hours:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Provider does not work on {day_name}"
        )

    day_schedule = working_hours[day_name]
    start_hour = time.fromisoformat(day_schedule["start"])
    end_hour = time.fromisoformat(day_schedule["end"])

    slot_duration = timedelta(minutes=request.slot_duration_minutes)
    current_time = datetime.combine(request.date, start_hour)
    end_time = datetime.combine(request.date, end_hour)
    
    created_slots = []

    while current_time + slot_duration <= end_time:
        slot_end = current_time + slot_duration

        existing_slot = db.query(AppointmentSlot).filter(
            AppointmentSlot.provider_id == request.provider_id,
            AppointmentSlot.start_time == current_time,
            AppointmentSlot.end_time == slot_end
        ).first()

        if not existing_slot:
            new_slot = AppointmentSlot(
                provider_id=request.provider_id,
                start_time=current_time,
                end_time=slot_end,
                status=SlotStatus.available
            )
            db.add(new_slot)
            db.flush()
            created_slots.append(new_slot)

        current_time = slot_end

    db.commit()

    for slot in created_slots:
        db.refresh(slot)

    return created_slots


@router.patch("/{slot_id}/block", response_model=SlotResponse)
def block_slot(
    slot_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "doctor"])),
):
    """Mark a slot as blocked. Admin: any slot; doctor: own slots only.

    Returns 403 if a doctor targets another provider's slot, 409 if the slot
    is already booked.
    """
    slot = _authorize_slot(db, slot_id, current_user)

    if slot.status == SlotStatus.booked:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot block a booked slot",
        )

    slot.status = SlotStatus.blocked
    db.commit()
    db.refresh(slot)
    return slot


@router.patch("/{slot_id}/unblock", response_model=SlotResponse)
def unblock_slot(
    slot_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "doctor"])),
):
    """Mark a slot as available again. Admin: any slot; doctor: own slots only.

    Returns 403 if a doctor targets another provider's slot, 409 if the slot
    is already booked.
    """
    slot = _authorize_slot(db, slot_id, current_user)

    if slot.status == SlotStatus.booked:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot unblock a booked slot",
        )

    slot.status = SlotStatus.available
    db.commit()
    db.refresh(slot)
    return slot
