from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship

from app.db.session import Base


class Provider(Base):
    __tablename__ = "providers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"),
                     unique=True, nullable=False)
    specialty = Column(String, nullable=False)
    working_hours = Column(JSON, nullable=True)
    experience = Column(String, nullable=True)
    fees = Column(Integer, nullable=True)
    address = Column(String, nullable=True)
    about = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(
        timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="provider")

    slots = relationship("AppointmentSlot", back_populates="provider")

    @property
    def full_name(self) -> str:
        """The doctor's display name, sourced from the linked user."""
        return self.user.full_name if self.user else ""
