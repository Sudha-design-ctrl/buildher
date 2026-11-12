"""
BuildHer Backend - Skill Discovery Schemas (Phase 3)
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class SkillCategoryInfo(BaseModel):
    id: str
    name: str
    icon: str
    sample_skills: List[str]
    description: str


class SkillQuestionnaireRequest(BaseModel):
    primary_category: str = Field(..., description="Main category e.g. Cooking, Tailoring, Crafts")
    skills_selected: List[str] = Field(default_factory=list, description="Skills checked by user")
    custom_skills: Optional[str] = Field(None, description="Free text or voice-transcribed skills")
    experience_level: str = Field("Intermediate", description="Beginner, Intermediate, Experienced")
    available_hours_per_week: int = Field(10, ge=1, le=100)
    available_equipment: Optional[str] = Field(None, description="Tools available at home")
    workplace_type: str = Field("Home", description="Home, Dedicated workspace, Doorstep/Client site")
    language: str = Field("en", description="en, kn, hi")


class BusinessOpportunity(BaseModel):
    title: str
    category: str
    description: str
    estimated_startup_cost_range: str
    target_customers: str
    suggested_first_steps: List[str]
    potential_challenges: List[str]
    disclaimer: str = (
        "Estimates are educational guidelines based on general market conditions "
        "and do not guarantee profits or business success."
    )


class SkillAnalysisResponse(BaseModel):
    skill_summary: str
    identified_strengths: List[str]
    recommended_opportunities: List[BusinessOpportunity]
    skills_to_develop: List[str]
    is_demo_mode: bool = False
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class SaveSkillsRequest(BaseModel):
    primary_category: str
    skills: List[str]
    experience_level: str
    available_hours_per_week: int
    notes: Optional[str] = None
    saved_opportunities: Optional[List[Dict[str, Any]]] = None


class UserSavedSkillsResponse(BaseModel):
    uid: str
    primary_category: str
    skills: List[str]
    experience_level: str
    available_hours_per_week: int
    notes: Optional[str] = None
    saved_opportunities: List[Dict[str, Any]] = []
    updated_at: Optional[datetime] = None
