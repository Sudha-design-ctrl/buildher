"""
BuildHer Backend - Authentication & User Schemas
"""

from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class UserRole(str):
    ENTREPRENEUR = "entrepreneur"
    CUSTOMER = "customer"
    ADMIN = "admin"


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password at least 6 characters")
    full_name: str = Field(..., min_length=2, description="User full name")
    role: str = Field(..., pattern="^(entrepreneur|customer|admin)$")
    phone: Optional[str] = None
    language_preference: str = Field(default="en", description="Preferred language, e.g. en, kn, hi")


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class FirebaseTokenLoginRequest(BaseModel):
    id_token: str = Field(..., description="Firebase ID token from mobile client")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    role: str
    email: str
    full_name: str


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    language_preference: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    business_name: Optional[str] = None
    business_category: Optional[str] = None
    extra_data: Optional[Dict[str, Any]] = None


class UserProfileResponse(BaseModel):
    uid: str
    email: str
    full_name: str
    role: str
    phone: Optional[str] = None
    language_preference: str = "en"
    location: Optional[str] = None
    bio: Optional[str] = None
    business_name: Optional[str] = None
    business_category: Optional[str] = None
    is_verified: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
