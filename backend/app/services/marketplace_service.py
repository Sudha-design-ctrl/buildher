"""
BuildHer Backend - Local Marketplace Service (Phase 6)

Handles product listings, search & filters, and entrepreneur inventory.
Includes realistic seeded micro-business listings across Indian cities.
"""

import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from app.schemas.marketplace import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
)

# ─────────────────────────────────────────────────────────────────────────────
# In-Memory Marketplace Store (Seed Data)
# ─────────────────────────────────────────────────────────────────────────────
_products: Dict[str, Dict[str, Any]] = {
    "prod_101": {
        "id": "prod_101",
        "entrepreneur_id": "usr_seed_1",
        "entrepreneur_name": "Sunita Devi",
        "business_name": "Maa Ki Rasoi Tiffins",
        "whatsapp_number": "+919829012345",
        "title": "Home-Cooked North Indian Lunch Tiffin",
        "description": "Freshly cooked hot home-style meal with 4 rotis, seasonal sabzi, dal tadka, jeera rice, and homemade pickle. Prepared with pure mustard oil & minimal spices.",
        "category": "Cooking & Food",
        "price": 120.0,
        "unit": "per meal",
        "location_city": "Jaipur",
        "accepts_custom": True,
        "is_available": True,
        "image_emoji": "🍛",
        "rating": 4.9,
        "review_count": 38,
        "created_at": "2026-11-01T10:00:00",
    },
    "prod_102": {
        "id": "prod_102",
        "entrepreneur_id": "usr_seed_2",
        "entrepreneur_name": "Pooja Verma",
        "business_name": "Pooja Designer Boutique",
        "whatsapp_number": "+919876543210",
        "title": "Designer Aari & Maggam Work Blouse",
        "description": "Custom-stitched bridal and festive blouse with hand-embroidered Aari work, zari borders, and princess cut fitting. Send measurements via WhatsApp.",
        "category": "Tailoring & Fashion",
        "price": 750.0,
        "unit": "per stitching",
        "location_city": "Jaipur",
        "accepts_custom": True,
        "is_available": True,
        "image_emoji": "👗",
        "rating": 4.8,
        "review_count": 24,
        "created_at": "2026-11-02T11:30:00",
    },
    "prod_103": {
        "id": "prod_103",
        "entrepreneur_id": "usr_seed_3",
        "entrepreneur_name": "Meenakshi Joshi",
        "business_name": "Mitti Kala Crafts",
        "whatsapp_number": "+919711098765",
        "title": "Handpainted Terracotta Diya Set (Pack of 6)",
        "description": "Eco-friendly clay diyas handpainted with organic vibrant colors and mirror embellishments. Ideal for home decor, gifting, and pooja.",
        "category": "Crafts & Handmade",
        "price": 240.0,
        "unit": "set of 6",
        "location_city": "Jaipur",
        "accepts_custom": False,
        "is_available": True,
        "image_emoji": "🏺",
        "rating": 5.0,
        "review_count": 42,
        "created_at": "2026-11-03T14:15:00",
    },
    "prod_104": {
        "id": "prod_104",
        "entrepreneur_id": "usr_seed_4",
        "entrepreneur_name": "Ananya Sharma",
        "business_name": "Prakriti Herbal Care",
        "whatsapp_number": "+919810055443",
        "title": "Traditional Ubtan Glow Mask (100g)",
        "description": "100% natural handmade face & body ubtan made with chickpea flour, wild turmeric (kasturi manjal), sandalwood, and crushed rose petals. No chemicals.",
        "category": "Beauty & Wellness",
        "price": 180.0,
        "unit": "100g jar",
        "location_city": "Delhi",
        "accepts_custom": False,
        "is_available": True,
        "image_emoji": "💄",
        "rating": 4.7,
        "review_count": 19,
        "created_at": "2026-11-04T09:00:00",
    },
    "prod_105": {
        "id": "prod_105",
        "entrepreneur_id": "usr_seed_5",
        "entrepreneur_name": "Kavita Rao",
        "business_name": "BrightStars Learning",
        "whatsapp_number": "+919980011223",
        "title": "Spoken English & Public Speaking for Kids (Ages 7-14)",
        "description": "Interactive online & home group classes focused on vocabulary, phonics, everyday conversation, and confidence building. 1 hour session, 3 days/week.",
        "category": "Tutoring & Education",
        "price": 600.0,
        "unit": "per month",
        "location_city": "Bengaluru",
        "accepts_custom": True,
        "is_available": True,
        "image_emoji": "📚",
        "rating": 4.9,
        "review_count": 31,
        "created_at": "2026-11-05T16:45:00",
    },
    "prod_106": {
        "id": "prod_106",
        "entrepreneur_id": "usr_seed_6",
        "entrepreneur_name": "Radha Bhati",
        "business_name": "Rangoli & Resin Creations",
        "whatsapp_number": "+919654012398",
        "title": "Handcrafted Floral Resin Coasters (Set of 4)",
        "description": "Stunning heat-resistant epoxy resin coasters preserved with real pressed marigold and rose petals. Gold foil edges for an elegant touch.",
        "category": "Art & Creativity",
        "price": 350.0,
        "unit": "set of 4",
        "location_city": "Jaipur",
        "accepts_custom": True,
        "is_available": True,
        "image_emoji": "🎨",
        "rating": 4.8,
        "review_count": 15,
        "created_at": "2026-11-06T12:00:00",
    },
}


def list_products(
    category: Optional[str] = None,
    city: Optional[str] = None,
    search: Optional[str] = None,
    max_price: Optional[float] = None,
) -> List[ProductResponse]:
    """Retrieve and filter products by category, city, search keyword, and price."""
    results = []
    search_lower = search.strip().lower() if search else None

    for item in _products.values():
        if not item.get("is_available", True):
            continue
        if category and category.lower() != "all" and item.get("category") != category:
            continue
        if city and item.get("location_city", "").lower() != city.lower():
            continue
        if max_price is not None and item.get("price", 0) > max_price:
            continue
        if search_lower:
            text = f"{item.get('title', '')} {item.get('description', '')} {item.get('business_name', '')}".lower()
            if search_lower not in text:
                continue

        results.append(ProductResponse(**item))

    # Sort newest first
    results.sort(key=lambda x: x.created_at, reverse=True)
    return results


def get_product(product_id: str) -> Optional[ProductResponse]:
    """Get single product by ID."""
    item = _products.get(product_id)
    return ProductResponse(**item) if item else None


def list_my_products(user_id: str) -> List[ProductResponse]:
    """List all products owned by a specific entrepreneur."""
    items = [ProductResponse(**p) for p in _products.values() if p.get("entrepreneur_id") == user_id]
    items.sort(key=lambda x: x.created_at, reverse=True)
    return items


def create_product(
    user_id: str,
    user_name: str,
    biz_name: Optional[str],
    phone: Optional[str],
    payload: ProductCreate,
) -> ProductResponse:
    """Create a new product listing."""
    prod_id = f"prod_{uuid.uuid4().hex[:8]}"
    item = {
        "id": prod_id,
        "entrepreneur_id": user_id,
        "entrepreneur_name": user_name,
        "business_name": biz_name or f"{user_name}'s Business",
        "whatsapp_number": phone or "+919876543210",
        "title": payload.title,
        "description": payload.description,
        "category": payload.category,
        "price": payload.price,
        "unit": payload.unit,
        "location_city": payload.location_city or "Jaipur",
        "accepts_custom": payload.accepts_custom,
        "is_available": True,
        "image_emoji": payload.image_emoji or "📦",
        "rating": 5.0,
        "review_count": 1,
        "created_at": datetime.utcnow().isoformat(),
    }
    _products[prod_id] = item
    return ProductResponse(**item)


def update_product(product_id: str, user_id: str, payload: ProductUpdate) -> Optional[ProductResponse]:
    """Update a product listing owned by the user."""
    item = _products.get(product_id)
    if not item or item.get("entrepreneur_id") != user_id:
        return None

    patch = payload.model_dump(exclude_none=True)
    item.update(patch)
    _products[product_id] = item
    return ProductResponse(**item)


def delete_product(product_id: str, user_id: str) -> bool:
    """Delete or deactivate a product listing owned by the user."""
    item = _products.get(product_id)
    if not item or item.get("entrepreneur_id") != user_id:
        return False

    del _products[product_id]
    return True
