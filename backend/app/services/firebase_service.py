"""
BuildHer Backend - Firebase Service
Handles initialization of Firebase Admin SDK and interactions with Firestore/Auth.
Falls back safely to local in-memory storage if Firebase credentials are not yet configured.
"""

import os
import logging
from typing import Optional, Dict, Any
from datetime import datetime

logger = logging.getLogger("app.firebase")

_firebase_initialized = False
_db = None

try:
    import firebase_admin
    from firebase_admin import credentials, auth as fb_auth, firestore
except ImportError:
    firebase_admin = None
    fb_auth = None
    firestore = None


def init_firebase(credentials_path: Optional[str] = None, project_id: Optional[str] = None) -> bool:
    """Initialize Firebase Admin SDK with credentials file or default app."""
    global _firebase_initialized, _db
    if _firebase_initialized:
        return True

    if not firebase_admin:
        logger.warning("firebase_admin library not installed.")
        return False

    try:
        if credentials_path and os.path.exists(credentials_path):
            cred = credentials.Certificate(credentials_path)
            firebase_admin.initialize_app(cred, {"projectId": project_id} if project_id else None)
            logger.info("Firebase initialized with credentials file: %s", credentials_path)
        elif os.environ.get("GOOGLE_APPLICATION_CREDENTIALS") and os.path.exists(os.environ["GOOGLE_APPLICATION_CREDENTIALS"]):
            firebase_admin.initialize_app()
            logger.info("Firebase initialized with GOOGLE_APPLICATION_CREDENTIALS")
        else:
            logger.info("No Firebase credentials provided. Mock/Demo authentication enabled for development.")
            return False

        _db = firestore.client()
        _firebase_initialized = True
        return True
    except Exception as e:
        logger.warning("Could not initialize Firebase Admin SDK: %s. Using local mock/demo store.", e)
        return False


def is_firebase_active() -> bool:
    """Returns True if Firebase Admin SDK is initialized."""
    return _firebase_initialized


# In-memory store for development/testing when Firebase service account is not yet placed
_demo_users: Dict[str, Dict[str, Any]] = {}


def verify_firebase_id_token(id_token: str) -> Optional[Dict[str, Any]]:
    """Verifies Firebase ID token received from mobile client."""
    if not _firebase_initialized or not fb_auth:
        return None
    try:
        decoded_token = fb_auth.verify_id_token(id_token)
        return decoded_token
    except Exception as e:
        logger.error("Failed to verify Firebase token: %s", e)
        return None


def get_user_profile(uid: str) -> Optional[Dict[str, Any]]:
    """Fetches user profile document from Firestore or in-memory store."""
    if _firebase_initialized and _db:
        doc = _db.collection("users").document(uid).get()
        if doc.exists:
            return doc.to_dict()
        return None
    return _demo_users.get(uid)


def save_user_profile(uid: str, profile_data: Dict[str, Any]) -> Dict[str, Any]:
    """Saves or updates user profile document in Firestore or in-memory store."""
    now = datetime.utcnow()
    profile_data["updated_at"] = now

    if _firebase_initialized and _db:
        user_ref = _db.collection("users").document(uid)
        user_ref.set(profile_data, merge=True)
        return profile_data
    
    if uid in _demo_users:
        _demo_users[uid].update(profile_data)
    else:
        profile_data["created_at"] = now
        _demo_users[uid] = profile_data
    return _demo_users[uid]
