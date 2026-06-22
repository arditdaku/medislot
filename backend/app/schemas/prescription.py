from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class PrescriptionCreate(BaseModel):
    """A doctor prescribes for the patient of one of their appointments."""

    appointment_id: UUID
    medication: str
    dosage: str
    duration_days: int


class PrescriptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: UUID
    medication: str
    dosage: str
    duration_days: int
    prescribed_by: Optional[str] = None
    is_active: bool
    created_at: datetime
