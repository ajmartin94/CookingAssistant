"""
Integration Tests for Chat API Endpoint

Tests for POST /api/v1/chat including LLM integration, user context,
error handling, and configuration.

Test coverage (9 tests per revised plan):
1. POST /api/v1/chat returns 200 with message
2. POST /api/v1/chat includes proposed_recipe when AI suggests recipe
3. Chat endpoint constructs LLMClient with settings from config (model, temperature, timeout)
4. User preferences are included in prompt context
5. LLM timeout returns 503
6. Test provider returns deterministic response for creation prompts
7. POST /api/v1/chat with recipe_id includes existing recipe in context
8. POST /api/v1/chat with non-existent recipe_id returns 404
9. POST /api/v1/chat with other user's recipe_id returns 403
"""

import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.ai.exceptions import LLMTimeoutError


class TestChatAPI:
    """Integration tests for chat API endpoint."""

    @pytest.mark.asyncio
    async def test_chat_returns_200_with_message(
        self, client: AsyncClient, auth_headers: dict, test_user: User
    ):
        """POST /api/v1/chat with valid messages returns 200 with a message string."""
        response = await client.post(
            "/api/v1/chat",
            headers=auth_headers,
            json={
                "messages": [
                    {"role": "user", "content": "How do I store fresh herbs?"}
                ],
                "current_recipe": None,
                "recipe_id": None,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert isinstance(data["message"], str)
        assert len(data["message"]) > 0

    @pytest.mark.asyncio
    async def test_chat_includes_proposed_recipe_when_ai_suggests(
        self, client: AsyncClient, auth_headers: dict, test_user: User
    ):
        """POST /api/v1/chat returns proposed_recipe when LLM response contains a recipe."""
        response = await client.post(
            "/api/v1/chat",
            headers=auth_headers,
            json={
                "messages": [
                    {"role": "user", "content": "Create a recipe for chocolate cake"}
                ],
                "current_recipe": None,
                "recipe_id": None,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "proposed_recipe" in data
        assert data["proposed_recipe"] is not None
        assert "title" in data["proposed_recipe"]
        assert "ingredients" in data["proposed_recipe"]
        assert "instructions" in data["proposed_recipe"]

    @pytest.mark.asyncio
    async def test_chat_constructs_llm_client_with_settings_from_config(
        self, client: AsyncClient, auth_headers: dict, test_user: User
    ):
        """Chat endpoint initializes LLMClient with model, temperature, timeout from settings."""
        with patch("app.api.chat.LLMClient") as MockLLMClient:
            mock_instance = AsyncMock()
            mock_instance.complete.return_value = "Looks great!"
            MockLLMClient.return_value = mock_instance

            with patch("app.api.chat.settings") as mock_settings:
                mock_settings.llm_model = "ollama/llama3.1:8b"
                mock_settings.llm_temperature = 0.7
                mock_settings.llm_max_tokens = 2000
                mock_settings.llm_timeout = 30

                await client.post(
                    "/api/v1/chat",
                    headers=auth_headers,
                    json={
                        "messages": [{"role": "user", "content": "Hello"}],
                        "current_recipe": None,
                        "recipe_id": None,
                    },
                )

                # LLMClient must be constructed with settings values
                MockLLMClient.assert_called_once_with(
                    model="ollama/llama3.1:8b",
                    temperature=0.7,
                    max_tokens=2000,
                    timeout=30,
                )

    @pytest.mark.asyncio
    async def test_user_preferences_are_included_in_prompt_context(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_user: User,
        test_db: AsyncSession,
    ):
        """User preferences (dietary_restrictions, skill_level) are passed to prompt builder."""
        # Setup: set user preferences
        test_user.dietary_restrictions = ["vegetarian", "gluten-free"]
        test_user.skill_level = "beginner"
        test_db.add(test_user)
        await test_db.commit()

        with patch("app.api.chat.build_system_prompt") as mock_build_prompt:
            mock_build_prompt.return_value = "You are a cooking assistant."

            await client.post(
                "/api/v1/chat",
                headers=auth_headers,
                json={
                    "messages": [{"role": "user", "content": "Suggest a dinner"}],
                    "current_recipe": None,
                    "recipe_id": None,
                },
            )

            # Verify prompt builder was called with preferences
            mock_build_prompt.assert_called_once()
            call_kwargs = mock_build_prompt.call_args
            preferences_arg = (
                call_kwargs[1].get("preferences")
                if call_kwargs[1]
                else call_kwargs[0][1]
            )
            assert preferences_arg is not None
            assert "vegetarian" in preferences_arg.get("dietary_tags", [])
            assert preferences_arg.get("skill_level") == "beginner"

    @pytest.mark.asyncio
    async def test_llm_timeout_returns_503(
        self, client: AsyncClient, auth_headers: dict, test_user: User
    ):
        """LLM timeout returns 503 with appropriate error message."""
        with patch("app.api.chat.LLMClient") as MockLLMClient:
            mock_instance = AsyncMock()
            mock_instance.complete.side_effect = LLMTimeoutError("Request timed out")
            MockLLMClient.return_value = mock_instance

            response = await client.post(
                "/api/v1/chat",
                headers=auth_headers,
                json={
                    "messages": [{"role": "user", "content": "Hello"}],
                    "current_recipe": None,
                    "recipe_id": None,
                },
            )

            assert response.status_code == 503
            data = response.json()
            assert "detail" in data
            assert (
                "timeout" in data["detail"].lower()
                or "unavailable" in data["detail"].lower()
            )

    @pytest.mark.asyncio
    async def test_test_provider_returns_deterministic_response_for_creation_prompts(
        self, client: AsyncClient, auth_headers: dict, test_user: User
    ):
        """Test provider returns deterministic recipe response for creation prompts."""
        # Mock settings to use test provider (model="test")
        with patch("app.api.chat.settings") as mock_settings:
            mock_settings.llm_model = "test"
            mock_settings.llm_temperature = 0.7
            mock_settings.llm_max_tokens = 2000
            mock_settings.llm_timeout = 30

            # First request with creation keyword
            response1 = await client.post(
                "/api/v1/chat",
                headers=auth_headers,
                json={
                    "messages": [
                        {
                            "role": "user",
                            "content": "Create a recipe for chocolate cake",
                        }
                    ],
                    "current_recipe": None,
                    "recipe_id": None,
                },
            )

            # Second identical request
            response2 = await client.post(
                "/api/v1/chat",
                headers=auth_headers,
                json={
                    "messages": [
                        {
                            "role": "user",
                            "content": "Create a recipe for chocolate cake",
                        }
                    ],
                    "current_recipe": None,
                    "recipe_id": None,
                },
            )

        assert response1.status_code == 200
        assert response2.status_code == 200

        data1 = response1.json()
        data2 = response2.json()

        # Both should have proposed recipes with same title (deterministic)
        assert data1["proposed_recipe"] is not None
        assert data2["proposed_recipe"] is not None
        assert data1["proposed_recipe"]["title"] == data2["proposed_recipe"]["title"]
        # Verify the known test response (Classic Chocolate Cake from test_provider.py)
        assert data1["proposed_recipe"]["title"] == "Classic Chocolate Cake"


class TestChatAPIWithRecipeId:
    """Feature 4: Tests for chat endpoint with recipe_id parameter."""

    @pytest.mark.asyncio
    async def test_chat_with_recipe_id_includes_existing_recipe_in_context(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_user: User,
        test_db: AsyncSession,
    ):
        """POST /api/v1/chat with recipe_id includes existing recipe in context."""
        from app.models.recipe import Recipe
        import uuid

        # Create a recipe for the user
        recipe = Recipe(
            id=str(uuid.uuid4()),
            title="Original Test Recipe",
            description="A test recipe",
            owner_id=test_user.id,
            ingredients=[{"name": "flour", "amount": "2", "unit": "cups"}],
            instructions=[{"step_number": 1, "instruction": "Mix ingredients"}],
        )
        test_db.add(recipe)
        await test_db.commit()

        with patch("app.api.chat.build_system_prompt") as mock_build_prompt:
            mock_build_prompt.return_value = "You are a cooking assistant."

            await client.post(
                "/api/v1/chat",
                headers=auth_headers,
                json={
                    "messages": [{"role": "user", "content": "Make it spicier"}],
                    "current_recipe": None,
                    "recipe_id": recipe.id,
                },
            )

            # Verify prompt builder was called with the recipe state
            mock_build_prompt.assert_called_once()
            call_kwargs = mock_build_prompt.call_args
            recipe_state = (
                call_kwargs[1].get("recipe_state")
                if call_kwargs[1]
                else call_kwargs[0][0]
            )
            assert recipe_state is not None
            assert recipe_state.get("title") == "Original Test Recipe"

    @pytest.mark.asyncio
    async def test_chat_with_nonexistent_recipe_id_returns_404(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_user: User,
    ):
        """POST /api/v1/chat with non-existent recipe_id returns 404."""
        import uuid

        fake_recipe_id = str(uuid.uuid4())

        response = await client.post(
            "/api/v1/chat",
            headers=auth_headers,
            json={
                "messages": [{"role": "user", "content": "Make it spicier"}],
                "current_recipe": None,
                "recipe_id": fake_recipe_id,
            },
        )

        assert response.status_code == 404
        data = response.json()
        assert "detail" in data

    @pytest.mark.asyncio
    async def test_chat_with_other_users_recipe_id_returns_403(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_user: User,
        test_user2: User,
        test_db: AsyncSession,
    ):
        """POST /api/v1/chat with other user's recipe_id returns 403."""
        from app.models.recipe import Recipe
        import uuid

        # Create a recipe owned by test_user2
        other_users_recipe = Recipe(
            id=str(uuid.uuid4()),
            title="Other User's Recipe",
            description="Not yours",
            owner_id=test_user2.id,
            ingredients=[{"name": "secret", "amount": "1", "unit": "tbsp"}],
            instructions=[{"step_number": 1, "instruction": "Secret step"}],
        )
        test_db.add(other_users_recipe)
        await test_db.commit()

        # Try to access with test_user's auth
        response = await client.post(
            "/api/v1/chat",
            headers=auth_headers,  # test_user's headers
            json={
                "messages": [{"role": "user", "content": "Make it mine"}],
                "current_recipe": None,
                "recipe_id": other_users_recipe.id,
            },
        )

        assert response.status_code == 403
        data = response.json()
        assert "detail" in data
