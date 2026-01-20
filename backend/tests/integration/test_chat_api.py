"""
Integration Tests for Chat API

Tests for AI chat endpoints covering:
- POST /api/v1/chat (send message, receive response)
- POST /api/v1/chat/confirm (approve/reject tool calls)
- Context injection (page, recipe_id)
- Tool call response structure
- Authentication and error handling
"""

import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, MagicMock

from app.main import app
from app.services.llm.service import get_llm_service, LLMService, LLMServiceError


# =============================================================================
# Fixtures for mocking LLM service
# =============================================================================


def create_mock_llm_response(
    content: str = "I'd be happy to help you with that recipe!", tool_calls=None
):
    """Create a mock LLM response."""
    mock_response = MagicMock()
    mock_response.choices = [
        MagicMock(
            message=MagicMock(
                content=content,
                tool_calls=tool_calls,
            )
        )
    ]
    return mock_response


def create_mock_tool_call(tool_id: str, tool_name: str, arguments: str):
    """Create a mock tool call."""
    mock_function = MagicMock()
    mock_function.name = tool_name  # Must set as attribute, not constructor arg
    mock_function.arguments = arguments

    mock_tool_call = MagicMock()
    mock_tool_call.id = tool_id
    mock_tool_call.function = mock_function
    return mock_tool_call


@pytest.fixture
def mock_llm_service():
    """Create a mock LLM service that returns a simple response."""
    mock_service = MagicMock(spec=LLMService)
    mock_response = create_mock_llm_response()

    # Make chat return an awaitable that returns the mock response
    async def mock_chat(*args, **kwargs):
        return mock_response

    mock_service.chat = MagicMock(return_value=AsyncMock(return_value=mock_response)())
    return mock_service


@pytest.fixture
def mock_llm_service_with_tool_call():
    """Create a mock LLM service that returns a tool call."""
    mock_service = MagicMock(spec=LLMService)
    tool_call = create_mock_tool_call(
        "call_123",
        "create_recipe",
        '{"title": "Test Pasta", "ingredients": [{"name": "pasta", "amount": "200", "unit": "g"}], "instructions": [{"step_number": 1, "instruction": "Boil water"}]}',
    )
    mock_response = create_mock_llm_response(content=None, tool_calls=[tool_call])
    mock_service.chat = MagicMock(return_value=AsyncMock(return_value=mock_response)())
    return mock_service


@pytest.fixture
def mock_llm_service_with_read_only_tool():
    """Create a mock LLM service that returns a read-only tool call."""
    mock_service = MagicMock(spec=LLMService)
    tool_call = create_mock_tool_call(
        "call_456",
        "suggest_substitutions",
        '{"recipe_id": "test-id", "dietary_requirement": "dairy-free"}',
    )
    mock_response = create_mock_llm_response(content=None, tool_calls=[tool_call])
    mock_service.chat = MagicMock(return_value=AsyncMock(return_value=mock_response)())
    return mock_service


@pytest.fixture
def mock_llm_service_error():
    """Create a mock LLM service that raises an error."""
    mock_service = MagicMock(spec=LLMService)
    mock_service.chat = MagicMock(
        side_effect=LLMServiceError("LLM provider unavailable")
    )
    return mock_service


# =============================================================================
# POST /api/v1/chat - Send Message Tests
# =============================================================================


@pytest.mark.asyncio
async def test_chat_send_message_authenticated(
    client: AsyncClient, auth_headers, test_user, mock_llm_service
):
    """Test sending a chat message when authenticated."""
    app.dependency_overrides[get_llm_service] = lambda: mock_llm_service
    try:
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
        assert data["response"] == "I'd be happy to help you with that recipe!"
    finally:
        app.dependency_overrides.pop(get_llm_service, None)


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

    # Pydantic min_length=1 returns 422 for empty string
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_chat_send_message_whitespace_only(
    client: AsyncClient, auth_headers, mock_llm_service
):
    """Test sending a whitespace-only chat message."""
    app.dependency_overrides[get_llm_service] = lambda: mock_llm_service
    try:
        response = await client.post(
            "/api/v1/chat",
            headers=auth_headers,
            json={
                "message": "   ",
            },
        )

        # Whitespace-only should return 400 (validated in endpoint)
        assert response.status_code == 400
    finally:
        app.dependency_overrides.pop(get_llm_service, None)


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
async def test_chat_with_recipe_context(
    client: AsyncClient, auth_headers, test_recipe, mock_llm_service
):
    """Test sending a chat message with recipe context."""
    app.dependency_overrides[get_llm_service] = lambda: mock_llm_service
    try:
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
    finally:
        app.dependency_overrides.pop(get_llm_service, None)


@pytest.mark.asyncio
async def test_chat_with_recipe_list_context(
    client: AsyncClient, auth_headers, mock_llm_service
):
    """Test sending a chat message with recipe list context."""
    app.dependency_overrides[get_llm_service] = lambda: mock_llm_service
    try:
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
    finally:
        app.dependency_overrides.pop(get_llm_service, None)


@pytest.mark.asyncio
async def test_chat_with_create_page_context(
    client: AsyncClient, auth_headers, mock_llm_service
):
    """Test sending a chat message from recipe create page."""
    app.dependency_overrides[get_llm_service] = lambda: mock_llm_service
    try:
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
    finally:
        app.dependency_overrides.pop(get_llm_service, None)


@pytest.mark.asyncio
async def test_chat_context_with_invalid_recipe_id(
    client: AsyncClient, auth_headers, mock_llm_service
):
    """Test sending a chat message with non-existent recipe ID."""
    app.dependency_overrides[get_llm_service] = lambda: mock_llm_service
    try:
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

        # Should still work - context is informational, not validated
        assert response.status_code == 200
    finally:
        app.dependency_overrides.pop(get_llm_service, None)


# =============================================================================
# Tool Call Response Structure Tests
# =============================================================================


@pytest.mark.asyncio
async def test_chat_response_with_tool_call(
    client: AsyncClient, auth_headers, test_user, mock_llm_service_with_tool_call
):
    """Test that tool calls are returned with pending_confirmation status."""
    app.dependency_overrides[get_llm_service] = lambda: mock_llm_service_with_tool_call
    try:
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
        assert tool_call["id"] == "call_123"
        assert "name" in tool_call
        assert tool_call["name"] == "create_recipe"
        assert "arguments" in tool_call
        assert "status" in tool_call
        assert tool_call["status"] == "pending_confirmation"
    finally:
        app.dependency_overrides.pop(get_llm_service, None)


@pytest.mark.asyncio
async def test_chat_response_with_read_only_tool(
    client: AsyncClient, auth_headers, test_recipe, mock_llm_service_with_read_only_tool
):
    """Test that read-only tools are auto-approved."""
    app.dependency_overrides[get_llm_service] = (
        lambda: mock_llm_service_with_read_only_tool
    )
    try:
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
        assert "tool_calls" in data
        assert len(data["tool_calls"]) > 0
        tool_call = data["tool_calls"][0]
        assert tool_call["name"] == "suggest_substitutions"
        assert tool_call["status"] == "approved"
    finally:
        app.dependency_overrides.pop(get_llm_service, None)


# =============================================================================
# POST /api/v1/chat/confirm - Tool Confirmation Tests
# =============================================================================


@pytest.mark.asyncio
async def test_chat_confirm_approve_tool_call(
    client: AsyncClient, auth_headers, test_user, mock_llm_service_with_tool_call
):
    """Test approving a pending tool call."""
    app.dependency_overrides[get_llm_service] = lambda: mock_llm_service_with_tool_call
    try:
        # First, create a tool call via chat
        chat_response = await client.post(
            "/api/v1/chat",
            headers=auth_headers,
            json={"message": "Create a pasta recipe"},
        )
        assert chat_response.status_code == 200
        tool_call_id = chat_response.json()["tool_calls"][0]["id"]

        # Now approve it
        response = await client.post(
            "/api/v1/chat/confirm",
            headers=auth_headers,
            json={
                "tool_call_id": tool_call_id,
                "approved": True,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] == "approved"
    finally:
        app.dependency_overrides.pop(get_llm_service, None)


@pytest.mark.asyncio
async def test_chat_confirm_reject_tool_call(
    client: AsyncClient, auth_headers, test_user, mock_llm_service_with_tool_call
):
    """Test rejecting a pending tool call."""
    app.dependency_overrides[get_llm_service] = lambda: mock_llm_service_with_tool_call
    try:
        # First, create a tool call via chat
        chat_response = await client.post(
            "/api/v1/chat",
            headers=auth_headers,
            json={"message": "Create a pasta recipe"},
        )
        assert chat_response.status_code == 200
        tool_call_id = chat_response.json()["tool_calls"][0]["id"]

        # Now reject it
        response = await client.post(
            "/api/v1/chat/confirm",
            headers=auth_headers,
            json={
                "tool_call_id": tool_call_id,
                "approved": False,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] == "rejected"
    finally:
        app.dependency_overrides.pop(get_llm_service, None)


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
async def test_chat_llm_service_unavailable(
    client: AsyncClient, auth_headers, mock_llm_service_error
):
    """Test handling when LLM service is unavailable."""
    app.dependency_overrides[get_llm_service] = lambda: mock_llm_service_error
    try:
        response = await client.post(
            "/api/v1/chat",
            headers=auth_headers,
            json={
                "message": "Hello",
            },
        )

        assert response.status_code == 503
    finally:
        app.dependency_overrides.pop(get_llm_service, None)


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
async def test_chat_with_conversation_history(
    client: AsyncClient, auth_headers, mock_llm_service
):
    """Test sending a chat message with conversation history."""
    app.dependency_overrides[get_llm_service] = lambda: mock_llm_service
    try:
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
    finally:
        app.dependency_overrides.pop(get_llm_service, None)


# =============================================================================
# Streaming Response Tests
# =============================================================================


@pytest.mark.asyncio
async def test_chat_stream_parameter_accepted(
    client: AsyncClient, auth_headers, mock_llm_service
):
    """Test that stream parameter is accepted (streaming not fully implemented yet)."""
    app.dependency_overrides[get_llm_service] = lambda: mock_llm_service
    try:
        response = await client.post(
            "/api/v1/chat",
            headers=auth_headers,
            json={
                "message": "Tell me about cooking",
                "stream": True,
            },
        )

        # For now, stream=True still returns a regular response
        # Full streaming will be implemented later
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
    finally:
        app.dependency_overrides.pop(get_llm_service, None)
