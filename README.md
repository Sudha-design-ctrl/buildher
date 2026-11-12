# BuildHer — India-focused Women Entrepreneurship Platform 🌸

> **An AI-powered mobile application designed to empower Indian women micro-entrepreneurs to discover their skills, launch local home businesses, price their products fairly, generate festive marketing content, reach local customers, receive UPI payments securely, and connect safely.**

---

## 📱 Project Status & Completed Modules

All 8 core development phases are **100% Complete & Verified**:

| Phase | Status | Module & Capabilities |
| :---: | :---: | :--- |
| **Phase 1** | ✅ Complete | **Foundation & Architecture:** FastAPI backend, health check, CORS, Expo SDK 58 setup, design system. |
| **Phase 2** | ✅ Complete | **Authentication & Profiles:** JWT auth, Register & Sign In, persistent storage, dual-roles (Entrepreneur / Customer). |
| **Phase 3** | ✅ Complete | **AI Skill Discovery:** 4-step wizard assessing passions, skills & resources; tailored micro-business recommendations. |
| **Phase 4** | ✅ Complete | **Business Setup & Pricing Calculator:** Business profile builder and cost-plus pricing calculator with profit margin logic. |
| **Phase 5** | ✅ Complete | **AI Marketing Content:** WhatsApp broadcast and Instagram post generator with hashtags, emojis, and ready-made festive templates. |
| **Phase 6** | ✅ Complete | **Local Marketplace & Inventory:** Customer product discovery, category filters, product details, entrepreneur inventory & listing creator. |
| **Phase 7** | ✅ Complete | **Orders & In-App Chat:** COD & UPI order placement, live status progression (`Pending` → `Accepted` → `In Progress` → `Completed`), quick reply chips. |
| **Phase 8** | ✅ Complete | **Payments & Women Safety Center:** NPCI UPI QR code generation, 12-digit UTR confirmation, 5-star reviews, 24/7 emergency helplines (112, 1091, 1930), and confidential incident reporting. |

---

## 🛠️ Tech Stack

- **Mobile App:** React Native, Expo Go (SDK 58), React 19.3.0, React Native 0.88.1
- **Backend API:** Python 3.13, FastAPI, Uvicorn, Pydantic v2
- **Authentication:** JWT (JSON Web Tokens), Bcrypt password hashing, persistent JSON store
- **AI Integrations:** Google Gemini AI (Skill discovery & marketing generator)
- **Payments:** NPCI UPI deep links & dynamic QR generation

---

## 📂 Project Structure

```
buildher/
├── backend/                   # Python FastAPI REST API
│   ├── app/
│   │   ├── api/v1/endpoints/  # auth, skills, business, marketing, marketplace, orders, payments
│   │   ├── core/              # Security (JWT, bcrypt), configuration
│   │   ├── schemas/           # Pydantic request/response schemas
│   │   └── services/          # AI services, business logic, payment verifier
│   ├── data/                  # Persistent credentials & database storage
│   ├── main.py
│   └── requirements.txt
│
├── mobile_expo/               # React Native Expo Mobile App
│   ├── App.js                 # Unified application (Theme, Router, Screens, Components)
│   ├── package.json
│   └── app.json
│
└── README.md                  # Project documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- Expo Go app on your physical Android device

### 2. Run the Backend API
```bash
cd backend
python -m venv venv
venv\Scripts\activate       # On Windows
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001
```

### 3. Run the Mobile App
```bash
cd mobile_expo
npm install
npx expo start
```
Scan the QR code in your terminal using the **Expo Go** app on your Android phone!

---

## 🌟 Key Features

### 👩‍🍳 For Women Entrepreneurs:
- **Guided Skill Discovery:** AI analyzes personal passions, household skills, and available weekly hours to suggest viable home businesses.
- **Pricing Calculator:** Prevents undercharging by calculating raw material costs, labor hours, packaging, and profit margins.
- **AI Marketing Assistant:** Generates ready-to-share WhatsApp catalog messages and Instagram captions in seconds.
- **Order Management:** Accept orders, update preparation status, and chat directly with neighborhood buyers.
- **UPI Payments:** Receive payments directly to your personal UPI ID with zero platform commission.

### 🛍️ For Customers & Neighborhood Supporters:
- **Discover Women-Led Businesses:** Browse authentic homemade food, handicrafts, tailoring, beauty services, and organic products.
- **In-App Communication:** Chat directly with makers to customize orders and clarify delivery details.
- **Trust & Reviews:** Leave 5-star ratings and written reviews to support local women creators.
- **Safety Center:** Direct access to women emergency helplines and safety guidelines.
