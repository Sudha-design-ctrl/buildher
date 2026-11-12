"""
BuildHer Backend - Authentication & Profile Endpoints (Phase 2)
"""

import uuid
import json
import os
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, status
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    FirebaseTokenLoginRequest,
    TokenResponse,
    UserProfileUpdate,
    UserProfileResponse,
)
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
)
from app.services.firebase_service import (
    save_user_profile,
    get_user_profile,
    verify_firebase_id_token,
    is_firebase_active,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

# ── Persistent credentials store (survives server restarts) ──────────────────
_CREDS_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "data", "credentials.json")


def _load_credentials() -> dict:
    """Load credentials from disk. Returns empty dict if file doesn't exist."""
    try:
        os.makedirs(os.path.dirname(_CREDS_FILE), exist_ok=True)
        if os.path.exists(_CREDS_FILE):
            with open(_CREDS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass
    return {}


def _save_credentials(creds: dict):
    """Persist credentials dictionary to disk."""
    try:
        os.makedirs(os.path.dirname(_CREDS_FILE), exist_ok=True)
        with open(_CREDS_FILE, "w", encoding="utf-8") as f:
            json.dump(creds, f, indent=2)
    except Exception as e:
        print(f"[WARN] Could not save credentials to disk: {e}")


# Load existing credentials from disk on startup
_local_credentials: dict = _load_credentials()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(request: UserRegisterRequest):
    """Register a new user (entrepreneur or customer)."""
    email_key = request.email.lower().strip()
    if email_key in _local_credentials:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists. Please sign in instead."
        )

    uid = f"usr_{uuid.uuid4().hex[:12]}"
    hashed_pwd = get_password_hash(request.password)
    _local_credentials[email_key] = {
        "uid": uid,
        "password_hash": hashed_pwd,
        "role": request.role,
    }
    # Persist to disk immediately
    _save_credentials(_local_credentials)

    profile_data = {
        "uid": uid,
        "email": request.email,
        "full_name": request.full_name,
        "role": request.role,
        "phone": request.phone,
        "language_preference": request.language_preference,
        "is_verified": False,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    save_user_profile(uid, profile_data)

    access_token = create_access_token({
        "sub": uid,
        "email": request.email,
        "role": request.role,
        "full_name": request.full_name,
    })

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=uid,
        role=request.role,
        email=request.email,
        full_name=request.full_name,
    )


@router.post("/login", response_model=TokenResponse)
def login(request: UserLoginRequest):
    """Authenticate with email and password."""
    email_key = request.email.lower().strip()
    user_cred = _local_credentials.get(email_key)

    if not user_cred:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No account found with this email. Please register first."
        )

    if not verify_password(request.password, user_cred["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Please try again."
        )

    uid = user_cred["uid"]
    profile = get_user_profile(uid) or {}

    access_token = create_access_token({
        "sub": uid,
        "email": request.email,
        "role": user_cred["role"],
        "full_name": profile.get("full_name", ""),
    })

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=uid,
        role=user_cred["role"],
        email=request.email,
        full_name=profile.get("full_name", ""),
    )


@router.post("/firebase-login", response_model=TokenResponse)
def firebase_login(request: FirebaseTokenLoginRequest):
    """Verify Firebase ID token and authenticate or create user."""
    decoded = verify_firebase_id_token(request.id_token)
    if not decoded:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Firebase ID token."
        )

    uid = decoded.get("uid")
    email = decoded.get("email", "")
    full_name = decoded.get("name", "")

    profile = get_user_profile(uid)
    if not profile:
        profile = {
            "uid": uid,
            "email": email,
            "full_name": full_name,
            "role": "entrepreneur",
            "is_verified": False,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
        save_user_profile(uid, profile)

    access_token = create_access_token({
        "sub": uid,
        "email": email,
        "role": profile.get("role", "entrepreneur"),
        "full_name": profile.get("full_name", full_name),
    })

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=uid,
        role=profile.get("role", "entrepreneur"),
        email=email,
        full_name=profile.get("full_name", full_name),
    )


@router.get("/me", response_model=UserProfileResponse)
def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """Fetch profile of currently authenticated user."""
    uid = current_user.get("sub")
    profile = get_user_profile(uid)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found."
        )
    return profile


@router.put("/profile", response_model=UserProfileResponse)
def update_profile(
    update_data: UserProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update user profile information."""
    uid = current_user.get("sub")
    existing_profile = get_user_profile(uid)
    if not existing_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found."
        )

    data_to_update = {k: v for k, v in update_data.model_dump().items() if v is not None}
    updated = save_user_profile(uid, data_to_update)
    return updated
