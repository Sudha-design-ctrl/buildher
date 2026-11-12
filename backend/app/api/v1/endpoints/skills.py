"""
BuildHer Backend - Skill Discovery Endpoints (Phase 3)
"""

from typing import List, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.skills import (
    SkillCategoryInfo,
    SkillQuestionnaireRequest,
    SkillAnalysisResponse,
    SaveSkillsRequest,
    UserSavedSkillsResponse,
)
from app.services.ai_service import analyze_skills_with_ai
from app.core.security import get_current_user
from app.services.firebase_service import save_user_profile, get_user_profile

router = APIRouter(prefix="/skills", tags=["Skill Discovery"])

# Master taxonomy of supported micro-entrepreneur categories
CATEGORIES_CATALOG: List[SkillCategoryInfo] = [
    SkillCategoryInfo(
        id="cooking",
        name="Cooking & Food",
        icon="🍛",
        sample_skills=[
            "Home Tiffin Service",
            "Baking & Cupcakes",
            "Pickles & Masala Powders",
            "Regional Traditional Snacks",
            "Diet & Healthy Salads",
            "Festival Sweets",
        ],
        description="Fresh meals, homemade snacks, baked goods, and traditional food products.",
    ),
    SkillCategoryInfo(
        id="tailoring",
        name="Tailoring & Fashion",
        icon="👗",
        sample_skills=[
            "Blouse Stitching & Embroidery",
            "Salwar & Kurta Custom Stitching",
            "Garment Alterations & Repairs",
            "Eco-friendly Cloth Bags",
            "Cushion Covers & Curtains",
            "Baby Clothing & Quilts",
        ],
        description="Custom garment stitching, quick repairs, and fabric home decor.",
    ),
    SkillCategoryInfo(
        id="crafts",
        name="Crafts & Handmade",
        icon="🏺",
        sample_skills=[
            "Terracotta & Clay Jewelry",
            "Crochet & Knitting",
            "Scented Candles & Diyas",
            "Handmade Soap & Scrub",
            "Jute & Macrame Products",
            "Festival Gift Hampers",
        ],
        description="Handmade jewelry, home decor, eco-friendly crafts, and personalized gifting.",
    ),
    SkillCategoryInfo(
        id="beauty",
        name="Beauty & Wellness",
        icon="💄",
        sample_skills=[
            "Bridal & Festive Mehendi / Henna",
            "Threading & Facial Grooming",
            "Herbal Hair Oil & Scalp Care",
            "Nail Art & Basic Manicure",
            "Saree Draping & Styling",
            "Relaxing Foot Massage",
        ],
        description="Personal grooming, traditional mehendi, and natural wellness treatments.",
    ),
    SkillCategoryInfo(
        id="tutoring",
        name="Tutoring & Education",
        icon="📚",
        sample_skills=[
            "Primary School All-Subjects",
            "Regional Language (Kannada/Hindi)",
            "Vedic Math & Basic Arithmetic",
            "Phonics & Spoken English",
            "Art & Drawing for Kids",
            "Storytelling & After-School Care",
        ],
        description="Academic tutoring, language coaching, and children's creative classes.",
    ),
    SkillCategoryInfo(
        id="other",
        name="Other Local Services",
        icon="🛠️",
        sample_skills=[
            "Pet Sitting & Dog Walking",
            "House Plant Nursery & Plant Care",
            "Event Floral Decor",
            "Elderly Companionship & Errands",
            "Document Typing & Translation",
        ],
        description="Community assistance, urban gardening, and localized support services.",
    ),
]


@router.get("/categories", response_model=List[SkillCategoryInfo])
def get_skill_categories():
    """Retrieve all supported skill categories and sample skills for the questionnaire."""
    return CATEGORIES_CATALOG


@router.post("/analyze", response_model=SkillAnalysisResponse)
def analyze_skills(request: SkillQuestionnaireRequest):
    """
    Analyzes questionnaire responses using AI (OpenAI gpt-4o-mini)
    with automated domain fallback to generate practical business opportunities.
    """
    if not request.primary_category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Primary category is required for skill analysis.",
        )

    response = analyze_skills_with_ai(request)
    return response


@router.post("/save", response_model=UserSavedSkillsResponse)
def save_user_skills(
    request: SaveSkillsRequest,
    current_user: dict = Depends(get_current_user),
):
    """Save identified skills and business opportunities to the user's profile."""
    uid = current_user.get("sub")
    profile = get_user_profile(uid) or {}

    skills_data = {
        "primary_category": request.primary_category,
        "skills": request.skills,
        "experience_level": request.experience_level,
        "available_hours_per_week": request.available_hours_per_week,
        "notes": request.notes,
        "saved_opportunities": request.saved_opportunities or [],
        "updated_at": datetime.utcnow(),
    }

    # Merge into profile
    profile["skills_profile"] = skills_data
    save_user_profile(uid, profile)

    return UserSavedSkillsResponse(
        uid=uid,
        primary_category=request.primary_category,
        skills=request.skills,
        experience_level=request.experience_level,
        available_hours_per_week=request.available_hours_per_week,
        notes=request.notes,
        saved_opportunities=request.saved_opportunities or [],
        updated_at=skills_data["updated_at"],
    )


@router.get("/my-skills", response_model=UserSavedSkillsResponse)
def get_user_skills(current_user: dict = Depends(get_current_user)):
    """Retrieve saved skill profile for the currently logged-in user."""
    uid = current_user.get("sub")
    profile = get_user_profile(uid)

    if not profile or "skills_profile" not in profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No saved skills profile found for this user.",
        )

    sp = profile["skills_profile"]
    return UserSavedSkillsResponse(
        uid=uid,
        primary_category=sp.get("primary_category", ""),
        skills=sp.get("skills", []),
        experience_level=sp.get("experience_level", "Intermediate"),
        available_hours_per_week=sp.get("available_hours_per_week", 10),
        notes=sp.get("notes"),
        saved_opportunities=sp.get("saved_opportunities", []),
        updated_at=sp.get("updated_at"),
    )
