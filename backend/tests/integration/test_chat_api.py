"""
Integration Tests for Chat API

TDD tests for AI chat endpoints. These tests are written before implementation
and should fail initially (red phase).

Tests cover:
- POST /api/v1/chat (send message, receive response)
- POST /api/v1/chat/confirm (approve/reject tool calls)
- Context injection (page, recipe_id)
- Tool call response structure
- Authentication and error handling
"""

import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, MagicMock, patch


# =============================================================================
# POST /api/v1/chat - Send Message Tests
# =============================================================================


@pytest.mark.asyncio
async def test_chat_send_message_authenticated(
    client: AsyncClient, auth_headers, test_user
):
    """Test sending a chat message when authenticated."""
    response = await client.post(
        "/api/v1/chat",
        headers=auth_headers,
        json={
            "message": "Hello, can you help me create a recipe?",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert "tool_calls" in data
    assert isinstance(data["tool_calls"], list)


@pytest.mark.asyncio
async def test_chat_send_message_unauthenticated(client: AsyncClient):
    """Test sending a chat message without authentication."""
    response = await client.post(
        "/api/v1/chat",
        json={
            "message": "Hello",
        },
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_chat_send_message_empty_message(client: AsyncClient, auth_headers):
    """Test sending an empty chat message."""
    response = await client.post(
        "/api/v1/chat",
        headers=auth_headers,
        json={
            "message": "",
        },
    )

    assert response.status_code == 400


@pytest.mark.asyncio
async def test_chat_send_message_missing_message(client: AsyncClient, auth_headers):
    """Test sending a request without message field."""
    response = await client.post(
        "/api/v1/chat",
        headers=auth_headers,
        json={},
    )

    assert response.status_code == 422  # Pydantic validation error


# =============================================================================
# Context Injection Tests
# =============================================================================


@pytest.mark.asyncio
async def test_chat_with_recipe_context(client: AsyncClient, auth_headers, test_recipe):
    """Test sending a chat message with recipe context."""
    response = await client.post(
        "/api/v1/chat",
        headers=auth_headers,
        json={
            "message": "Make this recipe dairy-free",
            "context": {
                "page": "recipe_detail",
                "recipe_id": test_recipe.id,
            },
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "response" in data


@pytest.mark.asyncio
async def test_chat_with_recipe_list_context(client: AsyncClient, auth_headers):
    """Test sending a chat message with recipe list context."""
    response = await client.post(
        "/api/v1/chat",
        headers=auth_headers,
        json={
            "message": "Find me a quick dinner recipe",
            "context": {
                "page": "recipe_list",
                "filters": {"cuisine_type": "Italian"},
            },
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "response" in data


@pytest.mark.asyncio
async def test_chat_with_create_page_context(client: AsyncClient, auth_headers):
    """Test sending a chat message from recipe create page."""
    response = await client.post(
        "/api/v1/chat",
        headers=auth_headers,
        json={
            "message": "Help me create a pasta recipe",
            "context": {
                "page": "recipe_create",
            },
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "response" in data


@pytest.mark.asyncio
async def test_chat_context_with_invalid_recipe_id(client: AsyncClient, auth_headers):
    """Test sending a chat message with non-existent recipe ID."""
    response = await client.post(
        "/api/v1/chat",
        headers=auth_headers,
        json={
            "message": "Edit this recipe",
            "context": {
                "page": "recipe_detail",
                "recipe_id": "non-existent-id",
            },
        },
    )

    # Should still work but context may indicate recipe not found
    assert response.status_code in [200, 404]


# =============================================================================
# Tool Call Response Structure Tests
# =============================================================================


@pytest.mark.asyncio
async def test_chat_response_with_tool_call(
    client: AsyncClient, auth_headers, test_user
):
    """Test that tool calls are returned with pending_confirmation status."""
    # This test mocks the LLM to return a tool call
    with patch("app.api.chat.get_llm_service") as mock_get_llm:
        mock_service = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [
            MagicMock(
                message=MagicMock(
                    content=None,
                    tool_calls=[
                        MagicMock(
                            id="call_123",
                            function=MagicMock(
                                name="create_recipe",
                                arguments='{"title": "Test Recipe", "ingredients": [], "instructions": []}',
                            ),
                        )
                    ],
                )
            )
        ]

        async def mock_chat(*args, **kwargs):
            return mock_response

        mock_service.chat = MagicMock(
            return_value=AsyncMock(return_value=mock_response)()
        )
        mock_get_llm.return_value = mock_service

        response = await client.post(
            "/api/v1/chat",
            headers=auth_headers,
            json={
                "message": "Create a simple pasta recipe",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "tool_calls" in data
        assert len(data["tool_calls"]) > 0

        tool_call = data["tool_calls"][0]
        assert "id" in tool_call
        assert "name" in tool_call
        assert "arguments" in tool_call
        assert "status" in tool_call
        assert tool_call["status"] == "pending_confirmation"


@pytest.mark.asyncio
async def test_chat_response_with_read_only_tool(
    client: AsyncClient, auth_headers, test_recipe
):
    """Test that read-only tools are auto-approved."""
    with patch("app.api.chat.get_llm_service") as mock_get_llm:
        mock_service = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [
            MagicMock(
                message=MagicMock(
                    content=None,
                    tool_calls=[
                        MagicMock(
                            id="call_456",
                            function=MagicMock(
                                name="suggest_substitutions",
                                arguments='{"recipe_id": "test", "substitutions": []}',
                            ),
                        )
                    ],
                )
            )
        ]

        mock_service.chat = MagicMock(
            return_value=AsyncMock(return_value=mock_response)()
        )
        mock_get_llm.return_value = mock_service

        response = await client.post(
            "/api/v1/chat",
            headers=auth_headers,
            json={
                "message": "Suggest dairy-free substitutions",
                "context": {
                    "page": "recipe_detail",
                    "recipe_id": test_recipe.id,
                },
            },
        )

        assert response.status_code == 200
        data = response.json()

        # suggest_substitutions is a read-only tool, should be auto-approved
        if data.get("tool_calls"):
            tool_call = data["tool_calls"][0]
            assert tool_call["status"] == "approved"


# =============================================================================
# POST /api/v1/chat/confirm - Tool Confirmation Tests
# =============================================================================


@pytest.mark.asyncio
async def test_chat_confirm_approve_tool_call(client: AsyncClient, auth_headers):
    """Test approving a pending tool call."""
    response = await client.post(
        "/api/v1/chat/confirm",
        headers=auth_headers,
        json={
            "tool_call_id": "call_123",
            "approved": True,
        },
    )

    # May return 200 or 404 depending on if tool call exists
    assert response.status_code in [200, 404]

    if response.status_code == 200:
        data = response.json()
        assert "result" in data or "status" in data


@pytest.mark.asyncio
async def test_chat_confirm_reject_tool_call(client: AsyncClient, auth_headers):
    """Test rejecting a pending tool call."""
    response = await client.post(
        "/api/v1/chat/confirm",
        headers=auth_headers,
        json={
            "tool_call_id": "call_123",
            "approved": False,
        },
    )

    assert response.status_code in [200, 404]

    if response.status_code == 200:
        data = response.json()
        assert "status" in data
        assert data["status"] == "rejected"


@pytest.mark.asyncio
async def test_chat_confirm_unauthenticated(client: AsyncClient):
    """Test confirming tool call without authentication."""
    response = await client.post(
        "/api/v1/chat/confirm",
        json={
            "tool_call_id": "call_123",
            "approved": True,
        },
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_chat_confirm_missing_tool_call_id(client: AsyncClient, auth_headers):
    """Test confirming without tool_call_id."""
    response = await client.post(
        "/api/v1/chat/confirm",
        headers=auth_headers,
        json={
            "approved": True,
        },
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_chat_confirm_invalid_tool_call_id(client: AsyncClient, auth_headers):
    """Test confirming with non-existent tool call ID."""
    response = await client.post(
        "/api/v1/chat/confirm",
        headers=auth_headers,
        json={
            "tool_call_id": "non_existent_id",
            "approved": True,
        },
    )

    assert response.status_code == 404


# =============================================================================
# Error Handling Tests
# =============================================================================


@pytest.mark.asyncio
async def test_chat_llm_service_unavailable(client: AsyncClient, auth_headers):
    """Test handling when LLM service is unavailable."""
    with patch("app.api.chat.get_llm_service") as mock_get_llm:
        from app.services.llm.service import LLMServiceError

        mock_service = MagicMock()
        mock_service.chat = MagicMock(
            side_effect=LLMServiceError("LLM provider unavailable")
        )
        mock_get_llm.return_value = mock_service

        response = await client.post(
            "/api/v1/chat",
            headers=auth_headers,
            json={
                "message": "Hello",
            },
        )

        # Should return 503 Service Unavailable or 500
        assert response.status_code in [500, 503]


@pytest.mark.asyncio
async def test_chat_invalid_json_body(client: AsyncClient, auth_headers):
    """Test handling invalid JSON in request body."""
    response = await client.post(
        "/api/v1/chat",
        content="not valid json",
        headers={**auth_headers, "Content-Type": "application/json"},
    )

    assert response.status_code == 422


# =============================================================================
# Conversation History Tests
# =============================================================================


@pytest.mark.asyncio
async def test_chat_with_conversation_history(client: AsyncClient, auth_headers):
    """Test sending a chat message with conversation history."""
    response = await client.post(
        "/api/v1/chat",
        headers=auth_headers,
        json={
            "message": "And add some garlic",
            "conversation_history": [
                {"role": "user", "content": "Create a pasta recipe"},
                {
                    "role": "assistant",
                    "content": "I'll help you create a pasta recipe. What ingredients would you like?",
                },
            ],
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "response" in data


# =============================================================================
# Streaming Response Tests (if supported)
# =============================================================================


@pytest.mark.asyncio
async def test_chat_stream_response(client: AsyncClient, auth_headers):
    """Test streaming chat response."""
    # Streaming endpoint might use SSE or a different path
    response = await client.post(
        "/api/v1/chat",
        headers=auth_headers,
        json={
            "message": "Tell me about cooking",
            "stream": True,
        },
    )

    # Depending on implementation, could be 200 with streaming or different behavior
    assert response.status_code in [200, 501]  # 501 if streaming not implemented yet
