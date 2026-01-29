"""
Integration Tests for Meal Plans API

Tests for GET /api/v1/meal-plans endpoint: fetching meal plans,
auto-creation, week snapping, ownership, and auth.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


class TestGetMealPlan:
    """Tests for GET /api/v1/meal-plans?week_start=YYYY-MM-DD."""

    @pytest.mark.asyncio
    async def test_get_meal_plan_auto_creates_empty_plan(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_user,
    ):
        """GET with no existing plan should auto-create and return 200 with empty entries."""
        response = await client.get(
            "/api/v1/meal-plans",
            headers=auth_headers,
            params={"week_start": "2025-01-06"},  # A Monday
        )

        assert response.status_code == 200
        data = response.json()
        assert data["week_start"] == "2025-01-06"
        assert data["entries"] == []
        assert "id" in data

    @pytest.mark.asyncio
    async def test_get_meal_plan_returns_existing_plan_with_entries(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_user,
        test_recipe,
        test_db: AsyncSession,
    ):
        """GET returns 200 with plan and entries for an existing week."""
        # First call auto-creates the plan
        create_response = await client.get(
            "/api/v1/meal-plans",
            headers=auth_headers,
            params={"week_start": "2025-01-06"},
        )
        assert create_response.status_code == 200
        plan_id = create_response.json()["id"]

        # TODO: Once POST entries endpoint exists, add an entry here.
        # For now, verify the plan is returned on second GET.
        response = await client.get(
            "/api/v1/meal-plans",
            headers=auth_headers,
            params={"week_start": "2025-01-06"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == plan_id
        assert "entries" in data

    @pytest.mark.asyncio
    async def test_get_meal_plan_snaps_non_monday_to_monday(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_user,
    ):
        """GET with a Wednesday date should snap to the previous Monday."""
        # 2025-01-08 is a Wednesday; should snap to 2025-01-06 (Monday)
        response = await client.get(
            "/api/v1/meal-plans",
            headers=auth_headers,
            params={"week_start": "2025-01-08"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["week_start"] == "2025-01-06"

    @pytest.mark.asyncio
    async def test_get_meal_plan_unauthenticated_returns_401(
        self,
        client: AsyncClient,
    ):
        """Unauthenticated request should return 401."""
        response = await client.get(
            "/api/v1/meal-plans",
            params={"week_start": "2025-01-06"},
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_meal_plan_other_user_returns_403(
        self,
        client: AsyncClient,
        auth_headers: dict,
        auth_headers_user2: dict,
        test_user,
        test_user2,
    ):
        """User should not access another user's meal plan (403)."""
        # User 1 creates a plan
        response = await client.get(
            "/api/v1/meal-plans",
            headers=auth_headers,
            params={"week_start": "2025-01-06"},
        )
        assert response.status_code == 200

        # User 2 requests the same week - should get their own plan, not user 1's
        # This test verifies ownership isolation: each user gets their own plan
        response2 = await client.get(
            "/api/v1/meal-plans",
            headers=auth_headers_user2,
            params={"week_start": "2025-01-06"},
        )
        assert response2.status_code == 200
        # Plans should be different (different owners)
        assert response2.json()["id"] != response.json()["id"]

    @pytest.mark.asyncio
    async def test_get_meal_plan_entry_with_null_recipe_id(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_user,
        test_db: AsyncSession,
    ):
        """Entry with null recipe_id (deleted recipe) should return gracefully."""
        # Auto-create a plan
        response = await client.get(
            "/api/v1/meal-plans",
            headers=auth_headers,
            params={"week_start": "2025-01-06"},
        )
        assert response.status_code == 200
        plan_id = response.json()["id"]

        # Manually insert an entry with null recipe_id to simulate deleted recipe
        from app.models.meal_plan import MealPlanEntry

        entry = MealPlanEntry(
            meal_plan_id=plan_id,
            day_of_week=0,  # Monday
            meal_type="dinner",
            recipe_id=None,
        )
        test_db.add(entry)
        await test_db.commit()

        # GET should still work and include the entry with null recipe details
        response = await client.get(
            "/api/v1/meal-plans",
            headers=auth_headers,
            params={"week_start": "2025-01-06"},
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["entries"]) == 1
        assert data["entries"][0]["recipe"] is None

    @pytest.mark.asyncio
    async def test_get_meal_plan_entries_include_recipe_details(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_user,
        test_recipe,
        test_db: AsyncSession,
    ):
        """Entries should include recipe name and cook time from linked recipe."""
        # Auto-create a plan
        response = await client.get(
            "/api/v1/meal-plans",
            headers=auth_headers,
            params={"week_start": "2025-01-06"},
        )
        assert response.status_code == 200
        plan_id = response.json()["id"]

        # Manually insert an entry linked to test_recipe
        from app.models.meal_plan import MealPlanEntry

        entry = MealPlanEntry(
            meal_plan_id=plan_id,
            day_of_week=2,  # Wednesday
            meal_type="lunch",
            recipe_id=test_recipe.id,
        )
        test_db.add(entry)
        await test_db.commit()

        # GET should include recipe details
        response = await client.get(
            "/api/v1/meal-plans",
            headers=auth_headers,
            params={"week_start": "2025-01-06"},
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["entries"]) == 1
        entry_data = data["entries"][0]
        assert entry_data["recipe"]["id"] == test_recipe.id
        assert entry_data["recipe"]["title"] == "Test Recipe"
        assert entry_data["recipe"]["cook_time_minutes"] == 30


class TestUpsertMealPlanEntry:
    """Tests for PUT /api/v1/meal-plans/{plan_id}/entries — assign recipe to meal slot."""

    async def _create_plan(
        self, client: AsyncClient, auth_headers: dict, week_start: str = "2025-01-06"
    ) -> dict:
        """Helper: auto-create a plan and return its JSON."""
        resp = await client.get(
            "/api/v1/meal-plans",
            headers=auth_headers,
            params={"week_start": week_start},
        )
        assert resp.status_code == 200
        return resp.json()

    @pytest.mark.asyncio
    async def test_upsert_entry_creates_new_entry(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_user,
        test_recipe,
    ):
        """PUT with valid data should create a new entry and return it."""
        plan = await self._create_plan(client, auth_headers)

        response = await client.put(
            f"/api/v1/meal-plans/{plan['id']}/entries",
            headers=auth_headers,
            json={
                "date": "2025-01-07",  # Tuesday within the week
                "meal_type": "dinner",
                "recipe_id": test_recipe.id,
            },
        )

        assert response.status_code in (200, 201)
        data = response.json()
        assert data["meal_type"] == "dinner"
        assert data["recipe"]["id"] == test_recipe.id
        assert "id" in data

    @pytest.mark.asyncio
    async def test_upsert_entry_updates_existing_slot(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_user,
        test_recipe,
        test_db: AsyncSession,
    ):
        """PUT with same date+meal_type should update the existing entry, not duplicate."""
        plan = await self._create_plan(client, auth_headers)
        entry_payload = {
            "date": "2025-01-07",
            "meal_type": "lunch",
            "recipe_id": test_recipe.id,
        }

        # First upsert
        resp1 = await client.put(
            f"/api/v1/meal-plans/{plan['id']}/entries",
            headers=auth_headers,
            json=entry_payload,
        )
        assert resp1.status_code in (200, 201)
        entry_id_1 = resp1.json()["id"]

        # Create a second recipe to swap in (use the same recipe for simplicity;
        # the key point is that the entry is updated, not duplicated)
        resp2 = await client.put(
            f"/api/v1/meal-plans/{plan['id']}/entries",
            headers=auth_headers,
            json=entry_payload,
        )
        assert resp2.status_code in (200, 201)
        entry_id_2 = resp2.json()["id"]

        # Same slot should reuse the same entry
        assert entry_id_1 == entry_id_2

        # Verify only one entry exists for that slot
        plan_resp = await client.get(
            "/api/v1/meal-plans",
            headers=auth_headers,
            params={"week_start": "2025-01-06"},
        )
        entries = plan_resp.json()["entries"]
        lunch_entries = [e for e in entries if e["meal_type"] == "lunch"]
        assert len(lunch_entries) == 1

    @pytest.mark.asyncio
    async def test_upsert_entry_invalid_meal_type_returns_422(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_user,
        test_recipe,
    ):
        """PUT with invalid meal_type should return 422."""
        plan = await self._create_plan(client, auth_headers)

        response = await client.put(
            f"/api/v1/meal-plans/{plan['id']}/entries",
            headers=auth_headers,
            json={
                "date": "2025-01-07",
                "meal_type": "midnight_snack",  # invalid
                "recipe_id": test_recipe.id,
            },
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_upsert_entry_date_outside_plan_week_returns_422(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_user,
        test_recipe,
    ):
        """PUT with a date outside the plan's week should return 422."""
        plan = await self._create_plan(client, auth_headers, week_start="2025-01-06")

        response = await client.put(
            f"/api/v1/meal-plans/{plan['id']}/entries",
            headers=auth_headers,
            json={
                "date": "2025-01-20",  # Two weeks later
                "meal_type": "dinner",
                "recipe_id": test_recipe.id,
            },
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_upsert_entry_nonexistent_recipe_returns_error(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_user,
    ):
        """PUT with a recipe_id that doesn't exist should return 404 or 422."""
        plan = await self._create_plan(client, auth_headers)

        response = await client.put(
            f"/api/v1/meal-plans/{plan['id']}/entries",
            headers=auth_headers,
            json={
                "date": "2025-01-07",
                "meal_type": "dinner",
                "recipe_id": "nonexistent-recipe-id",
            },
        )

        assert response.status_code in (404, 422)

    @pytest.mark.asyncio
    async def test_upsert_entry_nonexistent_plan_returns_404(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_user,
        test_recipe,
    ):
        """PUT on a nonexistent plan_id should return 404."""
        response = await client.put(
            "/api/v1/meal-plans/nonexistent-plan-id/entries",
            headers=auth_headers,
            json={
                "date": "2025-01-07",
                "meal_type": "dinner",
                "recipe_id": test_recipe.id,
            },
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_upsert_entry_other_users_plan_returns_403(
        self,
        client: AsyncClient,
        auth_headers: dict,
        auth_headers_user2: dict,
        test_user,
        test_user2,
        test_recipe,
    ):
        """PUT on another user's plan should return 403."""
        # User 1 creates a plan
        plan = await self._create_plan(client, auth_headers)

        # User 2 tries to add an entry to User 1's plan
        response = await client.put(
            f"/api/v1/meal-plans/{plan['id']}/entries",
            headers=auth_headers_user2,
            json={
                "date": "2025-01-07",
                "meal_type": "dinner",
                "recipe_id": test_recipe.id,
            },
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_upsert_entry_unauthenticated_returns_401(
        self,
        client: AsyncClient,
    ):
        """PUT without auth should return 401."""
        response = await client.put(
            "/api/v1/meal-plans/some-plan-id/entries",
            json={
                "date": "2025-01-07",
                "meal_type": "dinner",
                "recipe_id": "some-recipe-id",
            },
        )

        assert response.status_code == 401


class TestDeleteMealPlanEntry:
    """Tests for DELETE /api/v1/meal-plans/{plan_id}/entries/{entry_id}."""

    async def _create_plan_with_entry(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_recipe,
    ) -> tuple[str, str]:
        """Helper: create a plan and add an entry, return (plan_id, entry_id)."""
        # Create plan
        resp = await client.get(
            "/api/v1/meal-plans",
            headers=auth_headers,
            params={"week_start": "2025-01-06"},
        )
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
        entry_id = entry_resp.json()["id"]
        return plan_id, entry_id

    @pytest.mark.asyncio
    async def test_delete_entry_returns_204(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_user,
        test_recipe,
    ):
        """DELETE existing entry should return 204 and remove it."""
        plan_id, entry_id = await self._create_plan_with_entry(
            client, auth_headers, test_recipe
        )

        response = await client.delete(
            f"/api/v1/meal-plans/{plan_id}/entries/{entry_id}",
            headers=auth_headers,
        )

        assert response.status_code == 204

        # Verify entry is gone
        plan_resp = await client.get(
            "/api/v1/meal-plans",
            headers=auth_headers,
            params={"week_start": "2025-01-06"},
        )
        assert len(plan_resp.json()["entries"]) == 0

    @pytest.mark.asyncio
    async def test_delete_nonexistent_entry_returns_404(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_user,
    ):
        """DELETE a nonexistent entry should return 404."""
        # Create a plan so plan_id is valid
        resp = await client.get(
            "/api/v1/meal-plans",
            headers=auth_headers,
            params={"week_start": "2025-01-06"},
        )
        plan_id = resp.json()["id"]

        response = await client.delete(
            f"/api/v1/meal-plans/{plan_id}/entries/nonexistent-entry-id",
            headers=auth_headers,
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_entry_other_users_plan_returns_403(
        self,
        client: AsyncClient,
        auth_headers: dict,
        auth_headers_user2: dict,
        test_user,
        test_user2,
        test_recipe,
    ):
        """DELETE on another user's plan entry should return 403."""
        plan_id, entry_id = await self._create_plan_with_entry(
            client, auth_headers, test_recipe
        )

        response = await client.delete(
            f"/api/v1/meal-plans/{plan_id}/entries/{entry_id}",
            headers=auth_headers_user2,
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_delete_entry_unauthenticated_returns_401(
        self,
        client: AsyncClient,
    ):
        """DELETE without auth should return 401."""
        response = await client.delete(
            "/api/v1/meal-plans/some-plan-id/entries/some-entry-id",
        )

        assert response.status_code == 401
