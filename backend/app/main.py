"""
Cooking Assistant - FastAPI Application

Main application entry point with CORS configuration,
API versioning, and health check endpoints.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

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
    openapi_url="/api/openapi.json"
)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",  # Vite default port
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
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
        "health": "/api/v1/health"
    }


# Health check endpoint
@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "service": "cooking-assistant-api",
        "version": "1.0.0"
    }


# API version 1 router placeholder
# TODO: Add API routers for recipes, users, meal plans, etc.
# from app.api import recipes, users, meal_plans
# app.include_router(recipes.router, prefix="/api/v1", tags=["recipes"])
# app.include_router(users.router, prefix="/api/v1", tags=["users"])


@app.on_event("startup")
async def startup_event():
    """Initialize services on application startup"""
    logger.info("Starting Cooking Assistant API...")
    # TODO: Initialize database connection
    # TODO: Initialize AI services
    logger.info("Application startup complete")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on application shutdown"""
    logger.info("Shutting down Cooking Assistant API...")
    # TODO: Close database connections
    # TODO: Cleanup AI services
    logger.info("Application shutdown complete")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
