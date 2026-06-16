from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel
from app.models.appointment import AppointmentStatus


class AppointmentCreate(BaseModel):
    slot_id: UUID
    service_id: int


class AppointmentResponse(BaseModel):
    id: UUID
    patient_id: UUID
    slot_id: UUID
    service_id: int
    status: AppointmentStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AdminAppointmentResponse(BaseModel):
    id: UUID
    patient_name: str
    patient_age: int
    doctor_name: str
    service_name: str
    fee: int
    appointment_datetime: datetime
    status: AppointmentStatus

    class Config:
        from_attributes = True


class AdminAppointmentListResponse(BaseModel):
    total: int
    limit: int
    offset: int
    items: List[AdminAppointmentResponse]