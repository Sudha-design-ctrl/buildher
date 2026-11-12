"""
BuildHer Backend - AI Service (Phase 3)
Integrates OpenAI for Skill Analysis and Business Idea Recommendations.
Includes robust rule-based domain fallbacks when API keys are not provided.
"""

import os
import json
import logging
from typing import Dict, Any, List
from datetime import datetime
from app.core.config import settings
from app.schemas.skills import (
    SkillQuestionnaireRequest,
    SkillAnalysisResponse,
    BusinessOpportunity,
)

logger = logging.getLogger("app.ai")

# Fallback catalog based on Indian rural/urban women entrepreneurial opportunities
DOMAIN_TEMPLATES: Dict[str, Dict[str, Any]] = {
    "cooking": {
        "summary": "You have a natural flair for culinary preparations with strong kitchen management and food presentation potential.",
        "strengths": [
            "Recipe consistency and home-style authenticity",
            "Ability to cater to dietary and cultural preferences",
            "Strong local neighborhood demand for clean, home-cooked food",
        ],
        "opportunities": [
            BusinessOpportunity(
                title="Home-Cooked Tiffin & Lunchbox Service",
                category="Cooking & Food",
                description="Prepare fresh, hygienic weekday lunch meals for working professionals, students, and nearby offices.",
                estimated_startup_cost_range="Rs. 2,000 - Rs. 5,000 (containers, raw ingredients)",
                target_customers="Nearby office workers, university students, busy families",
                suggested_first_steps=[
                    "Prepare 3 signature sample meals for neighbors and collect honest feedback",
                    "Choose reusable or eco-friendly meal containers",
                    "Set up a simple daily menu schedule and WhatsApp broadcast list",
                ],
                potential_challenges=[
                    "Managing timely daily delivery during peak lunch hours",
                    "Balancing daily perishable ingredient grocery shopping",
                ],
            ),
            BusinessOpportunity(
                title="Specialty Pickles, Masala Powders & Sweets",
                category="Cooking & Food",
                description="Package authentic regional spice mixes, preserves, or traditional festival snacks with extended shelf life.",
                estimated_startup_cost_range="₹1,500 - ₹4,000 (airtight packaging, spices, labels)",
                target_customers="Apartment residents, local grocery stores, community festivals",
                suggested_first_steps=[
                    "Standardize batch measurements for consistent taste every time",
                    "Design clean, handwritten or printed food labels with ingredient details",
                    "Sell small trial batches at weekend apartment flea markets",
                ],
                potential_challenges=[
                    "Maintaining strict moisture control and hygienic storage conditions",
                    "Seasonal fluctuation in vegetable and spice prices",
                ],
            ),
        ],
        "skills_to_learn": [
            "Food safety & hygienic preservation techniques",
            "Simple portion costing and margin calculations",
        ],
    },
    "tailoring": {
        "summary": "You possess practical stitching, measurement, and fabric handling capabilities suited for custom apparel and alterations.",
        "strengths": [
            "Precision in garment fitting and client adjustments",
            "Ability to repurpose existing garments and fabrics creatively",
            "High repeat customer rate for reliable neighborhood alterations",
        ],
        "opportunities": [
            BusinessOpportunity(
                title="Bespoke Blouse & Salwar Stitching Boutique",
                category="Tailoring & Fashion",
                description="Offer custom-tailored traditional blouses, kurtas, and festival outfits with personalized fitting.",
                estimated_startup_cost_range="₹3,000 - ₹8,000 (sewing machine accessories, threads, lining fabrics)",
                target_customers="Women in your neighborhood preparing for weddings, festivals, and workwear",
                suggested_first_steps=[
                    "Build a physical photo album or digital portfolio of 5 completed stitch patterns",
                    "Offer free trial fitting adjustments on first orders to build trust",
                    "Establish a fixed turnaround time (e.g., 3-5 days per blouse)",
                ],
                potential_challenges=[
                    "Handling peak seasonal rush before major festival dates",
                    "Managing occasional fitting revisions professionally",
                ],
            ),
            BusinessOpportunity(
                title="Home Decor & Sustainable Fabric Products",
                category="Tailoring & Fashion",
                description="Stitch durable canvas tote bags, custom cushion covers, curtains, and dining table runners.",
                estimated_startup_cost_range="₹2,000 - ₹5,000 (fabric remnants, zippers, decorative borders)",
                target_customers="Homeowners, college students, eco-friendly lifestyle shoppers",
                suggested_first_steps=[
                    "Source remnant fabric rolls in bulk from wholesale markets",
                    "Create 3 distinct sample tote bag designs with sturdy stitching",
                    "List photos on local community WhatsApp groups and BuildHer marketplace",
                ],
                potential_challenges=[
                    "Standing out from mass-manufactured imported bags by emphasizing handmade durability",
                ],
            ),
        ],
        "skills_to_learn": [
            "Advanced zipper insertion and embroidery borders",
            "Pattern grading for different size scales",
        ],
    },
    "crafts": {
        "summary": "You demonstrate strong artistic sensitivity, tactile craft skills, and aesthetic presentation suitable for artisanal products.",
        "strengths": [
            "Unique handmade aesthetic that machine products cannot replicate",
            "Great gifting value for festive occasions, weddings, and celebrations",
            "Flexible production schedule manageable from a home workspace",
        ],
        "opportunities": [
            BusinessOpportunity(
                title="Terracotta & Handcrafted Artisan Jewelry",
                category="Crafts & Handmade",
                description="Create customized eco-friendly clay jewelry, beaded earrings, and hand-painted hair accessories.",
                estimated_startup_cost_range="₹1,500 - ₹4,000 (natural clay, acrylic paints, earring hooks, jewelry cords)",
                target_customers="College students, young working women, festival shoppers",
                suggested_first_steps=[
                    "Produce 10 sample sets matching popular festive color palettes",
                    "Photograph items in soft natural morning sunlight on clean plain paper",
                    "Package securely in small branded cardstock pouches",
                ],
                potential_challenges=[
                    "Clay fragility during transport requiring careful protective packaging",
                ],
            ),
            BusinessOpportunity(
                title="Festive Gift Hampers & Handmade Diyas/Candles",
                category="Crafts & Handmade",
                description="Curate customized gift boxes with decorated earthen diyas, organic soaps, and celebratory favor sets.",
                estimated_startup_cost_range="₹2,500 - ₹6,000 (raw wax/clay, essential oils, wicker boxes)",
                target_customers="Corporate clients, families hosting functions, festival organizers",
                suggested_first_steps=[
                    "Design 2 festive theme packages (budget tier and premium tier)",
                    "Reach out to apartment welfare committees ahead of festival seasons",
                ],
                potential_challenges=[
                    "Seasonal peaks require advance preparation 4-6 weeks early",
                ],
            ),
        ],
        "skills_to_learn": [
            "Product photography using simple smartphone camera techniques",
            "Eco-friendly gift packaging and bubble protection",
        ],
    },
    "beauty": {
        "summary": "You have interpersonal warmth, precision grooming skills, and hands-on cosmetic application capability.",
        "strengths": [
            "Convenience of doorstep or quiet home-salon services for neighborhood women",
            "High client retention through gentle, hygienic, and attentive care",
            "Steady repeat income every 3-4 weeks per client",
        ],
        "opportunities": [
            BusinessOpportunity(
                title="Home Doorstep Beauty & Herbal Skincare Service",
                category="Beauty & Wellness",
                description="Provide threading, waxing, herbal facial treatments, and organic henna/mehendi at the client's home.",
                estimated_startup_cost_range="₹3,000 - ₹7,000 (sanitary disposable kits, facial steamer, wax heater)",
                target_customers="Homemakers, new mothers, and working women who prefer privacy and convenience",
                suggested_first_steps=[
                    "Invest in high-grade sanitary disposable sheets and towels",
                    "Print a clear, simple laminated rate card with service packages",
                    "Offer an introductory package deal for first-time neighborhood clients",
                ],
                potential_challenges=[
                    "Travel time between clients across different neighborhoods",
                    "Maintaining strict hygiene standards to build lasting word-of-mouth trust",
                ],
            )
        ],
        "skills_to_learn": [
            "Herbal facial massage routines and skin-type analysis",
            "Appointment scheduling and client consultation communication",
        ],
    },
    "tutoring": {
        "summary": "You possess clear instructional communication, patience with learners, and structured academic discipline.",
        "strengths": [
            "Zero raw-material costs and immediate working capital efficiency",
            "High parent trust through personal attention and local accessibility",
            "Predictable recurring monthly tuition fees per enrolled student",
        ],
        "opportunities": [
            BusinessOpportunity(
                title="Neighborhood Primary After-School Study Center",
                category="Tutoring & Education",
                description="Conduct small-group homework assistance and foundational math/language tutoring for classes 1-7.",
                estimated_startup_cost_range="₹1,000 - ₹3,000 (whiteboard, markers, student progress notebooks)",
                target_customers="Parents in your apartment or street seeking reliable evening guidance for children",
                suggested_first_steps=[
                    "Design a 1.5-hour daily structured evening timetable",
                    "Start with 3-4 students to give focused personal care",
                    "Provide weekly written progress updates to parents",
                ],
                potential_challenges=[
                    "Balancing children across different grades in the same batch",
                    "Keeping students focused and motivated without academic burnout",
                ],
            )
        ],
        "skills_to_learn": [
            "Interactive learning games and visual teaching techniques",
            "Constructive parent-teacher communication strategies",
        ],
    },
}


def analyze_skills_with_ai(request: SkillQuestionnaireRequest) -> SkillAnalysisResponse:
    """
    Analyzes user skills using OpenAI if configured; otherwise uses high-quality domain fallback.
    """
    api_key = settings.openai_api_key or os.environ.get("OPENAI_API_KEY", "")

    if api_key and api_key.strip():
        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key.strip())

            prompt = f"""
You are BuildHer AI, an expert business advisor specializing in empowering women micro-entrepreneurs in India.
Analyze the following user questionnaire and return practical, actionable business opportunities.

User Profile:
- Primary Category: {request.primary_category}
- Skills Selected: {', '.join(request.skills_selected)}
- Custom / Spoken Skills: {request.custom_skills or 'None'}
- Experience Level: {request.experience_level}
- Available Hours Per Week: {request.available_hours_per_week} hours
- Available Equipment: {request.available_equipment or 'Standard household items'}
- Workplace: {request.workplace_type}
- Preferred Language: {request.language}

Respond strictly in valid JSON matching this schema:
{{
  "skill_summary": "Encouraging, grounded 2-sentence summary of her capabilities.",
  "identified_strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "recommended_opportunities": [
    {{
      "title": "Business Name/Concept",
      "category": "{request.primary_category}",
      "description": "Clear 2-sentence description of the service or product.",
      "estimated_startup_cost_range": "e.g. ₹2,000 - ₹5,000",
      "target_customers": "Who will buy this locally",
      "suggested_first_steps": ["Step 1", "Step 2", "Step 3"],
      "potential_challenges": ["Challenge 1", "Challenge 2"]
    }}
  ],
  "skills_to_develop": ["Skill 1", "Skill 2"]
}}

Rules:
1. Ground all recommendations in realistic home or small-scale feasibility.
2. Costs must be in INR (₹) and low startup budget.
3. NEVER guarantee business success, specific income amounts, or guaranteed sales.
"""

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are BuildHer's supportive AI skill and business advisor. Return only valid JSON."},
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.7,
            )

            raw_json = response.choices[0].message.content
            parsed = json.loads(raw_json)

            opps = [
                BusinessOpportunity(
                    title=item.get("title", "Local Business Opportunity"),
                    category=item.get("category", request.primary_category),
                    description=item.get("description", ""),
                    estimated_startup_cost_range=item.get("estimated_startup_cost_range", "₹2,000 - ₹5,000"),
                    target_customers=item.get("target_customers", "Local community"),
                    suggested_first_steps=item.get("suggested_first_steps", []),
                    potential_challenges=item.get("potential_challenges", []),
                )
                for item in parsed.get("recommended_opportunities", [])
            ]

            return SkillAnalysisResponse(
                skill_summary=parsed.get("skill_summary", "You have valuable practical skills that can generate steady income."),
                identified_strengths=parsed.get("identified_strengths", ["Hands-on capability", "Local community trust"]),
                recommended_opportunities=opps,
                skills_to_develop=parsed.get("skills_to_develop", ["Basic bookkeeping", "Customer communication"]),
                is_demo_mode=False,
                generated_at=datetime.utcnow(),
            )

        except Exception as e:
            logger.warning("OpenAI API call failed: %s. Falling back to local domain recommendations.", e)

    # High quality domain fallback
    cat_key = "cooking"
    query_str = f"{request.primary_category} {' '.join(request.skills_selected)} {request.custom_skills or ''}".lower()

    if "tailor" in query_str or "stitch" in query_str or "fashion" in query_str or "sew" in query_str:
        cat_key = "tailoring"
    elif "craft" in query_str or "art" in query_str or "clay" in query_str or "pottery" in query_str or "diya" in query_str or "jewel" in query_str:
        cat_key = "crafts"
    elif "beauty" in query_str or "hair" in query_str or "makeup" in query_str or "mehendi" in query_str or "henna" in query_str:
        cat_key = "beauty"
    elif "tutor" in query_str or "teach" in query_str or "study" in query_str or "class" in query_str:
        cat_key = "tutoring"

    template = DOMAIN_TEMPLATES.get(cat_key, DOMAIN_TEMPLATES["cooking"])

    return SkillAnalysisResponse(
        skill_summary=template["summary"],
        identified_strengths=template["strengths"],
        recommended_opportunities=template["opportunities"],
        skills_to_develop=template["skills_to_learn"],
        is_demo_mode=True,
        generated_at=datetime.utcnow(),
    )
