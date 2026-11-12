"""
BuildHer Backend - Orders & Chat Endpoints (Phase 7)

Routes:
  POST /api/v1/orders                      — Create a new order (customer)
  GET  /api/v1/orders/my-orders            — List orders for current user
  GET  /api/v1/orders/{order_id}           — Order details & conversation
  PUT  /api/v1/orders/{order_id}/status    — Transition order status
  POST /api/v1/orders/{order_id}/messages  — Send chat message in order thread
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.orders import (
    OrderCreateRequest,
    OrderStatusUpdate,
    ChatMessageCreate,
    ChatMessageResponse,
    OrderResponse,
)
from app.services.order_service import (
    create_order,
    get_order_by_id,
    list_user_orders,
    update_order_status,
    add_chat_message,
)
from app.core.security import get_current_user

router = APIRouter(prefix="/orders", tags=["Orders & Communication"])


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def place_order(
    req: OrderCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    """Place a new order for a product listed on BuildHer."""
    user_id = current_user["sub"]
    user_name = current_user.get("full_name") or "BuildHer Customer"

    order = create_order(customer_id=user_id, customer_name=user_name, req=req)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or unavailable.",
        )
    return order


@router.get("/my-orders", response_model=List[OrderResponse])
async def get_my_orders(
    current_user: dict = Depends(get_current_user),
):
    """Get all orders where the user is either the customer or the entrepreneur."""
    user_id = current_user["sub"]
    role = current_user.get("role") or "customer"
    return list_user_orders(user_id=user_id, role=role)


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order_details(
    order_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get single order details including full chat conversation thread."""
    order = get_order_by_id(order_id, current_user["sub"])
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found or unauthorized.",
        )
    return order


@router.put("/{order_id}/status", response_model=OrderResponse)
async def change_status(
    order_id: str,
    payload: OrderStatusUpdate,
    current_user: dict = Depends(get_current_user),
):
    """
    Update status of an order:
    - Entrepreneur: accepted, in_progress, completed, cancelled
    - Customer: cancelled
    """
    order = update_order_status(order_id, current_user["sub"], payload.status.lower())
    if not order:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status update failed. Check order ID and transition permissions.",
        )
    return order


@router.post("/{order_id}/messages", response_model=ChatMessageResponse)
async def send_message(
    order_id: str,
    payload: ChatMessageCreate,
    current_user: dict = Depends(get_current_user),
):
    """Send an in-app message in the order chat thread."""
    user_id = current_user["sub"]
    user_name = current_user.get("full_name") or "User"
    user_role = current_user.get("role") or "customer"

    msg = add_chat_message(
        order_id=order_id,
        sender_id=user_id,
        sender_name=user_name,
        sender_role=user_role,
        text=payload.message,
    )
    if not msg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found or you are not a party to this order.",
        )
    return msg
