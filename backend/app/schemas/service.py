from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class ServiceCreate(BaseModel):
    name: str
    duration_minutes: int
    department: str


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    duration_minutes: Optional[int] = None
    department: Optional[str] = None


class ServiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    duration_minutes: int
    department: str
    created_at: datetime