from uuid import uuid4
import enum
from sqlalchemy import Column, DateTime, Enum, ForeignKey, Index, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base

class SlotStatus(str, enum.Enum):
    available = "available"
    booked = "booked"
    blocked = "blocked"

class AppointmentSlot(Base):
    _tablename_ = "appointment_slots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    provider_id = Column(Integer, ForeignKey("providers.id"), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    status = Column(
        Enum(SlotStatus, name="slot_status"),
        nullable=False,
        default=SlotStatus.available
    )

    _table_args_ = (
        Index("ix_slot_provider_start", "provider_id", "start_time"),
    )

    provider = relationship("Provider", back_populates="slots")