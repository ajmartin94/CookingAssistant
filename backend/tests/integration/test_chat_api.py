"""
Integration Tests for Chat API Endpoint

Tests for POST /api/v1/chat including authentication, validation,
LLM integration, user context handling, and error scenarios.
"""

import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.recipe import Recipe
from app.ai.exceptions import LLMTimeoutError, LLMAuthError


# --- Happy Path Tests ---


@pytest.mark.asyncio
async def test_chat_valid_request_returns_200_with_message(
    client: AsyncClient, auth_headers: dict, test_user: User
):
    """POST /api/v1/chat with valid messages returns 200 with a message string."""
    response = await client.post(
        "/api/v1/chat",
        headers=auth_headers,
        json={
            "messages": [{"role": "user", "content": "How do I store fresh herbs?"}],
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
async def test_chat_includes_proposed_recipe_when_llm_suggests(
    client: AsyncClient, auth_headers: dict, test_user: User
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


# --- Authentication Tests ---


@pytest.mark.asyncio
async def test_chat_unauthenticated_returns_401(client: AsyncClient):
    """POST /api/v1/chat without auth headers returns 401."""
    response = await client.post(
        "/api/v1/chat",
        json={
            "messages": [{"role": "user", "content": "Hello"}],
            "current_recipe": None,
            "recipe_id": None,
        },
    )

    assert response.status_code == 401


# --- Validation Tests ---


@pytest.mark.asyncio
async def test_chat_empty_messages_returns_422(
    client: AsyncClient, auth_headers: dict, test_user: User
):
    """POST /api/v1/chat with empty messages array returns 422."""
    response = await client.post(
        "/api/v1/chat",
        headers=auth_headers,
        json={
            "messages": [],
            "current_recipe": None,
            "recipe_id": None,
        },
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_chat_messages_exceeding_max_count_returns_422(
    client: AsyncClient, auth_headers: dict, test_user: User
):
    """POST /api/v1/chat with more than 50 messages returns 422."""
    messages = [{"role": "user", "content": f"Message {i}"} for i in range(51)]

    response = await client.post(
        "/api/v1/chat",
        headers=auth_headers,
        json={
            "messages": messages,
            "current_recipe": None,
            "recipe_id": None,
        },
    )

    assert response.status_code == 422


# --- Recipe ID Tests ---


@pytest.mark.asyncio
async def test_chat_nonexistent_recipe_id_returns_404(
    client: AsyncClient, auth_headers: dict, test_user: User
):
    """POST /api/v1/chat with recipe_id for non-existent recipe returns 404."""
    response = await client.post(
        "/api/v1/chat",
        headers=auth_headers,
        json={
            "messages": [{"role": "user", "content": "Modify this recipe"}],
            "current_recipe": None,
            "recipe_id": "nonexistent-recipe-id-12345",
        },
    )

    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
    assert "recipe" in data["detail"].lower()


@pytest.mark.asyncio
async def test_chat_recipe_id_ownership_returns_403(
    client: AsyncClient,
    auth_headers_user2: dict,
    test_user2: User,
    test_recipe: Recipe,
):
    """POST /api/v1/chat with recipe_id owned by another user returns 403."""
    response = await client.post(
        "/api/v1/chat",
        headers=auth_headers_user2,
        json={
            "messages": [{"role": "user", "content": "Modify this recipe"}],
            "current_recipe": None,
            "recipe_id": test_recipe.id,
        },
    )

    assert response.status_code == 403


# --- User Preferences Context Tests ---


@pytest.mark.asyncio
async def test_chat_passes_user_preferences_to_prompt_builder(
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

        _response = await client.post(
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
            call_kwargs[1].get("preferences") if call_kwargs[1] else call_kwargs[0][1]
        )
        assert preferences_arg is not None
        assert "vegetarian" in preferences_arg.get("dietary_tags", [])
        assert preferences_arg.get("skill_level") == "beginner"


@pytest.mark.asyncio
async def test_chat_no_preferences_builds_context_without_preferences(
    client: AsyncClient,
    auth_headers: dict,
    test_user: User,
    test_db: AsyncSession,
):
    """User with no preferences: context built without preferences section."""
    # Ensure user has no preferences set
    test_user.dietary_restrictions = None
    test_user.skill_level = None
    test_db.add(test_user)
    await test_db.commit()

    with patch("app.api.chat.build_system_prompt") as mock_build_prompt:
        mock_build_prompt.return_value = "You are a cooking assistant."

        _response = await client.post(
            "/api/v1/chat",
            headers=auth_headers,
            json={
                "messages": [{"role": "user", "content": "Hello"}],
                "current_recipe": None,
                "recipe_id": None,
            },
        )

        mock_build_prompt.assert_called_once()
        call_kwargs = mock_build_prompt.call_args
        preferences_arg = (
            call_kwargs[1].get("preferences") if call_kwargs[1] else call_kwargs[0][1]
        )
        assert preferences_arg is None or not any(
            v for v in (preferences_arg or {}).values()
        )


@pytest.mark.asyncio
async def test_chat_no_recipes_builds_context_without_library(
    client: AsyncClient,
    auth_headers: dict,
    test_user: User,
):
    """User with no recipes: context built without library section."""
    with patch("app.api.chat.build_system_prompt") as mock_build_prompt:
        mock_build_prompt.return_value = "You are a cooking assistant."

        _response = await client.post(
            "/api/v1/chat",
            headers=auth_headers,
            json={
                "messages": [{"role": "user", "content": "Hello"}],
                "current_recipe": None,
                "recipe_id": None,
            },
        )

        mock_build_prompt.assert_called_once()
        call_kwargs = mock_build_prompt.call_args
        library_arg = (
            call_kwargs[1].get("library_summary")
            if call_kwargs[1]
            else call_kwargs[0][2]
        )
        assert library_arg is None or len(library_arg) == 0


@pytest.mark.asyncio
async def test_chat_library_summary_includes_up_to_20_recipes(
    client: AsyncClient,
    auth_headers: dict,
    test_user: User,
    test_db: AsyncSession,
):
    """Library summary passed to prompt builder includes at most 20 recent recipes."""
    from tests.utils.helpers import create_test_recipe

    # Create 25 recipes for the user
    for i in range(25):
        await create_test_recipe(test_db, test_user, f"Recipe {i}")

    with patch("app.api.chat.build_system_prompt") as mock_build_prompt:
        mock_build_prompt.return_value = "You are a cooking assistant."

        _response = await client.post(
            "/api/v1/chat",
            headers=auth_headers,
            json={
                "messages": [{"role": "user", "content": "What should I cook?"}],
                "current_recipe": None,
                "recipe_id": None,
            },
        )

        mock_build_prompt.assert_called_once()
        call_kwargs = mock_build_prompt.call_args
        library_arg = (
            call_kwargs[1].get("library_summary")
            if call_kwargs[1]
            else call_kwargs[0][2]
        )
        assert library_arg is not None
        assert len(library_arg) <= 20


# --- LLM Error Handling Tests ---


@pytest.mark.asyncio
async def test_chat_llm_timeout_returns_503(
    client: AsyncClient, auth_headers: dict, test_user: User
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
async def test_chat_llm_auth_error_returns_503(
    client: AsyncClient, auth_headers: dict, test_user: User
):
    """LLM auth error returns 503 (service unavailable, not user's fault)."""
    with patch("app.api.chat.LLMClient") as MockLLMClient:
        mock_instance = AsyncMock()
        mock_instance.complete.side_effect = LLMAuthError("Invalid API key")
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


@pytest.mark.asyncio
async def test_chat_malformed_llm_response_retries_then_returns_200(
    client: AsyncClient, auth_headers: dict, test_user: User
):
    """Malformed LLM response triggers retry, then returns error message in 200 response."""
    malformed_response = "Here's a recipe: ```json {invalid json``` oops"

    with patch("app.api.chat.LLMClient") as MockLLMClient:
        mock_instance = AsyncMock()
        # Return malformed response on all attempts (retry exhausted)
        mock_instance.complete.return_value = malformed_response
        MockLLMClient.return_value = mock_instance

        response = await client.post(
            "/api/v1/chat",
            headers=auth_headers,
            json={
                "messages": [{"role": "user", "content": "Create a recipe for pasta"}],
                "current_recipe": None,
                "recipe_id": None,
            },
        )

        # Should still return 200 with the message text (graceful degradation)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert isinstance(data["message"], str)
        assert len(data["message"]) > 0
