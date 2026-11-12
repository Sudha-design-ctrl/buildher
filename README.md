# BuildHer — Women Entrepreneurship Platform

> **An AI-powered mobile application that helps women discover their skills, start businesses, reach customers, and grow with confidence.**

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Prerequisites & Installation](#prerequisites--installation)
5. [Running the Backend](#running-the-backend)
6. [Running the Mobile App](#running-the-mobile-app)
7. [Project Structure](#project-structure)
8. [Environment Variables](#environment-variables)
9. [API Reference](#api-reference)
10. [Development Phases](#development-phases)

---

## Project Overview

BuildHer is an Android mobile app designed for women entrepreneurs and customers in local communities. It provides:

- **AI skill discovery** — Guided questionnaire + AI analysis of your skills and potential
- **Business idea generator** — Personalized business opportunities based on your skills and resources
- **Pricing assistant** — Cost breakdown and fair price suggestions
- **Marketing assistant** — AI-generated product descriptions and social media content
- **Marketplace** — Browse and discover local women-led businesses
- **Order management** — Create and track orders end-to-end

---

## Architecture

```
d:\buildher\
├── mobile/          ← Flutter Android app (Dart)
│   ├── lib/
│   │   ├── core/    ← Theme, constants, widgets, router
│   │   ├── features/← Screen-by-screen feature modules
│   │   └── providers/← Riverpod state management
│   └── pubspec.yaml
│
├── backend/         ← FastAPI Python server
│   ├── app/
│   │   ├── core/   ← Config, security
│   │   ├── api/v1/ ← REST endpoints
│   │   ├── services/← Business logic
│   │   └── schemas/ ← Pydantic models
│   └── run.py
│
├── README.md
└── PROJECT_STATUS.md
```

### Data flow

```
Flutter App  ──HTTP──▶  FastAPI Backend  ──▶  Firebase / OpenAI
(Android)               (Python)               (External services)
```

- The mobile app calls the backend REST API for all AI features, auth, and data operations.
- The backend calls Firebase for auth verification and Firestore for data storage.
- The backend calls OpenAI for AI-powered features (never from the mobile app directly).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | Flutter 3.x, Dart |
| UI | Material Design 3, Google Fonts (Nunito + Inter) |
| State | Riverpod |
| Navigation | Named routes (Phase 1), go_router with guards (Phase 2+) |
| Backend | Python 3.13, FastAPI |
| Validation | Pydantic v2 |
| Auth | Firebase Authentication (Phase 2) |
| Database | Cloud Firestore (Phase 2) |
| Storage | Firebase Storage (Phase 4) |
| AI | OpenAI API via backend (Phase 3+) |
| Payments | Razorpay sandbox (Phase 8) |

---

## Prerequisites & Installation

### 1. Python (Backend)

Python 3.10+ is required. Verify with:

```powershell
python --version
```

### 2. Flutter (Mobile)

Flutter is **not yet installed** on this machine. To install:

1. Download Flutter SDK: https://docs.flutter.dev/get-started/install/windows
2. Extract to `C:\flutter` (no spaces in path)
3. Add `C:\flutter\bin` to your System PATH
4. Open a new terminal and run:

```powershell
flutter doctor
```

Fix any issues flutter doctor reports (Android SDK, emulator, etc.).

### 3. Android Studio / Emulator

Required to run the app on an Android emulator:

1. Download Android Studio: https://developer.android.com/studio
2. Install the Android SDK and create a virtual device (Pixel 7, API 33+)
3. Launch the emulator from AVD Manager

---

## Running the Backend

### First-time setup

```powershell
cd D:\buildher\backend

# Install Python dependencies
pip install -r requirements.txt

# Copy and review environment variables
copy .env.example .env
# Edit .env to set any needed values
```

### Start the server

```powershell
cd D:\buildher\backend
python run.py
```

The server will start at: **http://localhost:8001**

- **API docs (Swagger):** http://localhost:8001/docs
- **Health check:** http://localhost:8001/api/v1/health
- **Root info:** http://localhost:8001/

> The server auto-reloads when source files change (because `DEBUG=true`).

### Verify it's working

```powershell
Invoke-RestMethod -Uri "http://localhost:8001/api/v1/health" | ConvertTo-Json
```

Expected response:
```json
{
  "status": "healthy",
  "service": "BuildHer API",
  "version": "1.0.0",
  "phase": "Phase 1 - Foundation"
}
```

---

## Running the Mobile App

> **Requires Flutter to be installed.** See Prerequisites above.

```powershell
cd D:\buildher\mobile

# Download dependencies (first time only)
flutter pub get

# Check for issues
flutter analyze

# Run on connected device or emulator
flutter run
```

### If running on a physical Android device

Replace the API base URL in `lib/core/constants/app_constants.dart`:

```dart
// Change this:
static const String baseUrl = 'http://10.0.2.2:8001';
// To your computer's local IP (e.g.):
static const String baseUrl = 'http://192.168.1.100:8001';
```

> `10.0.2.2` is the emulator's alias for your PC's localhost. Physical devices need the actual IP.

---

## Project Structure

### Mobile (`mobile/lib/`)

```
core/
  theme/
    app_colors.dart        ← Color palette constants
    app_theme.dart         ← Material 3 theme definition
  constants/
    app_constants.dart     ← URLs, keys, role strings
  widgets/
    app_button.dart        ← Reusable button (primary/outlined/text)
    app_text_field.dart    ← Reusable form field
    app_card.dart          ← Rounded shadow card
    app_loading.dart       ← Loading spinner & overlay
    app_empty_state.dart   ← Empty state with icon + action
  router/
    app_router.dart        ← Named route configuration

features/
  splash/
    splash_screen.dart     ← Animated splash (2.5s → onboarding/welcome)
  onboarding/
    onboarding_screen.dart ← 3-slide intro with page indicator
  auth/
    welcome_screen.dart    ← Role selection (entrepreneur / customer)
  home/
    entrepreneur/
      entrepreneur_home_screen.dart  ← Dashboard + 4-tab bottom nav
    customer/
      customer_home_screen.dart      ← Discover + 3-tab bottom nav
  common/
    placeholder_screen.dart ← Reusable "coming soon" screen
```

### Backend (`backend/app/`)

```
core/
  config.py        ← Pydantic-settings (.env loader)
  security.py      ← Auth utilities (Phase 2)
api/v1/
  router.py        ← Route aggregator
  endpoints/
    health.py      ← GET /api/v1/health
services/          ← Business logic (Phase 2+)
schemas/           ← Pydantic request/response models (Phase 2+)
```

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in values as phases progress.

| Variable | Required in Phase | Description |
|----------|------------------|-------------|
| `APP_NAME` | 1 | API display name |
| `DEBUG` | 1 | Enable hot-reload and /docs |
| `PORT` | 1 | Server port (default: 8001) |
| `CORS_ORIGINS` | 1 | Comma-separated allowed origins |
| `OPENAI_API_KEY` | 3 | OpenAI API key for AI features |
| `FIREBASE_PROJECT_ID` | 2 | Firebase project identifier |
| `FIREBASE_CREDENTIALS_PATH` | 2 | Path to Firebase service account JSON |

---

## API Reference

### Phase 1 Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/` | None | API info and links |
| `GET` | `/api/v1/health` | None | Health check with feature flags |
| `GET` | `/docs` | None | Swagger UI (debug only) |

More endpoints will be added in each subsequent phase.

---

## Development Phases

| Phase | Status | Description |
|-------|--------|-------------|
| **1** | ✅ Complete | Project foundation, UI shell, backend health check |
| **2** | ⏳ Pending | Firebase auth, user profiles, role-based navigation |
| **3** | ⏳ Pending | AI skill discovery questionnaire |
| **4** | ⏳ Pending | Business idea generation and business setup |
| **5** | ⏳ Pending | Pricing and marketing AI assistants |
| **6** | ⏳ Pending | Marketplace and customer discovery |
| **7** | ⏳ Pending | Communication and order management |
| **8** | ⏳ Pending | Safety, earnings, and payment integration |
| **9** | ⏳ Pending | Localization, accessibility, push notifications |
| **10** | ⏳ Pending | Testing, deployment, final documentation |
