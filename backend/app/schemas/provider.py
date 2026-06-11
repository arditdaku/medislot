from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict


class ProviderCreate(BaseModel):
    specialty: str
    working_hours: dict[str, Any] | None = None
    is_active: bool = True


class ProviderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    specialty: str
    working_hours: dict[str, Any] | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime