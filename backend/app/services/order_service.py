"""
BuildHer Backend - Order & Chat Service (Phase 7)

Handles order placement, lifecycle status transitions, and in-app buyer-seller chat.
"""

import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from app.schemas.orders import (
    OrderCreateRequest,
    OrderResponse,
    ChatMessageResponse,
)
from app.services.marketplace_service import get_product

# ─────────────────────────────────────────────────────────────────────────────
# In-Memory Orders & Chat Store
# ─────────────────────────────────────────────────────────────────────────────
_orders: Dict[str, Dict[str, Any]] = {
    "ord_1001": {
        "id": "ord_1001",
        "customer_id": "usr_cust_seed",
        "customer_name": "Rohan Mehra",
        "entrepreneur_id": "usr_seed_1",
        "entrepreneur_name": "Sunita Devi",
        "business_name": "Maa Ki Rasoi Tiffins",
        "product_id": "prod_101",
        "product_title": "Home-Cooked North Indian Lunch Tiffin",
        "product_price": 120.0,
        "quantity": 2,
        "total_amount": 240.0,
        "delivery_address": "Flat 302, Green Valley Apartments, Malviya Nagar, Jaipur",
        "contact_phone": "+919829911223",
        "special_instructions": "Please pack extra green chutney if possible.",
        "status": "completed",
        "payment_method": "cod",
        "created_at": "2026-11-08T12:30:00",
        "messages": [
            {
                "id": "msg_1",
                "order_id": "ord_1001",
                "sender_id": "usr_cust_seed",
                "sender_name": "Rohan Mehra",
                "sender_role": "customer",
                "message": "Hello Sunita ji, please ensure the rotis are soft and without ghee.",
                "timestamp": "2026-11-08T12:35:00",
            },
            {
                "id": "msg_2",
                "order_id": "ord_1001",
                "sender_id": "usr_seed_1",
                "sender_name": "Sunita Devi",
                "sender_role": "entrepreneur",
                "message": "Namaste bhai saheb! Yes, I have prepared fresh plain phulkas and included extra mint chutney.",
                "timestamp": "2026-11-08T12:45:00",
            },
            {
                "id": "msg_3",
                "order_id": "ord_1001",
                "sender_id": "usr_cust_seed",
                "sender_name": "Rohan Mehra",
                "sender_role": "customer",
                "message": "Thank you so much! Food was delicious 🙏",
                "timestamp": "2026-11-08T13:40:00",
            },
        ],
    },
    "ord_1002": {
        "id": "ord_1002",
        "customer_id": "usr_cust_seed",
        "customer_name": "Rohan Mehra",
        "entrepreneur_id": "usr_seed_3",
        "entrepreneur_name": "Meenakshi Joshi",
        "business_name": "Mitti Kala Crafts",
        "product_id": "prod_103",
        "product_title": "Handpainted Terracotta Diya Set (Pack of 6)",
        "product_price": 240.0,
        "quantity": 3,
        "total_amount": 720.0,
        "delivery_address": "B-42, Tilak Nagar, Jaipur",
        "contact_phone": "+919829911223",
        "special_instructions": "Need gift wrapping if available.",
        "status": "in_progress",
        "payment_method": "upi",
        "created_at": "2026-11-10T15:00:00",
        "messages": [
            {
                "id": "msg_4",
                "order_id": "ord_1002",
                "sender_id": "usr_cust_seed",
                "sender_name": "Rohan Mehra",
                "sender_role": "customer",
                "message": "Hi Meenakshi ji, could you please use floral gift wrap for this order?",
                "timestamp": "2026-11-10T15:10:00",
            },
            {
                "id": "msg_5",
                "order_id": "ord_1002",
                "sender_id": "usr_seed_3",
                "sender_name": "Meenakshi Joshi",
                "sender_role": "entrepreneur",
                "message": "Hello! Yes absolutely, I will pack them safely in handmade paper wrap. Working on them now!",
                "timestamp": "2026-11-10T15:30:00",
            },
        ],
    },
}


def create_order(customer_id: str, customer_name: str, req: OrderCreateRequest) -> Optional[OrderResponse]:
    """Create a new customer order for a product."""
    product = get_product(req.product_id)
    if not product:
        return None

    order_id = f"ord_{uuid.uuid4().hex[:8]}"
    total_amount = round(product.price * req.quantity, 2)

    order_data = {
        "id": order_id,
        "customer_id": customer_id,
        "customer_name": customer_name,
        "entrepreneur_id": product.entrepreneur_id,
        "entrepreneur_name": product.entrepreneur_name,
        "business_name": product.business_name,
        "product_id": product.id,
        "product_title": product.title,
        "product_price": product.price,
        "quantity": req.quantity,
        "total_amount": total_amount,
        "delivery_address": req.delivery_address,
        "contact_phone": req.contact_phone,
        "special_instructions": req.special_instructions,
        "status": "pending",
        "payment_method": req.payment_method,
        "created_at": datetime.utcnow().isoformat(),
        "messages": [
            {
                "id": f"msg_{uuid.uuid4().hex[:6]}",
                "order_id": order_id,
                "sender_id": customer_id,
                "sender_name": customer_name,
                "sender_role": "customer",
                "message": f"Hello {product.entrepreneur_name}! I have placed order #{order_id} for {req.quantity}x {product.title}. Looking forward to receiving it!",
                "timestamp": datetime.utcnow().isoformat(),
            }
        ],
    }
    _orders[order_id] = order_data
    return OrderResponse(**order_data)


def get_order_by_id(order_id: str, user_id: str) -> Optional[OrderResponse]:
    """Get single order if user is either the customer or entrepreneur."""
    order = _orders.get(order_id)
    if not order:
        return None
    # Check authorization (must be buyer or seller)
    if order["customer_id"] != user_id and order["entrepreneur_id"] != user_id:
        return None
    return OrderResponse(**order)


def list_user_orders(user_id: str, role: str) -> List[OrderResponse]:
    """List orders for either customer or entrepreneur."""
    results = []
    for o in _orders.values():
        if role == "customer" and o.get("customer_id") == user_id:
            results.append(OrderResponse(**o))
        elif role == "entrepreneur" and o.get("entrepreneur_id") == user_id:
            results.append(OrderResponse(**o))
        elif o.get("customer_id") == user_id or o.get("entrepreneur_id") == user_id:
            results.append(OrderResponse(**o))

    # Sort newest first
    results.sort(key=lambda x: x.created_at, reverse=True)
    return results


def update_order_status(order_id: str, user_id: str, new_status: str) -> Optional[OrderResponse]:
    """Transition order status (pending, accepted, in_progress, completed, cancelled)."""
    order = _orders.get(order_id)
    if not order:
        return None

    # Customer can only cancel
    if order["customer_id"] == user_id and new_status == "cancelled":
        order["status"] = "cancelled"
    elif order["entrepreneur_id"] == user_id:
        valid_statuses = ["accepted", "in_progress", "completed", "cancelled"]
        if new_status in valid_statuses:
            order["status"] = new_status
    else:
        return None

    _orders[order_id] = order
    return OrderResponse(**order)


def add_chat_message(
    order_id: str,
    sender_id: str,
    sender_name: str,
    sender_role: str,
    text: str,
) -> Optional[ChatMessageResponse]:
    """Add message to an order chat thread."""
    order = _orders.get(order_id)
    if not order:
        return None

    if order["customer_id"] != sender_id and order["entrepreneur_id"] != sender_id:
        return None

    msg_id = f"msg_{uuid.uuid4().hex[:6]}"
    msg = {
        "id": msg_id,
        "order_id": order_id,
        "sender_id": sender_id,
        "sender_name": sender_name,
        "sender_role": sender_role,
        "message": text.strip(),
        "timestamp": datetime.utcnow().isoformat(),
    }
    order["messages"].append(msg)
    _orders[order_id] = order
    return ChatMessageResponse(**msg)
