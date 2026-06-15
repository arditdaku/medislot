from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID

from app.db.database import Base


class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    medication = Column(String, nullable=False)
    dosage = Column(String, nullable=False)
    duration_days = Column(Integer, nullable=False)
    # Prescribing doctor's display name (no real prescribing flow yet).
    prescribed_by = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
