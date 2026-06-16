from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional
from uuid import UUID

class PatientCreate(BaseModel):
    full_name: str
    dob: date
    phone: str
    address: str
    gender: Optional[str] = None

class PatientUpdate(BaseModel):
    full_name: str
    dob: date
    phone: str
    address: str
    gender: Optional[str] = None

class PatientResponse(BaseModel):
    id: UUID
    user_id: int
    full_name: str
    dob: date
    phone: str
    address: str
    gender: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
