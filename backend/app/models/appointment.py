from datetime import datetime, timezone
import enum
from uuid import uuid4

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class AppointmentStatus(str, enum.Enum):
    confirmed = "confirmed"
    cancelled = "cancelled"
    completed = "completed"
    no_show = "no_show"
    waiting = "waiting"
    in_progress = "in_progress"


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    slot_id = Column(UUID(as_uuid=True), ForeignKey("appointment_slots.id"), nullable=False, unique=True)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    status = Column(
        Enum(AppointmentStatus, name="appointment_status"),
        nullable=False,
        default=AppointmentStatus.waiting,
    )
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    slot = relationship("AppointmentSlot")
    service = relationship("Service")
