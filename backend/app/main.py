"""
BuildHer Backend - FastAPI Application

Main entry point for the BuildHer API server.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.router import api_router

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


from app.services.firebase_service import init_firebase, is_firebase_active

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    logger.info("=" * 60)
    logger.info(f"  {settings.app_name} API v{settings.app_version}")
    logger.info(f"  Debug mode: {settings.debug}")
    logger.info(f"  Server: http://{settings.host}:{settings.port}")
    logger.info(f"  Health: http://{settings.host}:{settings.port}/api/v1/health")
    logger.info("=" * 60)
    
    # Initialize Firebase Admin SDK
    fb_initialized = init_firebase(
        credentials_path=settings.firebase_credentials_path,
        project_id=settings.firebase_project_id
    )
    if fb_initialized:
        logger.info("Firebase services successfully initialized.")
    else:
        logger.info("Running with dev/mock auth store (set FIREBASE_CREDENTIALS_PATH in .env for production).")

    yield
    logger.info("BuildHer API shutting down...")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.app_name,
        description=(
            "BuildHer API — Women Entrepreneurship Platform. "
            "Provides AI-powered skill discovery, business tools, "
            "marketplace, and order management."
        ),
        version=settings.app_version,
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        lifespan=lifespan,
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include API routes
    app.include_router(api_router)

    # Root redirect to docs
    @app.get("/", include_in_schema=False)
    async def root():
        return {
            "message": f"Welcome to {settings.app_name} API",
            "docs": "/docs",
            "health": "/api/v1/health",
        }

    return app


app = create_app()
