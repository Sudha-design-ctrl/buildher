"""
BuildHer Backend - Payment & Safety Endpoints (Phase 8)

Routes:
  POST /api/v1/payments/generate-upi     — Generate UPI Intent & QR data
  POST /api/v1/payments/verify           — Verify UPI payment with UTR
  POST /api/v1/payments/reviews          — Post customer rating & review
  GET  /api/v1/payments/reviews/{id}     — Get product reviews
  POST /api/v1/payments/safety/report    — Submit safety / harassment report
  GET  /api/v1/payments/safety/guidelines — Guidelines for women micro-entrepreneurs
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.payments import (
    UPIPaymentRequest,
    UPIPaymentResponse,
    PaymentVerifyRequest,
    PaymentVerifyResponse,
    ReviewCreateRequest,
    ReviewResponse,
    SafetyReportRequest,
    SafetyReportResponse,
    SafetyGuidelineItem,
)
from app.services.payment_safety_service import (
    generate_upi_payment,
    verify_order_payment,
    add_review,
    get_reviews_for_product,
    submit_safety_report,
    get_safety_guidelines,
)
from app.core.security import get_current_user

router = APIRouter(prefix="/payments", tags=["Payments & Safety"])


@router.post("/generate-upi", response_model=UPIPaymentResponse)
async def create_upi_intent(
    req: UPIPaymentRequest,
    current_user: dict = Depends(get_current_user),
):
    """Generate standard NPCI-compliant UPI Intent for Google Pay, PhonePe, Paytm, BHIM."""
    res = generate_upi_payment(req)
    if not res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found.",
        )
    return res


@router.post("/verify", response_model=PaymentVerifyResponse)
async def verify_payment(
    req: PaymentVerifyRequest,
    current_user: dict = Depends(get_current_user),
):
    """Verify payment and update order record."""
    return verify_order_payment(req)


@router.post("/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def post_review(
    req: ReviewCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    """Submit a customer rating and review for a purchased product."""
    user_name = current_user.get("full_name") or "Verified Buyer"
    return add_review(reviewer_name=user_name, req=req)


@router.get("/reviews/{product_id}", response_model=List[ReviewResponse])
async def list_reviews(product_id: str):
    """Get all customer reviews and ratings for a marketplace product."""
    return get_reviews_for_product(product_id)


@router.post("/safety/report", response_model=SafetyReportResponse)
async def report_safety_incident(
    req: SafetyReportRequest,
    current_user: dict = Depends(get_current_user),
):
    """Confidentially report harassment, non-payment, or suspicious behavior."""
    return submit_safety_report(reporter_id=current_user["sub"], req=req)


@router.get("/safety/guidelines", response_model=List[SafetyGuidelineItem])
async def fetch_safety_guidelines():
    """Retrieve safety guidelines and fraud prevention rules for women micro-entrepreneurs."""
    return get_safety_guidelines()
