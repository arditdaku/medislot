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


class StatsResponse(BaseModel):
    total_doctors: int
    total_patients: int
    appointments_today: int
    available_slots: int
    no_shows: int
    queue_now: int
    earnings_total: int

    class Config:
        from_attributes = True
