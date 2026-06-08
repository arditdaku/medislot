from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional
from uuid import UUID

class PatientCreate(BaseModel):
    full_name: str
    dob: date
    phone: str
    address: str

class PatientResponse(BaseModel):
    id: UUID
    user_id: int
    full_name: str
    dob: date
    phone: str
    address: str
    created_at: datetime
    
    class Config:
        from_attributes = True