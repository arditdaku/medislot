from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

class PatientCreate(BaseModel):
    full_name: str
    dob: date
    phone: str
    address: str

class PatientResponse(BaseModel):
    id: int
    user_id: int
    full_name: str
    dob: date
    phone: str
    address: str
    created_at: datetime
    
    class Config:
        from_attributes = True