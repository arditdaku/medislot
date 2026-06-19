from datetime import datetime
from typing import Optional, List
from uuid import UUID
from app.models.appointment import AppointmentStatus
from pydantic import BaseModel

class QueueAppointmentResponse(BaseModel):
    appointment_id: UUID
    patient_name: Optional[str] = None
    service_name: Optional[str] = None
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
