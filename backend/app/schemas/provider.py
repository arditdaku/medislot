from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict


class ProviderCreate(BaseModel):
    specialty: str
    working_hours: dict[str, Any] | None = None
    is_active: bool = True


class DoctorCreate(BaseModel):
    """Payload for an admin creating a doctor (User + Provider in one call)."""

    full_name: str
    email: str
    password: str
    specialty: str
    working_hours: dict[str, Any] | None = None
    experience: str | None = None
    fees: int | None = None
    address: str | None = None
    about: str | None = None


class ProviderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    full_name: str
    specialty: str
    working_hours: dict[str, Any] | None = None
    experience: str | None = None
    fees: int | None = None
    address: str | None = None
    about: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
