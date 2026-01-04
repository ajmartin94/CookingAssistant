"""
Integration Tests for Sharing API

Tests for share creation, retrieval, and access control.
"""

import pytest
from httpx import AsyncClient
from datetime import datetime, timedelta


@pytest.mark.asyncio
async def test_create_recipe_share_success(client: AsyncClient, auth_headers, test_recipe, test_user2):
    """Test successful recipe share creation"""
    response = await client.post(
        "/api/v1/shares",
        headers=auth_headers,
        json={
            "recipe_id": test_recipe.id,
            "shared_with_id": test_user2.id,
            "permission": "view",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert "share_token" in data
    assert "share_url" in data


@pytest.mark.asyncio
async def test_create_share_unauthenticated(client: AsyncClient, test_recipe, test_user2):
    """Test creating share without authentication"""
    response = await client.post(
        "/api/v1/shares",
        json={"recipe_id": test_recipe.id, "shared_with_id": test_user2.id, "permission": "view"},
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_share_not_owner(client: AsyncClient, auth_headers_user2, test_recipe, test_user):
    """Test creating share for recipe user doesn't own"""
    response = await client.post(
        "/api/v1/shares",
        headers=auth_headers_user2,
        json={"recipe_id": test_recipe.id, "shared_with_id": test_user.id, "permission": "view"},
    )

    assert response.status_code == 403


@pytest.mark.skip(reason="Endpoint not fully implemented")
@pytest.mark.asyncio
async def test_list_user_shares(client: AsyncClient, auth_headers):
    """Test listing shares created by user"""
    response = await client.get("/api/v1/shares", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.skip(reason="Endpoint not fully implemented")
@pytest.mark.asyncio
async def test_list_received_shares(client: AsyncClient, auth_headers):
    """Test listing shares received by user"""
    response = await client.get("/api/v1/shares/with-me", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.skip(reason="Endpoint not fully implemented")
@pytest.mark.asyncio
async def test_get_shared_resource(client: AsyncClient, test_recipe, test_user, test_user2, test_db):
    """Test accessing shared resource via token"""
    from app.services.share_service import create_share
    from app.schemas.share import ShareCreate

    # Create share
    share_data = ShareCreate(
        recipe_id=test_recipe.id,
        shared_with_id=test_user2.id,
        permission="view",
    )
    share = await create_share(test_db, share_data, test_user)

    # Access via token (no auth required)
    response = await client.get(f"/api/v1/shares/{share.share_token}")

    assert response.status_code == 200


@pytest.mark.skip(reason="Endpoint not fully implemented")
@pytest.mark.asyncio
async def test_get_shared_resource_invalid_token(client: AsyncClient):
    """Test accessing with invalid share token"""
    response = await client.get("/api/v1/shares/invalid-token")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_share_success(client: AsyncClient, auth_headers, test_recipe, test_user, test_user2, test_db):
    """Test successful share deletion"""
    from app.services.share_service import create_share
    from app.schemas.share import ShareCreate

    share_data = ShareCreate(
        recipe_id=test_recipe.id,
        shared_with_id=test_user2.id,
        permission="view",
    )
    share = await create_share(test_db, share_data, test_user)

    response = await client.delete(f"/api/v1/shares/{share.id}", headers=auth_headers)

    assert response.status_code == 204


@pytest.mark.asyncio
async def test_delete_share_not_creator(client: AsyncClient, auth_headers_user2, test_recipe, test_user, test_user2, test_db):
    """Test deleting share user didn't create"""
    from app.services.share_service import create_share
    from app.schemas.share import ShareCreate

    share_data = ShareCreate(
        recipe_id=test_recipe.id,
        shared_with_id=test_user2.id,
        permission="view",
    )
    share = await create_share(test_db, share_data, test_user)

    response = await client.delete(f"/api/v1/shares/{share.id}", headers=auth_headers_user2)

    assert response.status_code == 403
