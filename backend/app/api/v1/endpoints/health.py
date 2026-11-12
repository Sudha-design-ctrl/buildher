"""
BuildHer Backend - Health Check Endpoint

Provides a simple health check to verify the API is running.
"""

from datetime import datetime, timezone
from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    """
    Health check endpoint.

    Returns the API status, version, and current server timestamp.
    Used by the mobile app and monitoring tools to verify connectivity.
    """
    return {
        "status": "healthy",
        "service": "BuildHer API",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "phase": "Phase 1 - Foundation",
        "features": {
            "authentication": False,
            "ai_services": False,
            "marketplace": False,
            "payments": False,
        },
    }
