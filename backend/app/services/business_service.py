"""
BuildHer Backend - Business Service (Phase 4)

Handles business profile storage and pricing calculations.
"""

from typing import Optional, Dict, Any
from app.schemas.business import (
    BusinessProfileUpdate,
    BusinessProfileResponse,
    PricingCalculatorRequest,
    PricingCalculatorResponse,
    PricePlan,
)

# ---------------------------------------------------------------------------
# In-memory business profile store (keyed by user_id)
# ---------------------------------------------------------------------------
_business_profiles: Dict[str, Dict[str, Any]] = {}


def get_business_profile(user_id: str) -> BusinessProfileResponse:
    """Return business profile for a user, creating empty one if missing."""
    data = _business_profiles.get(user_id, {})
    completeness = _calc_completeness(data)
    return BusinessProfileResponse(
        user_id=user_id,
        business_name=data.get("business_name"),
        tagline=data.get("tagline"),
        description=data.get("description"),
        category=data.get("category"),
        location_city=data.get("location_city"),
        location_state=data.get("location_state"),
        whatsapp_number=data.get("whatsapp_number"),
        instagram_handle=data.get("instagram_handle"),
        years_in_business=data.get("years_in_business"),
        accepts_custom_orders=data.get("accepts_custom_orders", False),
        delivery_available=data.get("delivery_available", False),
        profile_completeness=completeness,
    )


def update_business_profile(user_id: str, update: BusinessProfileUpdate) -> BusinessProfileResponse:
    """Merge update fields into the stored profile."""
    existing = _business_profiles.get(user_id, {})
    patch = update.model_dump(exclude_none=True)
    existing.update(patch)
    _business_profiles[user_id] = existing
    return get_business_profile(user_id)


def _calc_completeness(data: Dict[str, Any]) -> int:
    """Calculate profile completeness as a 0-100 integer."""
    fields = [
        "business_name", "tagline", "description", "category",
        "location_city", "whatsapp_number", "years_in_business",
    ]
    filled = sum(1 for f in fields if data.get(f))
    return int((filled / len(fields)) * 100)


# ---------------------------------------------------------------------------
# Pricing Calculator (pure logic, no AI needed)
# ---------------------------------------------------------------------------

PRICING_TIPS: Dict[str, list] = {
    "Cooking & Food": [
        "Add Rs. 10-20 packaging cost for hygienic tiffin boxes.",
        "Charge more for custom/special occasion orders.",
        "Offer a weekly subscription for 10% discount — builds loyalty.",
    ],
    "Tailoring & Fashion": [
        "Charge separately for fabric if customer brings their own.",
        "Rush orders (within 24 hrs) can be priced 30-50% higher.",
        "Blouse stitching market rate in metros: Rs. 400-800.",
    ],
    "Crafts & Handmade": [
        "Never price below material cost + 2x time.",
        "Handmade products carry a premium — highlight uniqueness.",
        "Festive season (Diwali, Dussehra) allows 20-40% premium pricing.",
    ],
    "Beauty & Wellness": [
        "Bridal packages command 3-5x regular service price.",
        "Home visits can be priced 20-30% higher than salon rates.",
        "Offer combo packages to increase average order value.",
    ],
    "Tutoring & Education": [
        "Group classes (3-5 students) allow lower per-student price with higher total earning.",
        "Weekend and evening slots are premium — price 10-15% higher.",
        "Offer a free trial class to build trust.",
    ],
    "default": [
        "Research competitor prices in your locality before finalizing.",
        "Review and revise your prices every 6 months.",
        "Never compete only on price — focus on quality and trust.",
    ],
}


def calculate_pricing(req: PricingCalculatorRequest) -> PricingCalculatorResponse:
    """
    Calculate recommended pricing based on cost-plus model.

    Formula:
        labour_cost      = time_hours × hourly_wage
        total_direct     = material_cost + labour_cost + packaging_cost + delivery_cost
        overhead         = total_direct × (overhead_percent / 100)
        total_cost       = total_direct + overhead
        recommended      = total_cost × (1 + desired_profit_percent / 100)
    """
    labour_cost = round(req.time_hours * req.hourly_wage, 2)
    total_direct = round(
        req.material_cost + labour_cost + req.packaging_cost + req.delivery_cost, 2
    )
    overhead = round(total_direct * (req.overhead_percent / 100), 2)
    total_cost = round(total_direct + overhead, 2)

    # Three price plans
    minimum_price = round(total_cost * 1.05, 2)        # 5% — just above breakeven
    recommended_price = round(total_cost * (1 + req.desired_profit_percent / 100), 2)
    premium_price = round(recommended_price * 1.35, 2) # 35% above recommended

    profit_at_recommended = round(recommended_price - total_cost, 2)
    profit_margin = round((profit_at_recommended / recommended_price) * 100, 1) if recommended_price > 0 else 0.0

    plans = [
        PricePlan(
            label="Minimum",
            price=minimum_price,
            description="Barely covers costs. Use only to attract first customers.",
        ),
        PricePlan(
            label="Recommended",
            price=recommended_price,
            description=f"Covers all costs with {req.desired_profit_percent:.0f}% profit. Best for steady business.",
        ),
        PricePlan(
            label="Premium",
            price=premium_price,
            description="For high-quality, custom or rush orders. Justified by extra value.",
        ),
    ]

    # Pick tips for category or default
    tips = PRICING_TIPS.get(req.category, PRICING_TIPS["default"])

    return PricingCalculatorResponse(
        product_name=req.product_name,
        category=req.category,
        cost_breakdown={
            "material_cost": req.material_cost,
            "labour_cost": labour_cost,
            "packaging_cost": req.packaging_cost,
            "delivery_cost": req.delivery_cost,
            "overhead": overhead,
        },
        total_cost=total_cost,
        price_plans=plans,
        recommended_price=recommended_price,
        profit_at_recommended=profit_at_recommended,
        profit_margin_percent=profit_margin,
        tips=tips,
    )
