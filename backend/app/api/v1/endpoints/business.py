"""
BuildHer Backend - Business Profile & Pricing Endpoints (Phase 4)

Routes:
  GET  /api/v1/business/profile              — get current user's business profile
  PUT  /api/v1/business/profile              — update business profile
  POST /api/v1/business/pricing-calculator   — calculate product pricing
"""

from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.business import (
    BusinessProfileUpdate,
    BusinessProfileResponse,
    PricingCalculatorRequest,
    PricingCalculatorResponse,
)
from app.services.business_service import (
    get_business_profile,
    update_business_profile,
    calculate_pricing,
)
from app.core.security import get_current_user

router = APIRouter(prefix="/business", tags=["Business"])


@router.get("/profile", response_model=BusinessProfileResponse)
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get the authenticated user's business profile."""
    return get_business_profile(current_user["sub"])


@router.put("/profile", response_model=BusinessProfileResponse)
async def update_profile(
    update: BusinessProfileUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update (patch) the authenticated user's business profile."""
    return update_business_profile(current_user["sub"], update)


@router.post("/pricing-calculator", response_model=PricingCalculatorResponse)
async def pricing_calculator(
    req: PricingCalculatorRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Calculate fair pricing for a product/service using cost-plus model.
    Returns minimum, recommended, and premium price plans with tips.
    """
    try:
        return calculate_pricing(req)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Pricing calculation failed: {str(e)}",
        )
