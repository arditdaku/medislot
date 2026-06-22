from datetime import datetime
from typing import Dict, Optional, List, Any
from uuid import UUID
from app.models.appointment import AppointmentStatus
from pydantic import BaseModel

class QueueAppointmentResponse(BaseModel):
    appointment_id: UUID
    patient_name: Optional[str] = None
    service_name: Optional[str] = None
    age: Optional[int] = None
    fee: Optional[int] = None
    payment_method: Optional[str] = None
    status: AppointmentStatus
    start_time: datetime

    class Config:
        from_attributes = True


class DoctorStatsResponse(BaseModel):
    earnings_total: int
    appointments_count: int
    patients_count: int

    class Config:
        from_attributes = True


class ProviderProfileResponse(BaseModel):
    id: int
    user_id: int
    specialty: str
    working_hours: Optional[Dict[str, Any]] = None
    experience: Optional[str] = None
    fees: Optional[int] = None
    address: Optional[str] = None
    about: Optional[str] = None
    is_active: bool
    full_name: str
    created_at: datetime
    updated_at: datetime

class DoctorVisitResponse(BaseModel):
    id: UUID
    appointment_id: UUID
    patient_name: Optional[str] = None
    service_name: Optional[str] = None
    appointment_date: datetime
    notes: str
    ai_summary: Optional[str] = None
    created_at: datetime

    
    class Config:
        from_attributes = True