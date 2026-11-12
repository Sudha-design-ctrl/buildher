"""
BuildHer Backend - AI Marketing Content Generator Schemas (Phase 5)
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class MarketingGenerateRequest(BaseModel):
    product_service: str = Field(..., min_length=2, max_length=150, description="Product or service to promote")
    business_name: Optional[str] = Field(None, max_length=120, description="Name of the business")
    platform: str = Field("whatsapp", description="Target platform: whatsapp, instagram, facebook")
    tone: str = Field("friendly", description="Tone: friendly, festive, promotional, professional")
    offer_details: Optional[str] = Field(None, max_length=200, description="Discount or special offer, e.g. 15% off this weekend")
    language: str = Field("en", description="Language: en (English), hi (Hindi), hinglish (Hinglish)")


class MarketingPostOption(BaseModel):
    title: str               # e.g. "Story / Status Hook", "Detailed Post", "Short & Catchy"
    content: str             # Full copy text
    call_to_action: str      # e.g. "DM to order", "WhatsApp us at..."
    hashtags: Optional[List[str]] = None


class MarketingGenerateResponse(BaseModel):
    product_service: str
    platform: str
    tone: str
    language: str
    options: List[MarketingPostOption]
    posting_tips: List[str]
    is_demo_mode: bool = False


class MarketingTemplateItem(BaseModel):
    id: str
    title: str
    category: str            # e.g. "Festive", "Discounts", "New Launch", "Testimonials"
    platform: str
    template_text: str
    suggested_tags: List[str]
