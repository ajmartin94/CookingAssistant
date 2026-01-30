"""
Integration Tests for API Response Enrichment (Issue #38, Story 2)

Tests that meal plan entries include enriched recipe fields (servings,
difficulty_level) and library list responses include recipe_count.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


class TestMealPlanEntryRecipeEnrichment:
    """Meal plan entry responses should include servings and difficulty_level in recipe ref."""

    async def _create_plan_with_recipe_entry(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_recipe,
        test_db: AsyncSession,
    ) -> dict:
        """Helper: create a plan, add an entry with test_recipe, return GET response data."""
        # Auto-create plan
        resp = await client.get(
            "/api/v1/meal-plans",
            headers=auth_headers,
            params={"week_start": "2025-01-06"},
        )
        assert resp.status_code == 200
        plan_id = resp.json()["id"]

        # Add entry via upsert
        entry_resp = await client.put(
            f"/api/v1/meal-plans/{plan_id}/entries",
            headers=auth_headers,
            json={
                "date": "2025-01-07",
                "meal_type": "dinner",
                "recipe_id": test_recipe.id,
            },
        )
        assert entry_resp.status_code in (200, 201)

        # Re-fetch the plan to get full response
        plan_resp = await client.get(
            "/api/v1/meal-plans",
            headers=auth_headers,
            params={"week_start": "2025-01-06"},
        )
        assert plan_resp.status_code == 200
        return plan_resp.json()

    @pytest.mark.asyncio
    async def test_meal_plan_entry_recipe_includes_servings(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_user,
        test_recipe,
        test_db: AsyncSession,
    ):
        """Meal plan entry recipe ref should include servings from the linked recipe."""
        data = await self._create_plan_with_recipe_entry(
            client, auth_headers, test_recipe, test_db
        )

        entry = data["entries"][0]
        assert (
            "servings" in entry["recipe"]
        ), "Recipe ref should include 'servings' field"
        assert entry["recipe"]["servings"] == 4

    @pytest.mark.asyncio
    async def test_meal_plan_entry_recipe_includes_difficulty_level(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_user,
        test_recipe,
        test_db: AsyncSession,
    ):
        """Meal plan entry recipe ref should include difficulty_level from the linked recipe."""
        data = await self._create_plan_with_recipe_entry(
            client, auth_headers, test_recipe, test_db
        )

        entry = data["entries"][0]
        assert (
            "difficulty_level" in entry["recipe"]
        ), "Recipe ref should include 'difficulty_level' field"
        assert entry["recipe"]["difficulty_level"] == "easy"

    @pytest.mark.asyncio
    async def test_meal_plan_entry_difficulty_level_is_string_not_enum(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_user,
        test_recipe,
        test_db: AsyncSession,
    ):
        """difficulty_level should be a human-readable string like 'easy', not an enum name."""
        data = await self._create_plan_with_recipe_entry(
            client, auth_headers, test_recipe, test_db
        )

        entry = data["entries"][0]
        difficulty = entry["recipe"].get("difficulty_level")
        assert isinstance(difficulty, str), "difficulty_level should be a string"
        # Should be lowercase human-readable, not ENUM style
        assert (
            difficulty == difficulty.lower()
        ), f"difficulty_level should be lowercase string, got '{difficulty}'"
        assert difficulty in (
            "easy",
            "medium",
            "hard",
        ), f"difficulty_level should be a valid level, got '{difficulty}'"


class TestLibraryResponseRecipeCount:
    """Library list responses should include recipe_count."""

    @pytest.mark.asyncio
    async def test_library_list_includes_recipe_count(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_library,
        test_recipe_in_library,
    ):
        """Library list response should include recipe_count matching actual recipe count."""
        response = await client.get("/api/v1/libraries", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1

        library = next(lib for lib in data if lib["id"] == test_library.id)
        assert (
            "recipe_count" in library
        ), "Library response should include 'recipe_count' field"
        assert library["recipe_count"] == 1

    @pytest.mark.asyncio
    async def test_library_with_no_recipes_returns_recipe_count_zero(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_library,
    ):
        """Library with no recipes should return recipe_count: 0."""
        response = await client.get("/api/v1/libraries", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()

        library = next(lib for lib in data if lib["id"] == test_library.id)
        assert (
            "recipe_count" in library
        ), "Library response should include 'recipe_count' field"
        assert library["recipe_count"] == 0
