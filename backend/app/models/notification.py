from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID

from app.db.database import Base


class Notification(Base):
    """Patient-facing events: confirmations, reminders, prescriptions, etc.

    Doubles as the "Recent activity" feed and the unread-notifications count.
    """

    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    # confirmation | reminder | prescription | visit_completed | info
    type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
