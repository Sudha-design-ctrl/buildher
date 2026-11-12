"""
BuildHer Backend - Marketing Service (Phase 5)

Generates social media captions, WhatsApp promotional messages,
and seasonal marketing campaigns using OpenAI with rule-based fallback.
"""

import os
import json
from typing import List
from app.schemas.marketing import (
    MarketingGenerateRequest,
    MarketingGenerateResponse,
    MarketingPostOption,
    MarketingTemplateItem,
)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")


# ─────────────────────────────────────────────────────────────────────────────
# Ready-made Templates Catalog
# ─────────────────────────────────────────────────────────────────────────────
PREMADE_TEMPLATES: List[MarketingTemplateItem] = [
    MarketingTemplateItem(
        id="festive-diwali",
        title="🪔 Festive Celebration Offer",
        category="Festive",
        platform="whatsapp",
        template_text=(
            "✨ This festive season, celebrate authentic handmade love! ✨\n\n"
            "Pre-orders are now OPEN for our handcrafted collections at {business_name}!\n"
            "🎁 Special Offer: {offer}\n\n"
            "👉 Pure quality, made fresh with care.\n"
            "📲 WhatsApp us today to book your order before slots fill up!"
        ),
        suggested_tags=["#VocalForLocal", "#WomenEntrepreneurs", "#FestiveSeason", "#HandmadeWithLove"],
    ),
    MarketingTemplateItem(
        id="weekend-special",
        title="🎉 Weekend Fresh Batch",
        category="Discounts",
        platform="instagram",
        template_text=(
            "Weekend cravings sorted! 👩‍🍳✨\n\n"
            "We are preparing a fresh batch of {product_service} this Saturday & Sunday.\n"
            "Limited quantity only — made strictly on pre-order to ensure 100% freshness!\n\n"
            "🏷️ Weekend Special: {offer}\n\n"
            "💬 DM us or click the link in bio to place your order now!"
        ),
        suggested_tags=["#FreshBatch", "#WeekendTreats", "#SupportSmallBusiness", "#HomeMadeHappiness"],
    ),
    MarketingTemplateItem(
        id="new-launch",
        title="🚀 Brand New Launch",
        category="New Launch",
        platform="whatsapp",
        template_text=(
            "🌟 EXCITING NEWS from {business_name}! 🌟\n\n"
            "We are super thrilled to introduce our newest addition: {product_service}! 🎉\n\n"
            "Designed and crafted specially for you.\n"
            "Introductory offer: {offer}\n\n"
            "Order directly via WhatsApp and be the first to try it!"
        ),
        suggested_tags=["#NewLaunch", "#MadeInIndia", "#ShopLocal", "#CraftedWithCare"],
    ),
    MarketingTemplateItem(
        id="review-thank-you",
        title="💖 Customer Appreciation",
        category="Testimonials",
        platform="instagram",
        template_text=(
            "\"The quality and love in this order made my entire day!\" 🥹❤️\n\n"
            "Receiving words like this fuels our passion every single day at {business_name}.\n"
            "Thank you to all our lovely customers for choosing home-grown, women-led businesses!\n\n"
            "Looking to experience the magic of {product_service}?\n"
            "Send us a message — we'd love to craft something special for you."
        ),
        suggested_tags=["#CustomerLove", "#HappyCustomer", "#BuildHer", "#WomenInBusiness"],
    ),
]


# ─────────────────────────────────────────────────────────────────────────────
# Rule-Based Copy Generator (Fallback)
# ─────────────────────────────────────────────────────────────────────────────
def _generate_fallback_posts(req: MarketingGenerateRequest) -> MarketingGenerateResponse:
    biz = req.business_name or "Our Small Business"
    prod = req.product_service
    offer = req.offer_details or "Special price for first 10 orders!"
    platform = req.platform.lower()
    tone = req.tone.lower()
    lang = req.language.lower()

    if platform == "whatsapp":
        if lang == "hi":
            opt1 = MarketingPostOption(
                title="Status Update (छोटा और सीधा)",
                content=f"🌸 {biz} की तरफ से खास पेशकश! 🌸\nताज़ा और शुद्ध {prod} अब उपलब्ध है।\n\n🏷️ ऑफर: {offer}\n\nऑर्डर करने के लिए तुरंत रिप्लाई करें! 📲",
                call_to_action="मुझे WhatsApp पर मेसेज करें 📲",
                hashtags=["#स्वदेशी", "#महिलाउद्यमी"],
            )
            opt2 = MarketingPostOption(
                title="Broadcast Message (विस्तृत जानकारी)",
                content=(
                    f"नमस्ते सहेलियों! 🙏\n\n"
                    f"क्या आप उच्च गुणवत्ता और प्यार से बनी {prod} ढूंढ रही हैं?\n"
                    f"{biz} में हम हर आर्डर को पूरी स्वच्छता और ध्यान से तैयार करते हैं।\n\n"
                    f"✨ खास ऑफर: {offer}\n"
                    f"📦 होम डिलीवरी उपलब्ध है!\n\n"
                    f"अपना आर्डर बुक करने के लिए अभी इसी नंबर पर संपर्क करें।"
                ),
                call_to_action="अभी आर्डर बुक करें",
                hashtags=["#सपोर्टलोकल", "#गृहउद्योग"],
            )
        elif lang == "hinglish":
            opt1 = MarketingPostOption(
                title="WhatsApp Status (Catchy & Quick)",
                content=f"✨ Fresh & handmade with love! ✨\n{biz} brings you authentic {prod}!\n\n🔥 Offer: {offer}\n\nSlots limited hain — jaldi se reply karo order karne ke liye! 💬",
                call_to_action="Reply to this status to book! 📲",
                hashtags=["#VocalForLocal", "#BuildHer"],
            )
            opt2 = MarketingPostOption(
                title="Broadcast / Group Message (Detailed)",
                content=(
                    f"Hello everyone! Hope you are having a wonderful day 🌸\n\n"
                    f"We are excited to share our bestselling {prod} from {biz}!\n"
                    f"Chahe daily use ho ya special occasion — pure quality guaranteed hai.\n\n"
                    f"🎉 Special Deal: {offer}\n"
                    f"🚚 Doorstep delivery available!\n\n"
                    f"Apna order book karne ke liye WhatsApp pe text karein."
                ),
                call_to_action="WhatsApp us now to order!",
                hashtags=["#SmallBusinessIndia", "#WomenEntrepreneurs"],
            )
        else:
            opt1 = MarketingPostOption(
                title="WhatsApp Status (Short & Engaging)",
                content=f"🌸 Pure quality, crafted with passion! 🌸\nDiscover authentic {prod} from {biz}!\n\n🎁 Limited Time Deal: {offer}\n\nReply directly to reserve yours today!",
                call_to_action="Reply to this status to order 📲",
                hashtags=["#SupportSmallBiz", "#VocalForLocal"],
            )
            opt2 = MarketingPostOption(
                title="Customer Broadcast (Detailed)",
                content=(
                    f"Dear friends and valued customers! 💐\n\n"
                    f"At {biz}, we take immense pride in bringing you handmade {prod} made with the utmost care.\n\n"
                    f"✨ Special Promotion: {offer}\n"
                    f"📦 Convenient delivery & custom orders welcome!\n\n"
                    f"Drop us a message here to confirm your requirements."
                ),
                call_to_action="Message us now to reserve your slot!",
                hashtags=["#HandmadeInIndia", "#WomenInBusiness", "#LocalArtisans"],
            )

    elif platform == "instagram":
        if lang == "hinglish":
            opt1 = MarketingPostOption(
                title="Feed Post with Story Hook",
                content=(
                    f"Crafted with pyaar, delivered with care! 💖✨\n\n"
                    f"Swipe right to see why our customers are obsessed with {prod} from {biz}! "
                    f"Every piece is prepared using authentic methods so you get nothing but the best.\n\n"
                    f"🏷️ Limited Offer: {offer}\n\n"
                    f"Share this with someone who would love this! 👇"
                ),
                call_to_action="Tap the link in bio or DM us to order! 💌",
                hashtags=["#SmallBusinessIndia", "#InstaShopping", "#VocalForLocal", "#WomenLed", "#HandmadeLove"],
            )
            opt2 = MarketingPostOption(
                title="Reels / Short Video Caption",
                content=(
                    f"Wait for the final look! 😍✨\n\n"
                    f"Making our signature {prod} behind the scenes at {biz}. "
                    f"Which one is your favourite?\n\n"
                    f"🔥 Grab {offer} this week only!\n"
                    f"Drop a '❤️' in comments and we'll DM you the order details!"
                ),
                call_to_action="Comment 'WANT' or DM us for order link!",
                hashtags=["#ReelsIndia", "#BehindTheScenes", "#SmallBusinessReel", "#SupportWomenMakers"],
            )
        else:
            opt1 = MarketingPostOption(
                title="Instagram Feed Post",
                content=(
                    f"Made with love, from our hands to your home. 🌿✨\n\n"
                    f"Introducing our curated {prod} by {biz}. "
                    f"Whether you're treating yourself or gifting someone special, you will feel the difference in every detail.\n\n"
                    f"🎁 Special Celebration Offer: {offer}\n\n"
                    f"Save this post for later and tag a friend who needs this! 👇"
                ),
                call_to_action="Send us a DM or click the link in bio to shop! 💌",
                hashtags=["#VocalForLocal", "#HandmadeWithLove", "#WomenEntrepreneurs", "#ShopSmall", "#MadeInIndia"],
            )
            opt2 = MarketingPostOption(
                title="Reels / Story Hook",
                content=(
                    f"POV: You just discovered your new favourite {prod} 🪄✨\n\n"
                    f"Handcrafted with perfection at {biz}.\n"
                    f"Don't miss our limited deal: {offer}!\n\n"
                    f"Tap the message icon below to place your order."
                ),
                call_to_action="DM 'ORDER' to get yours today!",
                hashtags=["#ExplorePage", "#ReelsViral", "#ArtisanCrafted", "#SupportLocalArtists"],
            )
    else:  # Facebook / Community
        opt1 = MarketingPostOption(
            title="Community Group Post",
            content=(
                f"Hello wonderful community members! 👋🌸\n\n"
                f"I am a local woman entrepreneur running {biz}, and I am delighted to share our {prod} with you all!\n\n"
                f"Every single item is made with strict hygiene and high attention to detail.\n"
                f"Special Community Offer: {offer}\n\n"
                f"Please support local neighborhood makers by liking and sharing! Thank you for your encouragement."
            ),
            call_to_action="Comment below or message directly to order!",
            hashtags=["#LocalCommunity", "#SupportLocalMakers", "#WomenEmpowerment"],
        )
        opt2 = MarketingPostOption(
            title="Facebook Business Page Update",
            content=(
                f"✨ Quality you can trust, prices you'll love! ✨\n\n"
                f"Looking for reliable {prod}? Look no further than {biz}.\n"
                f"We cater to both personal and bulk orders across the area.\n\n"
                f"🏷️ Current Promotion: {offer}\n\n"
                f"Contact us today via WhatsApp or Messenger to discuss your requirement."
            ),
            call_to_action="Click 'Send Message' to book now!",
            hashtags=["#SmallBusinessSpotlight", "#IndiaMicroBiz"],
        )

    tips = [
        "Post between 11 AM - 1 PM or 7 PM - 9 PM for peak engagement on WhatsApp and Instagram in India.",
        "Add clear photos taken in good natural day-light for 3x higher response.",
        "Share real behind-the-scenes moments or client unboxing videos on your WhatsApp status.",
        "Always reply to customer inquiries within 15 minutes to maximize order conversions.",
    ]

    return MarketingGenerateResponse(
        product_service=req.product_service,
        platform=req.platform,
        tone=req.tone,
        language=req.language,
        options=[opt1, opt2],
        posting_tips=tips,
        is_demo_mode=True,
    )


# ─────────────────────────────────────────────────────────────────────────────
# OpenAI / AI Generation (Active when API key provided)
# ─────────────────────────────────────────────────────────────────────────────
async def generate_marketing_content(req: MarketingGenerateRequest) -> MarketingGenerateResponse:
    if not OPENAI_API_KEY:
        return _generate_fallback_posts(req)

    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=OPENAI_API_KEY)

        prompt = f"""
You are an expert social media and marketing consultant for Indian women micro-entrepreneurs.
Create 2 engaging promotional posts for:
- Product/Service: {req.product_service}
- Business Name: {req.business_name or 'Our Local Business'}
- Platform: {req.platform} (e.g. WhatsApp, Instagram, Facebook)
- Tone: {req.tone}
- Offer Details: {req.offer_details or 'High quality and competitive pricing'}
- Language: {req.language} (English, Hindi, or Hinglish)

Respond with ONLY a JSON object formatted as:
{{
  "options": [
    {{
      "title": "Post 1 title (e.g. Status update or Reel caption)",
      "content": "Full caption text with appropriate festive/warm emojis",
      "call_to_action": "Clear call to action string",
      "hashtags": ["#Tag1", "#Tag2"]
    }},
    {{
      "title": "Post 2 title (e.g. Detailed broadcast)",
      "content": "Full caption text with appropriate festive/warm emojis",
      "call_to_action": "Clear call to action string",
      "hashtags": ["#Tag1", "#Tag2"]
    }}
  ],
  "posting_tips": [
    "Tip 1 for best posting results in Indian market",
    "Tip 2 for best posting results in Indian market"
  ]
}}
"""
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a professional marketing copywriter specializing in Indian micro-businesses and women entrepreneurship."},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
        )

        data = json.loads(response.choices[0].message.content)
        opts = [MarketingPostOption(**o) for o in data.get("options", [])]
        tips = data.get("posting_tips", [])

        return MarketingGenerateResponse(
            product_service=req.product_service,
            platform=req.platform,
            tone=req.tone,
            language=req.language,
            options=opts,
            posting_tips=tips,
            is_demo_mode=False,
        )
    except Exception:
        return _generate_fallback_posts(req)
