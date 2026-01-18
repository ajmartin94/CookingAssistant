"""
Cooking Assistant - FastAPI Application

Main application entry point with CORS configuration,
API versioning, and health check endpoints.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.config import settings
from app.api import users, recipes, libraries, sharing

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


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
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


@app.on_event("startup")
async def startup_event():
    """Initialize services on application startup"""
    import os

    logger.info("Starting Cooking Assistant API...")

    # Import all models to register them with Base.metadata
    from app.models import User, Recipe, RecipeLibrary, RecipeShare  # noqa: F401
    from app.database import init_db, engine, Base

    # Log imported models to ensure they're registered
    logger.info(
        f"Imported models: {User.__tablename__}, {Recipe.__tablename__}, {RecipeLibrary.__tablename__}, {RecipeShare.__tablename__}"
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
    import uvicorn
    import os

    # Disable reload during E2E testing to prevent database initialization issues
    reload = os.getenv("E2E_TESTING", "false").lower() != "true"

    uvicorn.run(
        "app.main:app", host="0.0.0.0", port=8000, reload=reload, log_level="info"
    )
