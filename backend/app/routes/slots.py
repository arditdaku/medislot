from datetime import date, datetime, time
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.slot import AppointmentSlot, SlotStatus
from app.schemas.slot import SlotResponse

router = APIRouter(prefix="/slots", tags=["slots"])


@router.get("/", response_model=List[SlotResponse])
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

    if status is not None:
        query = query.filter(AppointmentSlot.status == status)
    else:
        query = query.filter(AppointmentSlot.status == SlotStatus.available)

    return query.all()
