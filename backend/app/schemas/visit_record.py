from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class VisitRecordCreate(BaseModel):
    appointment_id: UUID
    notes: str


class VisitRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    appointment_id: UUID
    doctor_id: int
    notes: str
    ai_summary: Optional[str] = None
    created_at: datetime