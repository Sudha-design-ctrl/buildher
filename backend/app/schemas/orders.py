"""
BuildHer Backend - Orders & Communication Schemas (Phase 7)
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class OrderCreateRequest(BaseModel):
    product_id: str
    quantity: int = Field(1, ge=1, le=100)
    delivery_address: str = Field(..., min_length=5, max_length=300)
    contact_phone: str = Field(..., min_length=10, max_length=15)
    special_instructions: Optional[str] = Field(None, max_length=500)
    payment_method: str = Field("cod", description="cod (Cash on Delivery) or upi (UPI Pay on Delivery)")


class OrderStatusUpdate(BaseModel):
    status: str = Field(..., description="pending, accepted, in_progress, completed, cancelled")


class ChatMessageCreate(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)


class ChatMessageResponse(BaseModel):
    id: str
    order_id: str
    sender_id: str
    sender_name: str
    sender_role: str        # "customer" or "entrepreneur"
    message: str
    timestamp: str


class OrderResponse(BaseModel):
    id: str
    customer_id: str
    customer_name: str
    entrepreneur_id: str
    entrepreneur_name: str
    business_name: str
    product_id: str
    product_title: str
    product_price: float
    quantity: int
    total_amount: float
    delivery_address: str
    contact_phone: str
    special_instructions: Optional[str] = None
    status: str             # pending, accepted, in_progress, completed, cancelled
    payment_method: str
    created_at: str
    messages: List[ChatMessageResponse] = []
