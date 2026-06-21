from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta, time
from typing import List, Optional
from uuid import UUID
from app.db.session import get_db
from app.models.slot import AppointmentSlot, SlotStatus
from app.models.provider import Provider
from app.models.user import User
from app.schemas.slot import SlotGenerate, SlotGenerateRange, SlotResponse
from app.routes.auth import require_role

router = APIRouter(prefix="/slots", tags=["slots"])

_DAYS = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
]

# Cap a single range request so a typo (e.g. a year-long span) can't generate
# an unbounded number of slots.
MAX_RANGE_DAYS = 31

# Hours used for any day the provider has no explicit entry for. We do NOT skip
# weekends — which days a doctor works varies (some Tue–Sun, some weekdays only),
# so the admin controls the days through the date range they pick.
DEFAULT_DAY_HOURS = {"start": "09:00", "end": "17:00"}


def _build_day_slots(
    db: Session,
    provider: Provider,
    target_date: date,
    slot_duration_minutes: int,
) -> List[AppointmentSlot]:
    """Create and return the slots for a single day.

    Uses the provider's configured hours for that weekday when present, falling
    back to ``DEFAULT_DAY_HOURS`` otherwise — no day (including weekends) is
    skipped. Slots that already exist are skipped, so it is safe to call
    repeatedly. The caller is responsible for committing the transaction.
    """
    working_hours = provider.working_hours or {}
    day_name = _DAYS[target_date.weekday()]
    day_schedule = working_hours.get(day_name) or DEFAULT_DAY_HOURS
    start_hour = time.fromisoformat(day_schedule["start"])
    end_hour = time.fromisoformat(day_schedule["end"])

    slot_duration = timedelta(minutes=slot_duration_minutes)
    current_time = datetime.combine(target_date, start_hour)
    end_time = datetime.combine(target_date, end_hour)

    created: List[AppointmentSlot] = []
    while current_time + slot_duration <= end_time:
        slot_end = current_time + slot_duration
        existing_slot = (
            db.query(AppointmentSlot)
            .filter(
                AppointmentSlot.provider_id == provider.id,
                AppointmentSlot.start_time == current_time,
                AppointmentSlot.end_time == slot_end,
            )
            .first()
        )
        if not existing_slot:
            new_slot = AppointmentSlot(
                provider_id=provider.id,
                start_time=current_time,
                end_time=slot_end,
                status=SlotStatus.available,
            )
            db.add(new_slot)
            db.flush()
            created.append(new_slot)
        current_time = slot_end

    return created


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

    created_slots = _build_day_slots(
        db, provider, request.date, request.slot_duration_minutes
    )

    db.commit()
    for slot in created_slots:
        db.refresh(slot)

    return created_slots


@router.post("/generate-range", response_model=List[SlotResponse])
def generate_slots_range(
    request: SlotGenerateRange,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin"])),
):
    """Generate slots for every day in an inclusive date range.

    Every day in the range gets slots (weekends included) — the admin controls
    which days a doctor works by choosing the range, e.g. Tue→Sun or Mon→Fri.
    Each day uses the provider's configured hours when set, otherwise the
    default window. Existing slots are left untouched.
    """
    if request.end_date < request.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="end_date must be on or after start_date",
        )

    span_days = (request.end_date - request.start_date).days + 1
    if span_days > MAX_RANGE_DAYS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Date range is too large (max {MAX_RANGE_DAYS} days)",
        )

    provider = db.query(Provider).filter(Provider.id == request.provider_id).first()
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider not found",
        )

    created_slots: List[AppointmentSlot] = []
    for offset in range(span_days):
        target_date = request.start_date + timedelta(days=offset)
        created_slots.extend(
            _build_day_slots(
                db, provider, target_date, request.slot_duration_minutes
            )
        )

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
