"""
BuildHer Backend - Local Marketplace Schemas (Phase 6)
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ProductCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=150, description="Product or service title")
    description: str = Field(..., min_length=10, max_length=1500, description="Detailed description")
    category: str = Field(..., description="Cooking & Food, Tailoring & Fashion, Crafts & Handmade, Beauty & Wellness, Tutoring & Education, Art & Creativity")
    price: float = Field(..., ge=0, description="Price in Indian Rupees (Rs.)")
    unit: str = Field("per piece", description="e.g. per piece, per kg, per order, per hour, per month")
    location_city: Optional[str] = Field("Jaipur", description="City of the entrepreneur")
    accepts_custom: bool = Field(False, description="Accepts custom orders")
    image_emoji: str = Field("📦", description="Display emoji icon representing product")


class ProductUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=150)
    description: Optional[str] = Field(None, max_length=1500)
    category: Optional[str] = None
    price: Optional[float] = Field(None, ge=0)
    unit: Optional[str] = None
    location_city: Optional[str] = None
    accepts_custom: Optional[bool] = None
    is_available: Optional[bool] = None
    image_emoji: Optional[str] = None


class ProductResponse(BaseModel):
    id: str
    entrepreneur_id: str
    entrepreneur_name: str
    business_name: str
    whatsapp_number: Optional[str] = None
    title: str
    description: str
    category: str
    price: float
    unit: str
    location_city: str
    accepts_custom: bool = False
    is_available: bool = True
    image_emoji: str = "📦"
    rating: float = 4.8
    review_count: int = 12
    created_at: str


class ProductFilterParams(BaseModel):
    category: Optional[str] = None
    city: Optional[str] = None
    search: Optional[str] = None
    max_price: Optional[float] = None
