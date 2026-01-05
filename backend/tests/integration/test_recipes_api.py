"""
Integration Tests for Recipes API

Tests for recipe CRUD operations, filtering, pagination, and ownership checks.
"""

import pytest
from httpx import AsyncClient


# List Recipes Tests


@pytest.mark.asyncio
async def test_list_recipes_authenticated(
    client: AsyncClient, auth_headers, test_user, test_db
):
    """Test listing recipes when authenticated"""
    # Create some test recipes first
    from tests.utils.helpers import create_test_recipe

    await create_test_recipe(test_db, test_user, "Recipe 1")
    await create_test_recipe(test_db, test_user, "Recipe 2")

    response = await client.get("/api/v1/recipes", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert "recipes" in data
    assert "total" in data
    assert data["total"] >= 2
    assert len(data["recipes"]) >= 2


@pytest.mark.asyncio
async def test_list_recipes_unauthenticated(client: AsyncClient):
    """Test listing recipes without authentication"""
    response = await client.get("/api/v1/recipes")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_recipes_filter_by_cuisine(
    client: AsyncClient, auth_headers, test_user, test_db
):
    """Test filtering recipes by cuisine type"""
    from tests.utils.helpers import create_test_recipe

    await create_test_recipe(test_db, test_user, "Italian Pasta", cuisine_type="Italian")
    await create_test_recipe(test_db, test_user, "Chinese Rice", cuisine_type="Chinese")

    response = await client.get(
        "/api/v1/recipes", headers=auth_headers, params={"cuisine_type": "Italian"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    # All returned recipes should be Italian
    assert all(r["cuisine_type"] == "Italian" for r in data["recipes"])


@pytest.mark.asyncio
async def test_list_recipes_filter_by_difficulty(
    client: AsyncClient, auth_headers, test_user, test_db
):
    """Test filtering recipes by difficulty level"""
    from tests.utils.helpers import create_test_recipe

    await create_test_recipe(test_db, test_user, "Easy Recipe", difficulty_level="easy")
    await create_test_recipe(test_db, test_user, "Hard Recipe", difficulty_level="hard")

    response = await client.get(
        "/api/v1/recipes", headers=auth_headers, params={"difficulty": "easy"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert all(r["difficulty_level"] == "easy" for r in data["recipes"])


@pytest.mark.asyncio
async def test_list_recipes_search(client: AsyncClient, auth_headers, test_user, test_db):
    """Test searching recipes by title"""
    from tests.utils.helpers import create_test_recipe

    await create_test_recipe(test_db, test_user, "Chocolate Cake")
    await create_test_recipe(test_db, test_user, "Vanilla Cake")

    response = await client.get(
        "/api/v1/recipes", headers=auth_headers, params={"search": "Chocolate"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert any("Chocolate" in r["title"] for r in data["recipes"])


@pytest.mark.asyncio
async def test_list_recipes_pagination(
    client: AsyncClient, auth_headers, test_user, test_db
):
    """Test recipe pagination"""
    from tests.utils.helpers import create_test_recipe

    # Create 15 recipes
    for i in range(15):
        await create_test_recipe(test_db, test_user, f"Recipe {i}")

    # Get first page (10 items)
    response = await client.get(
        "/api/v1/recipes", headers=auth_headers, params={"page": 1, "page_size": 10}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["page"] == 1
    assert data["page_size"] == 10
    assert len(data["recipes"]) == 10
    assert data["total"] >= 15

    # Get second page
    response2 = await client.get(
        "/api/v1/recipes", headers=auth_headers, params={"page": 2, "page_size": 10}
    )

    assert response2.status_code == 200
    data2 = response2.json()
    assert data2["page"] == 2
    assert len(data2["recipes"]) >= 5  # At least 5 more


@pytest.mark.asyncio
async def test_list_recipes_only_shows_user_recipes(
    client: AsyncClient, auth_headers, auth_headers_user2, test_user, test_user2, test_db
):
    """Test that users only see their own recipes"""
    from tests.utils.helpers import create_test_recipe

    await create_test_recipe(test_db, test_user, "User1 Recipe")
    await create_test_recipe(test_db, test_user2, "User2 Recipe")

    # User 1's request
    response = await client.get("/api/v1/recipes", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    # Should only see user1's recipes
    assert all(r["owner_id"] == test_user.id for r in data["recipes"])


# Create Recipe Tests


@pytest.mark.asyncio
async def test_create_recipe_success(
    client: AsyncClient, auth_headers, sample_ingredients, sample_instructions
):
    """Test successful recipe creation"""
    response = await client.post(
        "/api/v1/recipes",
        headers=auth_headers,
        json={
            "title": "New Recipe",
            "description": "A delicious recipe",
            "ingredients": [ing.model_dump() for ing in sample_ingredients],
            "instructions": [inst.model_dump() for inst in sample_instructions],
            "prep_time_minutes": 15,
            "cook_time_minutes": 30,
            "servings": 4,
            "cuisine_type": "American",
            "difficulty_level": "medium",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "New Recipe"
    assert data["description"] == "A delicious recipe"
    assert len(data["ingredients"]) == len(sample_ingredients)
    assert len(data["instructions"]) == len(sample_instructions)
    assert data["total_time_minutes"] == 45  # 15 + 30
    assert "id" in data


@pytest.mark.asyncio
async def test_create_recipe_unauthenticated(client: AsyncClient, sample_ingredients, sample_instructions):
    """Test creating recipe without authentication"""
    response = await client.post(
        "/api/v1/recipes",
        json={
            "title": "New Recipe",
            "ingredients": [ing.model_dump() for ing in sample_ingredients],
            "instructions": [inst.model_dump() for inst in sample_instructions],
            "servings": 4,
        },
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_recipe_missing_title(
    client: AsyncClient, auth_headers, sample_ingredients, sample_instructions
):
    """Test creating recipe without title"""
    response = await client.post(
        "/api/v1/recipes",
        headers=auth_headers,
        json={
            "ingredients": [ing.model_dump() for ing in sample_ingredients],
            "instructions": [inst.model_dump() for inst in sample_instructions],
        },
    )

    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_create_recipe_empty_ingredients(
    client: AsyncClient, auth_headers, sample_instructions
):
    """Test creating recipe with empty ingredients list"""
    response = await client.post(
        "/api/v1/recipes",
        headers=auth_headers,
        json={
            "title": "Recipe",
            "ingredients": [],
            "instructions": [inst.model_dump() for inst in sample_instructions],
        },
    )

    assert response.status_code == 422  # Validation error


# Get Recipe Tests


@pytest.mark.asyncio
async def test_get_recipe_success(client: AsyncClient, auth_headers, test_recipe):
    """Test getting recipe details"""
    response = await client.get(
        f"/api/v1/recipes/{test_recipe.id}", headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_recipe.id
    assert data["title"] == test_recipe.title
    assert len(data["ingredients"]) > 0
    assert len(data["instructions"]) > 0


@pytest.mark.asyncio
async def test_get_recipe_not_found(client: AsyncClient, auth_headers):
    """Test getting non-existent recipe"""
    response = await client.get(
        "/api/v1/recipes/nonexistent-id", headers=auth_headers
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_recipe_unauthenticated(client: AsyncClient, test_recipe):
    """Test getting recipe without authentication"""
    response = await client.get(f"/api/v1/recipes/{test_recipe.id}")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_recipe_wrong_owner(
    client: AsyncClient, auth_headers_user2, test_recipe
):
    """Test getting recipe owned by different user"""
    response = await client.get(
        f"/api/v1/recipes/{test_recipe.id}", headers=auth_headers_user2
    )

    assert response.status_code == 403  # Forbidden


# Update Recipe Tests


@pytest.mark.asyncio
async def test_update_recipe_success(client: AsyncClient, auth_headers, test_recipe):
    """Test successful recipe update"""
    response = await client.put(
        f"/api/v1/recipes/{test_recipe.id}",
        headers=auth_headers,
        json={"title": "Updated Title", "description": "Updated description"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Title"
    assert data["description"] == "Updated description"


@pytest.mark.asyncio
async def test_update_recipe_partial(client: AsyncClient, auth_headers, test_recipe):
    """Test partial recipe update"""
    original_title = test_recipe.title

    response = await client.put(
        f"/api/v1/recipes/{test_recipe.id}",
        headers=auth_headers,
        json={"servings": 6},  # Only update servings
    )

    assert response.status_code == 200
    data = response.json()
    assert data["servings"] == 6
    assert data["title"] == original_title  # Unchanged


@pytest.mark.asyncio
async def test_update_recipe_not_found(client: AsyncClient, auth_headers):
    """Test updating non-existent recipe"""
    response = await client.put(
        "/api/v1/recipes/nonexistent-id",
        headers=auth_headers,
        json={"title": "New Title"},
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_recipe_unauthenticated(client: AsyncClient, test_recipe):
    """Test updating recipe without authentication"""
    response = await client.put(
        f"/api/v1/recipes/{test_recipe.id}", json={"title": "New Title"}
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_recipe_wrong_owner(
    client: AsyncClient, auth_headers_user2, test_recipe
):
    """Test updating recipe owned by different user"""
    response = await client.put(
        f"/api/v1/recipes/{test_recipe.id}",
        headers=auth_headers_user2,
        json={"title": "Hacked Title"},
    )

    assert response.status_code == 403


# Delete Recipe Tests


@pytest.mark.asyncio
async def test_delete_recipe_success(client: AsyncClient, auth_headers, test_db, test_user):
    """Test successful recipe deletion"""
    from tests.utils.helpers import create_test_recipe

    recipe = await create_test_recipe(test_db, test_user, "To Delete")

    response = await client.delete(
        f"/api/v1/recipes/{recipe.id}", headers=auth_headers
    )

    assert response.status_code == 204

    # Verify deletion
    get_response = await client.get(
        f"/api/v1/recipes/{recipe.id}", headers=auth_headers
    )
    assert get_response.status_code == 404


@pytest.mark.asyncio
async def test_delete_recipe_not_found(client: AsyncClient, auth_headers):
    """Test deleting non-existent recipe"""
    response = await client.delete(
        "/api/v1/recipes/nonexistent-id", headers=auth_headers
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_recipe_unauthenticated(client: AsyncClient, test_recipe):
    """Test deleting recipe without authentication"""
    response = await client.delete(f"/api/v1/recipes/{test_recipe.id}")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_delete_recipe_wrong_owner(
    client: AsyncClient, auth_headers_user2, test_recipe
):
    """Test deleting recipe owned by different user"""
    response = await client.delete(
        f"/api/v1/recipes/{test_recipe.id}", headers=auth_headers_user2
    )

    assert response.status_code == 403
