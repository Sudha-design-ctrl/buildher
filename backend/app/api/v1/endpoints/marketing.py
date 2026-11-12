"""
BuildHer Backend - Marketing Endpoints (Phase 5)

Routes:
  POST /api/v1/marketing/generate  — Generate social media & WhatsApp marketing copies
  GET  /api/v1/marketing/templates — Retrieve pre-made festive & discount templates
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.marketing import (
    MarketingGenerateRequest,
    MarketingGenerateResponse,
    MarketingTemplateItem,
)
from app.services.marketing_service import (
    generate_marketing_content,
    PREMADE_TEMPLATES,
)
from app.core.security import get_current_user

router = APIRouter(prefix="/marketing", tags=["Marketing"])


@router.post("/generate", response_model=MarketingGenerateResponse)
async def generate_marketing(
    req: MarketingGenerateRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Generate tailored promotional captions, status messages, and hashtags
    for WhatsApp, Instagram, or Facebook using AI (or localized rule-based fallback).
    """
    try:
        return await generate_marketing_content(req)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Marketing copy generation failed: {str(e)}",
        )


@router.get("/templates", response_model=List[MarketingTemplateItem])
async def get_templates(
    current_user: dict = Depends(get_current_user),
):
    """
    Get ready-to-copy marketing templates for festivals, weekend specials,
    new launches, and customer appreciation.
    """
    return PREMADE_TEMPLATES
