"""
BuildHer Backend - Payments & Safety Schemas (Phase 8)
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ─── UPI & Payments ─────────────────────────────────────────────────────────

class UPIPaymentRequest(BaseModel):
    order_id: str
    payer_vpa: Optional[str] = Field(None, description="Customer UPI VPA if known, e.g. buyer@okaxis")


class UPIPaymentResponse(BaseModel):
    order_id: str
    amount: float
    payee_vpa: str          # e.g. "buildher.sunita@upi"
    payee_name: str         # e.g. "Sunita Devi (Maa Ki Rasoi)"
    upi_intent_url: str     # upi://pay?pa=...
    transaction_ref: str
    qr_data_string: str
    instructions: List[str]


class PaymentVerifyRequest(BaseModel):
    order_id: str
    transaction_ref: str
    utr_number: Optional[str] = Field(None, description="12-digit UPI UTR reference number")


class PaymentVerifyResponse(BaseModel):
    order_id: str
    is_verified: bool
    status: str
    message: str


# ─── Reviews & Ratings ──────────────────────────────────────────────────────

class ReviewCreateRequest(BaseModel):
    product_id: str
    order_id: Optional[str] = None
    rating: int = Field(5, ge=1, le=5)
    comment: str = Field(..., min_length=4, max_length=500)


class ReviewResponse(BaseModel):
    id: str
    product_id: str
    reviewer_name: str
    rating: int
    comment: str
    created_at: str


# ─── Safety & Trust ─────────────────────────────────────────────────────────

class SafetyReportRequest(BaseModel):
    order_id: Optional[str] = None
    reported_user: str = Field(..., description="Name or phone of the person being reported")
    issue_type: str = Field(..., description="harassment, payment_fraud, inappropriate_behavior, other")
    details: str = Field(..., min_length=10, max_length=1000)


class SafetyReportResponse(BaseModel):
    report_id: str
    status: str
    message: str
    helpline_numbers: List[str]


class SafetyGuidelineItem(BaseModel):
    title: str
    icon: str
    description: str
    bullet_points: List[str]
