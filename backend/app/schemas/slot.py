from datetime import datetime, date
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from app.models.slot import SlotStatus


class SlotGenerate(BaseModel):
    provider_id: int
    date: date
    slot_duration_minutes: int = 30


class SlotResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    provider_id: int
    start_time: datetime
    end_time: datetime
    status: SlotStatus


class ScheduleSlotResponse(BaseModel):
    """A single slot in a doctor's daily schedule.

    ``patient_name`` and ``service_name`` are populated only for booked slots
    (i.e. slots that have an associated appointment); they are ``None`` for
    available and blocked slots.
    """

    id: UUID
    start_time: datetime
    end_time: datetime
    status: SlotStatus
    patient_name: Optional[str] = None
    service_name: Optional[str] = None