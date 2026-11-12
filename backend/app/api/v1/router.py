"""
BuildHer Backend - API v1 Router

Aggregates all v1 endpoint routers.
"""

from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, skills, business, marketing, marketplace, orders, payments

api_router = APIRouter(prefix="/api/v1")

# Health check - no authentication required
api_router.include_router(health.router, tags=["Health"])

# Phase 2: Authentication endpoints
api_router.include_router(auth.router)

# Phase 3: Skill discovery endpoints
api_router.include_router(skills.router)

# Phase 4: Business profile & pricing endpoints
api_router.include_router(business.router)

# Phase 5: Marketing endpoints
api_router.include_router(marketing.router)

# Phase 6: Marketplace endpoints
api_router.include_router(marketplace.router)

# Phase 7: Orders & communication endpoints
api_router.include_router(orders.router)

# Phase 8: Payments & safety endpoints
api_router.include_router(payments.router)
