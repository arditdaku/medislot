from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    email: str
    password: str
    role: str
    full_name: str  

class UserResponse(BaseModel):
    id: int
    email: str
    role: str
    full_name: str  
    is_active: bool  
    created_at: datetime
    updated_at: datetime  
    
    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str