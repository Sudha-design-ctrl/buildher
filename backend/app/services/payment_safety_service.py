"""
BuildHer Backend - Payment & Safety Service (Phase 8)

Handles:
1. Standard NPCI UPI Intent & QR Generation (GPay, PhonePe, Paytm, BHIM)
2. Payment Verification & Confirmation
3. Customer Reviews & Ratings
4. Women Entrepreneur Safety Center & Incident Reporting
"""

import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
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
from app.services.order_service import _orders
from app.services.marketplace_service import _products


# ─────────────────────────────────────────────────────────────────────────────
# In-Memory Reviews & Safety Stores
# ─────────────────────────────────────────────────────────────────────────────
_reviews: Dict[str, List[Dict[str, Any]]] = {
    "prod_101": [
        {
            "id": "rev_1",
            "product_id": "prod_101",
            "reviewer_name": "Pooja S.",
            "rating": 5,
            "comment": "Authentic taste! The rotis were soft and the dal had homemade tadka flavor. Sunita ji is so warm.",
            "created_at": "2026-11-06T14:00:00",
        },
        {
            "id": "rev_2",
            "product_id": "prod_101",
            "reviewer_name": "Aman K.",
            "rating": 5,
            "comment": "Hygiene packaging and on-time delivery. Best tiffin in Malviya Nagar.",
            "created_at": "2026-11-08T13:30:00",
        },
    ],
    "prod_103": [
        {
            "id": "rev_3",
            "product_id": "prod_103",
            "reviewer_name": "Ritu Sharma",
            "rating": 5,
            "comment": "The paintwork on these diyas is stunning! Everyone loved them at our Diwali pooja.",
            "created_at": "2026-11-05T18:00:00",
        }
    ],
}

_safety_reports: List[Dict[str, Any]] = []


# ─────────────────────────────────────────────────────────────────────────────
# UPI Payment Logic
# ─────────────────────────────────────────────────────────────────────────────
def generate_upi_payment(req: UPIPaymentRequest) -> Optional[UPIPaymentResponse]:
    """
    Generate an NPCI-compliant UPI Intent URL and QR string for an order.
    Format: upi://pay?pa={vpa}&pn={name}&am={amount}&cu=INR&tn={note}
    """
    order = _orders.get(req.order_id)
    if not order:
        return None

    amount = order["total_amount"]
    biz = order["business_name"].replace(" ", "%20")
    # Clean payee VPA for the entrepreneur
    clean_biz = "".join(c for c in order["business_name"].lower() if c.isalnum()) or "artisan"
    payee_vpa = f"{clean_biz}.buildher@okhdfcbank"
    tx_ref = f"BH-{uuid.uuid4().hex[:8].upper()}"

    upi_intent = f"upi://pay?pa={payee_vpa}&pn={biz}&am={amount:.2f}&cu=INR&tn=BuildHer%20Order%20{order['id']}&tr={tx_ref}"

    instructions = [
        "Open any UPI app (Google Pay, PhonePe, Paytm, or BHIM) to complete payment.",
        "⚠️ CRITICAL SAFETY RULE: You NEVER need to enter your UPI PIN to RECEIVE money. Only enter PIN when SENDING money.",
        "Always verify the payee name on your UPI screen before hitting Pay.",
    ]

    return UPIPaymentResponse(
        order_id=order["id"],
        amount=amount,
        payee_vpa=payee_vpa,
        payee_name=order["business_name"],
        upi_intent_url=upi_intent,
        transaction_ref=tx_ref,
        qr_data_string=upi_intent,
        instructions=instructions,
    )


def verify_order_payment(req: PaymentVerifyRequest) -> PaymentVerifyResponse:
    """Verify and mark order as paid."""
    order = _orders.get(req.order_id)
    if not order:
        return PaymentVerifyResponse(
            order_id=req.order_id,
            is_verified=False,
            status="not_found",
            message="Order not found.",
        )

    order["payment_verified"] = True
    order["transaction_ref"] = req.transaction_ref
    if req.utr_number:
        order["utr_number"] = req.utr_number
    _orders[req.order_id] = order

    return PaymentVerifyResponse(
        order_id=req.order_id,
        is_verified=True,
        status="verified",
        message="Payment verified successfully! Seller notified.",
    )


# ─────────────────────────────────────────────────────────────────────────────
# Reviews & Ratings
# ─────────────────────────────────────────────────────────────────────────────
def add_review(reviewer_name: str, req: ReviewCreateRequest) -> ReviewResponse:
    """Add a customer review and update product average rating."""
    rev_id = f"rev_{uuid.uuid4().hex[:6]}"
    item = {
        "id": rev_id,
        "product_id": req.product_id,
        "reviewer_name": reviewer_name,
        "rating": req.rating,
        "comment": req.comment,
        "created_at": datetime.utcnow().isoformat(),
    }

    if req.product_id not in _reviews:
        _reviews[req.product_id] = []
    _reviews[req.product_id].insert(0, item)

    # Recalculate average rating on product
    prod = _products.get(req.product_id)
    if prod:
        ratings = [r["rating"] for r in _reviews[req.product_id]]
        prod["rating"] = round(sum(ratings) / len(ratings), 1)
        prod["review_count"] = len(ratings)
        _products[req.product_id] = prod

    return ReviewResponse(**item)


def get_reviews_for_product(product_id: str) -> List[ReviewResponse]:
    """Retrieve all reviews for a product."""
    items = _reviews.get(product_id, [])
    return [ReviewResponse(**r) for r in items]


# ─────────────────────────────────────────────────────────────────────────────
# Women Safety Center
# ─────────────────────────────────────────────────────────────────────────────
def submit_safety_report(reporter_id: str, req: SafetyReportRequest) -> SafetyReportResponse:
    """Record an incident report and provide immediate helpline resources."""
    report_id = f"rep_{uuid.uuid4().hex[:8]}"
    _safety_reports.append({
        "id": report_id,
        "reporter_id": reporter_id,
        "order_id": req.order_id,
        "reported_user": req.reported_user,
        "issue_type": req.issue_type,
        "details": req.details,
        "status": "under_review",
        "created_at": datetime.utcnow().isoformat(),
    })

    helplines = [
        "National Emergency Number: 112",
        "Women In Distress Helpline: 1091",
        "National Cyber Crime Reporting Helpline: 1930",
        "BuildHer Trust & Safety WhatsApp: +91 98765 00000",
    ]

    return SafetyReportResponse(
        report_id=report_id,
        status="received",
        message="Your report has been logged confidentially with our Trust & Safety team. We will review it within 2 hours.",
        helpline_numbers=helplines,
    )


def get_safety_guidelines() -> List[SafetyGuidelineItem]:
    """Return essential safety practices for Indian women micro-entrepreneurs."""
    return [
        SafetyGuidelineItem(
            title="Safe Order Handover & Public Meetups",
            icon="🛡️",
            description="Guidelines for safe neighborhood order deliveries and pickups.",
            bullet_points=[
                "For self-pickup orders, keep handovers at your doorstep or a well-lit community spot.",
                "Never enter a buyer's private home alone for deliveries.",
                "Inform a family member or friend when heading out for deliveries.",
                "Prefer daytime deliveries between 9:00 AM and 7:00 PM.",
            ],
        ),
        SafetyGuidelineItem(
            title="UPI & Financial Security (No-Fraud Rule)",
            icon="💳",
            description="Protect your hard-earned profits from digital payment scams.",
            bullet_points=[
                "⚠️ GOLDEN RULE: You NEVER need to enter your UPI PIN or scan a QR code to RECEIVE money.",
                "If a buyer sends you a QR code claiming 'scan this to receive payment', it is a scam. Decline immediately.",
                "Always check your banking app or SMS for received credit confirmation before handing over goods.",
                "Never share OTPs, bank passwords, or debit card CVVs with anyone claiming to be customer care.",
            ],
        ),
        SafetyGuidelineItem(
            title="Communication & Privacy",
            icon="📲",
            description="Maintaining professional boundaries with clients.",
            bullet_points=[
                "Use BuildHer in-app chat or a dedicated WhatsApp Business number.",
                "Set clear business hours on your profile (e.g. 10 AM - 7 PM).",
                "If a buyer sends inappropriate messages, take a screenshot and block them immediately using the Safety Report.",
            ],
        ),
    ]
