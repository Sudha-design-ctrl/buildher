"""
BuildHer Backend - Local Marketplace Endpoints (Phase 6)

Routes:
  GET    /api/v1/marketplace/products           — Explore products (public)
  GET    /api/v1/marketplace/products/{id}      — Product details (public)
  POST   /api/v1/marketplace/products           — Add new product (entrepreneur)
  GET    /api/v1/marketplace/my-listings        — Entrepreneur's listings
  PUT    /api/v1/marketplace/products/{id}      — Edit product (owner)
  DELETE /api/v1/marketplace/products/{id}      — Delete product (owner)
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.schemas.marketplace import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
)
from app.services.marketplace_service import (
    list_products,
    get_product,
    list_my_products,
    create_product,
    update_product,
    delete_product,
)
from app.services.firebase_service import get_user_profile
from app.core.security import get_current_user

router = APIRouter(prefix="/marketplace", tags=["Marketplace"])


@router.get("/products", response_model=List[ProductResponse])
async def get_all_products(
    category: Optional[str] = Query(None, description="Category filter"),
    city: Optional[str] = Query(None, description="City filter"),
    search: Optional[str] = Query(None, description="Keyword search in title & description"),
    max_price: Optional[float] = Query(None, description="Maximum price limit in Rs."),
):
    """
    Public marketplace catalog with instant search, category filtering, and city filtering.
    """
    return list_products(category=category, city=city, search=search, max_price=max_price)


@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product_details(product_id: str):
    """Get complete details for a single product."""
    prod = get_product(product_id)
    if not prod:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    return prod


@router.get("/my-listings", response_model=List[ProductResponse])
async def get_my_listings(current_user: dict = Depends(get_current_user)):
    """List all products belonging to the logged-in entrepreneur."""
    return list_my_products(current_user["sub"])


@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_new_product(
    payload: ProductCreate,
    current_user: dict = Depends(get_current_user),
):
    """Add a new product or service listing to the BuildHer marketplace."""
    user_id = current_user["sub"]
    user_name = current_user.get("full_name") or "Local Entrepreneur"
    
    # Check profile for business name & WhatsApp
    profile = get_user_profile(user_id) or {}
    biz_name = profile.get("business_name") or f"{user_name}'s Studio"
    phone = profile.get("phone") or "+919876543210"

    return create_product(
        user_id=user_id,
        user_name=user_name,
        biz_name=biz_name,
        phone=phone,
        payload=payload,
    )


@router.put("/products/{product_id}", response_model=ProductResponse)
async def edit_product(
    product_id: str,
    payload: ProductUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Edit an existing product listing."""
    res = update_product(product_id, current_user["sub"], payload)
    if not res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or you are not authorized to edit it.",
        )
    return res


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_product(
    product_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a product listing."""
    success = delete_product(product_id, current_user["sub"])
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or not authorized to delete.",
        )
    return None
