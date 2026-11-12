"""
BuildHer Backend - Business Profile & Pricing Schemas (Phase 4)
"""

from pydantic import BaseModel, Field
from typing import Optional, List


# ---------------------------------------------------------------------------
# Business Profile
# ---------------------------------------------------------------------------

class BusinessProfileUpdate(BaseModel):
    business_name: Optional[str] = Field(None, max_length=120)
    tagline: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    category: Optional[str] = None
    location_city: Optional[str] = None
    location_state: Optional[str] = None
    whatsapp_number: Optional[str] = None
    instagram_handle: Optional[str] = None
    years_in_business: Optional[int] = Field(None, ge=0, le=50)
    accepts_custom_orders: Optional[bool] = None
    delivery_available: Optional[bool] = None


class BusinessProfileResponse(BaseModel):
    user_id: str
    business_name: Optional[str] = None
    tagline: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    location_city: Optional[str] = None
    location_state: Optional[str] = None
    whatsapp_number: Optional[str] = None
    instagram_handle: Optional[str] = None
    years_in_business: Optional[int] = None
    accepts_custom_orders: bool = False
    delivery_available: bool = False
    profile_completeness: int = 0  # 0-100 percentage


# ---------------------------------------------------------------------------
# Pricing Calculator
# ---------------------------------------------------------------------------

class PricingCalculatorRequest(BaseModel):
    product_name: str = Field(..., min_length=2, max_length=120)
    category: str
    material_cost: float = Field(..., ge=0, description="Cost of raw materials in Rs.")
    time_hours: float = Field(..., ge=0.1, description="Time to make one unit (hours)")
    hourly_wage: float = Field(10.0, ge=1, description="Desired hourly wage in Rs.")
    overhead_percent: float = Field(10.0, ge=0, le=100, description="Overhead as % of cost")
    desired_profit_percent: float = Field(30.0, ge=0, le=200, description="Profit margin %")
    packaging_cost: float = Field(0.0, ge=0)
    delivery_cost: float = Field(0.0, ge=0)


class PricePlan(BaseModel):
    label: str           # e.g. "Minimum", "Recommended", "Premium"
    price: float
    description: str


class PricingCalculatorResponse(BaseModel):
    product_name: str
    category: str
    cost_breakdown: dict
    total_cost: float
    price_plans: List[PricePlan]
    recommended_price: float
    profit_at_recommended: float
    profit_margin_percent: float
    tips: List[str]
