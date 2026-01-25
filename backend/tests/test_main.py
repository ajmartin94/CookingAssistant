"""
Basic tests for the FastAPI application
"""

import pytest
from httpx import AsyncClient
from app.main import app, FRONTEND_DIST_PATH


@pytest.mark.asyncio
async def test_root_endpoint():
    """Test the root endpoint returns correct response.

    If frontend dist exists, serves index.html (production mode).
    Otherwise, returns JSON API info (development mode).
    """
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 200

        index_path = FRONTEND_DIST_PATH / "index.html"
        if index_path.exists():
            # Production mode: serves HTML
            assert "text/html" in response.headers.get("content-type", "")
            assert (
                b"<!doctype html>" in response.content.lower()
                or b"<!DOCTYPE html>" in response.content
            )
        else:
            # Development mode: serves JSON
            data = response.json()
            assert "message" in data
            assert "version" in data
            assert data["version"] == "1.0.0"


@pytest.mark.asyncio
async def test_health_check():
    """Test the health check endpoint"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "cooking-assistant-api"


def test_app_config():
    """Test application configuration"""
    assert app.title == "Cooking Assistant API"
    assert app.version == "1.0.0"
