from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from app.models.slot import SlotStatus


class SlotGenerate(BaseModel):
    provider_id: int
    start_time: datetime
    end_time: datetime


class SlotResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    provider_id: int
    start_time: datetime
    end_time: datetime
    status: SlotStatus