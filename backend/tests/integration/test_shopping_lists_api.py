"""
Integration Tests for Shopping Lists API

Tests for shopping list CRUD operations, item management, and ownership checks.
"""

import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient

from app.ai.exceptions import LLMTimeoutError


class TestCreateShoppingList:
    """Tests for POST /api/v1/shopping-lists."""

    @pytest.mark.asyncio
    async def test_create_shopping_list(self, client: AsyncClient, auth_headers):
        """Creating a shopping list should return 201 with the new list."""
        response = await client.post(
            "/api/v1/shopping-lists",
            headers=auth_headers,
            json={"name": "Weekly Groceries"},
        )

        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["name"] == "Weekly Groceries"

    @pytest.mark.asyncio
    async def test_create_shopping_list_unauthenticated(self, client: AsyncClient):
        """Creating a shopping list without auth should return 401."""
        response = await client.post(
            "/api/v1/shopping-lists",
            json={"name": "Weekly Groceries"},
        )

        assert response.status_code == 401


class TestListShoppingLists:
    """Tests for GET /api/v1/shopping-lists."""

    @pytest.mark.asyncio
    async def test_list_shopping_lists_empty(self, client: AsyncClient, auth_headers):
        """Listing shopping lists with none created should return empty array."""
        response = await client.get("/api/v1/shopping-lists", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    @pytest.mark.asyncio
    async def test_list_shopping_lists_populated(
        self, client: AsyncClient, auth_headers
    ):
        """Listing shopping lists after creating some should return them."""
        await client.post(
            "/api/v1/shopping-lists",
            headers=auth_headers,
            json={"name": "List A"},
        )
        await client.post(
            "/api/v1/shopping-lists",
            headers=auth_headers,
            json={"name": "List B"},
        )

        response = await client.get("/api/v1/shopping-lists", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2
        names = [item["name"] for item in data]
        assert "List A" in names
        assert "List B" in names

    @pytest.mark.asyncio
    async def test_list_shopping_lists_unauthenticated(self, client: AsyncClient):
        """Listing shopping lists without auth should return 401."""
        response = await client.get("/api/v1/shopping-lists")

        assert response.status_code == 401


class TestGetShoppingList:
    """Tests for GET /api/v1/shopping-lists/{id}."""

    @pytest.mark.asyncio
    async def test_get_shopping_list(self, client: AsyncClient, auth_headers):
        """Getting a shopping list by ID should return it with items."""
        create_resp = await client.post(
            "/api/v1/shopping-lists",
            headers=auth_headers,
            json={"name": "My List"},
        )
        list_id = create_resp.json()["id"]

        response = await client.get(
            f"/api/v1/shopping-lists/{list_id}", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == list_id
        assert data["name"] == "My List"
        assert "items" in data

    @pytest.mark.asyncio
    async def test_get_shopping_list_other_user(
        self, client: AsyncClient, auth_headers, auth_headers_user2
    ):
        """Getting another user's shopping list should return 404."""
        create_resp = await client.post(
            "/api/v1/shopping-lists",
            headers=auth_headers,
            json={"name": "Private List"},
        )
        list_id = create_resp.json()["id"]

        response = await client.get(
            f"/api/v1/shopping-lists/{list_id}", headers=auth_headers_user2
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_shopping_list_unauthenticated(self, client: AsyncClient):
        """Getting a shopping list without auth should return 401."""
        response = await client.get("/api/v1/shopping-lists/some-fake-id")

        assert response.status_code == 401


class TestAddShoppingListItem:
    """Tests for POST /api/v1/shopping-lists/{id}/items."""

    @pytest.mark.asyncio
    async def test_add_item_to_shopping_list(self, client: AsyncClient, auth_headers):
        """Adding an item to a shopping list should return updated list."""
        create_resp = await client.post(
            "/api/v1/shopping-lists",
            headers=auth_headers,
            json={"name": "Grocery List"},
        )
        list_id = create_resp.json()["id"]

        response = await client.post(
            f"/api/v1/shopping-lists/{list_id}/items",
            headers=auth_headers,
            json={"name": "Milk", "amount": "1", "unit": "gallon", "category": "Dairy"},
        )

        assert response.status_code == 201
        data = response.json()
        assert len(data["items"]) == 1
        item = data["items"][0]
        assert "id" in item
        assert item["name"] == "Milk"
        assert item["amount"] == "1"
        assert item["unit"] == "gallon"
        assert item["category"] == "Dairy"

    @pytest.mark.asyncio
    async def test_add_item_other_user(
        self, client: AsyncClient, auth_headers, auth_headers_user2
    ):
        """Adding an item to another user's list should return 404."""
        create_resp = await client.post(
            "/api/v1/shopping-lists",
            headers=auth_headers,
            json={"name": "Private List"},
        )
        list_id = create_resp.json()["id"]

        response = await client.post(
            f"/api/v1/shopping-lists/{list_id}/items",
            headers=auth_headers_user2,
            json={"name": "Milk", "amount": "1", "unit": "gallon", "category": "Dairy"},
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_add_item_unauthenticated(self, client: AsyncClient):
        """Adding an item without auth should return 401."""
        response = await client.post(
            "/api/v1/shopping-lists/some-fake-id/items",
            json={"name": "Milk"},
        )

        assert response.status_code == 401


class TestDeleteShoppingListItem:
    """Tests for DELETE /api/v1/shopping-lists/{id}/items/{item_id}."""

    @pytest.mark.asyncio
    async def test_delete_item_from_shopping_list(
        self, client: AsyncClient, auth_headers
    ):
        """Deleting an item should return 204 and remove it."""
        create_resp = await client.post(
            "/api/v1/shopping-lists",
            headers=auth_headers,
            json={"name": "Grocery List"},
        )
        list_id = create_resp.json()["id"]

        add_resp = await client.post(
            f"/api/v1/shopping-lists/{list_id}/items",
            headers=auth_headers,
            json={"name": "Milk", "amount": "1", "unit": "gallon", "category": "Dairy"},
        )
        item_id = add_resp.json()["items"][0]["id"]

        response = await client.delete(
            f"/api/v1/shopping-lists/{list_id}/items/{item_id}",
            headers=auth_headers,
        )

        assert response.status_code == 204

        # Verify item is gone
        get_resp = await client.get(
            f"/api/v1/shopping-lists/{list_id}", headers=auth_headers
        )
        assert len(get_resp.json()["items"]) == 0

    @pytest.mark.asyncio
    async def test_delete_item_other_user(
        self, client: AsyncClient, auth_headers, auth_headers_user2
    ):
        """Deleting an item from another user's list should return 404."""
        create_resp = await client.post(
            "/api/v1/shopping-lists",
            headers=auth_headers,
            json={"name": "Private List"},
        )
        list_id = create_resp.json()["id"]

        add_resp = await client.post(
            f"/api/v1/shopping-lists/{list_id}/items",
            headers=auth_headers,
            json={"name": "Milk", "amount": "1", "unit": "gallon", "category": "Dairy"},
        )
        item_id = add_resp.json()["items"][0]["id"]

        response = await client.delete(
            f"/api/v1/shopping-lists/{list_id}/items/{item_id}",
            headers=auth_headers_user2,
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_item_unauthenticated(self, client: AsyncClient):
        """Deleting an item without auth should return 401."""
        response = await client.delete(
            "/api/v1/shopping-lists/fake-id/items/fake-item-id"
        )

        assert response.status_code == 401


class TestDeleteShoppingList:
    """Tests for DELETE /api/v1/shopping-lists/{id}."""

    @pytest.mark.asyncio
    async def test_delete_shopping_list(self, client: AsyncClient, auth_headers):
        """Deleting a shopping list should return 204."""
        create_resp = await client.post(
            "/api/v1/shopping-lists",
            headers=auth_headers,
            json={"name": "To Delete"},
        )
        list_id = create_resp.json()["id"]

        response = await client.delete(
            f"/api/v1/shopping-lists/{list_id}", headers=auth_headers
        )

        assert response.status_code == 204

        # Verify it's gone
        get_resp = await client.get(
            f"/api/v1/shopping-lists/{list_id}", headers=auth_headers
        )
        assert get_resp.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_shopping_list_other_user(
        self, client: AsyncClient, auth_headers, auth_headers_user2
    ):
        """Deleting another user's shopping list should return 404."""
        create_resp = await client.post(
            "/api/v1/shopping-lists",
            headers=auth_headers,
            json={"name": "Private List"},
        )
        list_id = create_resp.json()["id"]

        response = await client.delete(
            f"/api/v1/shopping-lists/{list_id}", headers=auth_headers_user2
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_shopping_list_unauthenticated(self, client: AsyncClient):
        """Deleting a shopping list without auth should return 401."""
        response = await client.delete("/api/v1/shopping-lists/fake-id")

        assert response.status_code == 401


class TestGenerateShoppingList:
    """Tests for POST /api/v1/shopping-lists/generate — AI-powered list generation from meal plan."""

    async def _create_recipe_with_ingredients(
        self, client: AsyncClient, auth_headers: dict, title: str, ingredients: list
    ) -> str:
        """Helper: create a recipe and return its ID."""
        response = await client.post(
            "/api/v1/recipes",
            headers=auth_headers,
            json={
                "title": title,
                "description": f"Test recipe: {title}",
                "ingredients": ingredients,
                "instructions": [
                    {"step_number": 1, "instruction": "Cook it", "duration_minutes": 10}
                ],
                "prep_time_minutes": 5,
                "cook_time_minutes": 10,
                "servings": 4,
            },
        )
        assert response.status_code == 201
        return response.json()["id"]

    async def _setup_meal_plan_with_recipes(
        self,
        client: AsyncClient,
        auth_headers: dict,
        week_start: str,
        recipe_ids: list[str],
    ) -> str:
        """Helper: create a meal plan and assign recipes to slots, return plan ID."""
        # Auto-create the meal plan by fetching it
        plan_resp = await client.get(
            "/api/v1/meal-plans",
            headers=auth_headers,
            params={"week_start": week_start},
        )
        assert plan_resp.status_code == 200
        plan_id = plan_resp.json()["id"]

        meal_types = ["breakfast", "lunch", "dinner"]
        # week_start is a Monday; assign recipes to successive day+meal slots
        from datetime import date, timedelta

        base_date = date.fromisoformat(week_start)
        for i, recipe_id in enumerate(recipe_ids):
            day_offset = i // len(meal_types)
            meal_type = meal_types[i % len(meal_types)]
            entry_date = base_date + timedelta(days=day_offset)
            await client.put(
                f"/api/v1/meal-plans/{plan_id}/entries",
                headers=auth_headers,
                json={
                    "date": entry_date.isoformat(),
                    "meal_type": meal_type,
                    "recipe_id": recipe_id,
                },
            )

        return plan_id

    @pytest.mark.asyncio
    async def test_generate_returns_list_with_consolidated_items(
        self, client: AsyncClient, auth_headers: dict, test_user
    ):
        """POST /api/v1/shopping-lists/generate with a populated meal plan returns a shopping list with items."""
        week_start = "2025-06-02"

        recipe1_id = await self._create_recipe_with_ingredients(
            client,
            auth_headers,
            "Garlic Pasta",
            [
                {"name": "garlic", "amount": "3", "unit": "cloves"},
                {"name": "pasta", "amount": "200", "unit": "g"},
                {"name": "olive oil", "amount": "2", "unit": "tbsp"},
            ],
        )
        recipe2_id = await self._create_recipe_with_ingredients(
            client,
            auth_headers,
            "Garlic Bread",
            [
                {"name": "garlic", "amount": "2", "unit": "cloves"},
                {"name": "bread", "amount": "1", "unit": "loaf"},
                {"name": "butter", "amount": "3", "unit": "tbsp"},
            ],
        )

        await self._setup_meal_plan_with_recipes(
            client, auth_headers, week_start, [recipe1_id, recipe2_id]
        )

        with patch("app.api.shopping_lists.settings") as mock_settings:
            mock_settings.llm_model = "test"
            mock_settings.llm_temperature = 0.7
            mock_settings.llm_max_tokens = 2000
            mock_settings.llm_timeout = 30

            response = await client.post(
                "/api/v1/shopping-lists/generate",
                headers=auth_headers,
                json={"week_start_date": week_start},
            )

        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert "items" in data
        assert len(data["items"]) > 0

    @pytest.mark.asyncio
    async def test_generate_consolidates_duplicate_ingredients(
        self, client: AsyncClient, auth_headers: dict, test_user
    ):
        """Generate should consolidate duplicate ingredients across recipes (e.g., garlic from 2 recipes becomes 1 item)."""
        week_start = "2025-06-09"

        recipe1_id = await self._create_recipe_with_ingredients(
            client,
            auth_headers,
            "Recipe A",
            [
                {"name": "garlic", "amount": "3", "unit": "cloves"},
                {"name": "onion", "amount": "1", "unit": "whole"},
            ],
        )
        recipe2_id = await self._create_recipe_with_ingredients(
            client,
            auth_headers,
            "Recipe B",
            [
                {"name": "garlic", "amount": "2", "unit": "cloves"},
                {"name": "tomato", "amount": "2", "unit": "whole"},
            ],
        )

        await self._setup_meal_plan_with_recipes(
            client, auth_headers, week_start, [recipe1_id, recipe2_id]
        )

        with patch("app.api.shopping_lists.settings") as mock_settings:
            mock_settings.llm_model = "test"
            mock_settings.llm_temperature = 0.7
            mock_settings.llm_max_tokens = 2000
            mock_settings.llm_timeout = 30

            response = await client.post(
                "/api/v1/shopping-lists/generate",
                headers=auth_headers,
                json={"week_start_date": week_start},
            )

        assert response.status_code == 201
        data = response.json()
        item_names = [item["name"].lower() for item in data["items"]]
        # Garlic should appear only once (consolidated)
        garlic_count = sum(1 for name in item_names if "garlic" in name)
        assert (
            garlic_count == 1
        ), f"Expected 1 garlic item (consolidated), got {garlic_count}"

    @pytest.mark.asyncio
    async def test_generate_categorizes_items(
        self, client: AsyncClient, auth_headers: dict, test_user
    ):
        """Each generated item should have a category."""
        week_start = "2025-06-16"

        recipe_id = await self._create_recipe_with_ingredients(
            client,
            auth_headers,
            "Simple Salad",
            [
                {"name": "lettuce", "amount": "1", "unit": "head"},
                {"name": "tomato", "amount": "2", "unit": "whole"},
            ],
        )

        await self._setup_meal_plan_with_recipes(
            client, auth_headers, week_start, [recipe_id]
        )

        with patch("app.api.shopping_lists.settings") as mock_settings:
            mock_settings.llm_model = "test"
            mock_settings.llm_temperature = 0.7
            mock_settings.llm_max_tokens = 2000
            mock_settings.llm_timeout = 30

            response = await client.post(
                "/api/v1/shopping-lists/generate",
                headers=auth_headers,
                json={"week_start_date": week_start},
            )

        assert response.status_code == 201
        data = response.json()
        for item in data["items"]:
            assert "category" in item
            assert item["category"] is not None
            assert len(item["category"]) > 0

    @pytest.mark.asyncio
    async def test_generate_empty_meal_plan_returns_400(
        self, client: AsyncClient, auth_headers: dict, test_user
    ):
        """Generate with a meal plan that has no recipes should return 400 with helpful message."""
        week_start = "2025-06-23"

        # Auto-create an empty meal plan
        await client.get(
            "/api/v1/meal-plans",
            headers=auth_headers,
            params={"week_start": week_start},
        )

        response = await client.post(
            "/api/v1/shopping-lists/generate",
            headers=auth_headers,
            json={"week_start_date": week_start},
        )

        assert response.status_code == 400
        data = response.json()
        assert "detail" in data

    @pytest.mark.asyncio
    async def test_generate_recipes_with_no_ingredients_handles_gracefully(
        self, client: AsyncClient, auth_headers: dict, test_user, test_db
    ):
        """Generate with a meal plan whose entries have no usable ingredients should handle gracefully."""
        week_start = "2025-06-30"

        # Create a meal plan and add an entry with null recipe_id (simulating deleted recipe)
        plan_resp = await client.get(
            "/api/v1/meal-plans",
            headers=auth_headers,
            params={"week_start": week_start},
        )
        assert plan_resp.status_code == 200
        plan_id = plan_resp.json()["id"]

        # Insert entry with null recipe_id directly in DB
        from app.models.meal_plan import MealPlanEntry

        entry = MealPlanEntry(
            meal_plan_id=plan_id,
            day_of_week=0,
            meal_type="breakfast",
            recipe_id=None,
        )
        test_db.add(entry)
        await test_db.commit()

        response = await client.post(
            "/api/v1/shopping-lists/generate",
            headers=auth_headers,
            json={"week_start_date": week_start},
        )

        # Should either return 400 (no ingredients to generate from) or 201 with empty items
        assert response.status_code in [201, 400]

    @pytest.mark.asyncio
    async def test_generate_llm_malformed_json_falls_back_to_raw_ingredients(
        self, client: AsyncClient, auth_headers: dict, test_user
    ):
        """When LLM returns malformed JSON, fallback to raw ingredients with category 'Other'."""
        week_start = "2025-07-07"

        recipe_id = await self._create_recipe_with_ingredients(
            client,
            auth_headers,
            "Fallback Recipe",
            [
                {"name": "chicken", "amount": "500", "unit": "g"},
                {"name": "rice", "amount": "2", "unit": "cups"},
            ],
        )

        await self._setup_meal_plan_with_recipes(
            client, auth_headers, week_start, [recipe_id]
        )

        with patch("app.api.shopping_lists.LLMClient") as MockLLMClient:
            mock_instance = AsyncMock()
            mock_instance.complete.return_value = "not valid json {{{broken"
            MockLLMClient.return_value = mock_instance

            response = await client.post(
                "/api/v1/shopping-lists/generate",
                headers=auth_headers,
                json={"week_start_date": week_start},
            )

        assert response.status_code == 201
        data = response.json()
        assert len(data["items"]) >= 2
        # Fallback items should have category "Other"
        for item in data["items"]:
            assert item["category"] == "Other"

    @pytest.mark.asyncio
    async def test_generate_llm_timeout_falls_back_to_raw_ingredients(
        self, client: AsyncClient, auth_headers: dict, test_user
    ):
        """When LLM times out, fallback to raw ingredients with category 'Other'."""
        week_start = "2025-07-14"

        recipe_id = await self._create_recipe_with_ingredients(
            client,
            auth_headers,
            "Timeout Recipe",
            [
                {"name": "salmon", "amount": "2", "unit": "fillets"},
                {"name": "lemon", "amount": "1", "unit": "whole"},
            ],
        )

        await self._setup_meal_plan_with_recipes(
            client, auth_headers, week_start, [recipe_id]
        )

        with patch("app.api.shopping_lists.LLMClient") as MockLLMClient:
            mock_instance = AsyncMock()
            mock_instance.complete.side_effect = LLMTimeoutError("Request timed out")
            MockLLMClient.return_value = mock_instance

            response = await client.post(
                "/api/v1/shopping-lists/generate",
                headers=auth_headers,
                json={"week_start_date": week_start},
            )

        assert response.status_code == 201
        data = response.json()
        assert len(data["items"]) >= 2
        for item in data["items"]:
            assert item["category"] == "Other"

    @pytest.mark.asyncio
    async def test_generate_unauthenticated(self, client: AsyncClient):
        """POST /api/v1/shopping-lists/generate without auth should return 401."""
        response = await client.post(
            "/api/v1/shopping-lists/generate",
            json={"week_start_date": "2025-06-02"},
        )

        assert response.status_code == 401
