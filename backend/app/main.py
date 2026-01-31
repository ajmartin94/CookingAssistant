"""
Cooking Assistant - FastAPI Application

Main application entry point with CORS configuration,
API versioning, and health check endpoints.
"""

import os
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import logging
import traceback

from app.config import settings
from app.api import (
    users,
    recipes,
    libraries,
    sharing,
    chat,
    feedback,
    meal_plans,
    shopping_lists,
)

# Initialize Sentry if DSN is configured
if settings.sentry_dsn:
    import sentry_sdk

    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        release=settings.app_version,
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
    )

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title="Cooking Assistant API",
    description="AI-powered cooking companion API for managing recipes, meal planning, and cooking guidance",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler to log unhandled errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}")
    logger.error(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "traceback": traceback.format_exc()},
    )


# Determine frontend dist path (relative to backend when running in Docker)
FRONTEND_DIST_PATH = Path(__file__).parent.parent.parent / "frontend" / "dist"


# Root endpoint - serves frontend in production, API info in development
@app.get("/")
async def root():
    """Root endpoint - serves frontend index.html or API info"""
    index_path = FRONTEND_DIST_PATH / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return {
        "message": "Welcome to Cooking Assistant API",
        "version": "1.0.0",
        "docs": "/api/docs",
        "health": "/api/v1/health",
    }


# Health check endpoint
@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {"status": "healthy", "service": "cooking-assistant-api", "version": "1.0.0"}


# Include API routers
app.include_router(users.router, prefix="/api/v1")
app.include_router(recipes.router, prefix="/api/v1")
app.include_router(libraries.router, prefix="/api/v1")
app.include_router(sharing.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(feedback.router, prefix="/api/v1")
app.include_router(meal_plans.router, prefix="/api/v1")
app.include_router(shopping_lists.router, prefix="/api/v1")


# Mount static files for frontend assets (JS, CSS, images)
# This must be after API routes to avoid conflicts
if FRONTEND_DIST_PATH.exists():
    app.mount(
        "/assets",
        StaticFiles(directory=FRONTEND_DIST_PATH / "assets"),
        name="assets",
    )


# Catch-all route for client-side routing (React Router)
# Must be defined after all other routes
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """Serve static files or index.html for client-side routing (SPA catch-all)"""
    # Don't serve frontend for API routes
    if full_path.startswith("api/"):
        return JSONResponse(status_code=404, content={"detail": "Not Found"})

    # Check if the requested file exists in dist (e.g., vite.svg, favicon.ico)
    static_file = FRONTEND_DIST_PATH / full_path
    if static_file.exists() and static_file.is_file():
        return FileResponse(static_file)

    # For all other routes, serve index.html for client-side routing
    index_path = FRONTEND_DIST_PATH / "index.html"
    if index_path.exists():
        return FileResponse(index_path)

    return JSONResponse(status_code=404, content={"detail": "Not Found"})


@app.on_event("startup")
async def startup_event():
    """Initialize services on application startup"""
    import os

    logger.info("Starting Cooking Assistant API...")

    # Import all models to register them with Base.metadata
    from app.models import (
        User,
        Recipe,
        RecipeLibrary,
        RecipeShare,
        Feedback,
    )  # noqa: F401
    from app.database import init_db, engine, Base

    # Log imported models to ensure they're registered
    logger.info(
        f"Imported models: {User.__tablename__}, {Recipe.__tablename__}, {RecipeLibrary.__tablename__}, {RecipeShare.__tablename__}, {Feedback.__tablename__}"
    )

    # For E2E testing, drop and recreate all tables to ensure clean state
    if os.getenv("E2E_TESTING", "false").lower() == "true":
        logger.info("E2E Testing mode: Dropping all tables...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        logger.info("E2E Testing mode: Tables dropped")

    # Initialize database tables if they don't exist
    await init_db()
    logger.info("Database tables initialized")

    logger.info("API documentation available at /api/docs")
    logger.info("Application startup complete")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on application shutdown"""
    logger.info("Shutting down Cooking Assistant API...")
    logger.info("Application shutdown complete")


if __name__ == "__main__":
    import argparse
    import uvicorn
    import os

    parser = argparse.ArgumentParser(description="Cooking Assistant API Server")
    parser.add_argument(
        "--port", type=int, default=8000, help="Port to run the server on"
    )
    args = parser.parse_args()

    # Disable reload during E2E testing to prevent database initialization issues
    reload = os.getenv("E2E_TESTING", "false").lower() != "true"

    uvicorn.run(
        "app.main:app", host="0.0.0.0", port=args.port, reload=reload, log_level="info"
    )
