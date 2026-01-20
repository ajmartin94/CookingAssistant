"""
Unit Tests for Tool Executor Framework

Tests for the tool executor that handles LLM tool calls, manages confirmation
state, and executes tools. This is TDD - tests written first before implementation.
"""

import pytest
from unittest.mock import AsyncMock


# Test: Parsing tool calls from LLM response


@pytest.mark.asyncio
async def test_parse_tool_calls_from_streaming_response():
    """Test parsing tool calls accumulated from streaming chunks"""
    from app.services.tools.executor import ToolExecutor

    executor = ToolExecutor()

    # Simulated accumulated tool call data from streaming
    tool_call_data = {
        "id": "call_123",
        "type": "function",
        "function": {
            "name": "create_recipe",
            "arguments": '{"title": "Pasta Carbonara", "ingredients": []}',
        },
    }

    tool_calls = executor.parse_tool_calls([tool_call_data])

    assert len(tool_calls) == 1
    assert tool_calls[0].id == "call_123"
    assert tool_calls[0].name == "create_recipe"
    assert tool_calls[0].arguments == {"title": "Pasta Carbonara", "ingredients": []}


@pytest.mark.asyncio
async def test_parse_multiple_tool_calls():
    """Test parsing multiple tool calls from a single response"""
    from app.services.tools.executor import ToolExecutor

    executor = ToolExecutor()

    tool_calls_data = [
        {
            "id": "call_1",
            "type": "function",
            "function": {
                "name": "create_recipe",
                "arguments": '{"title": "Recipe 1"}',
            },
        },
        {
            "id": "call_2",
            "type": "function",
            "function": {
                "name": "suggest_substitutions",
                "arguments": '{"recipe_id": "abc"}',
            },
        },
    ]

    tool_calls = executor.parse_tool_calls(tool_calls_data)

    assert len(tool_calls) == 2
    assert tool_calls[0].name == "create_recipe"
    assert tool_calls[1].name == "suggest_substitutions"


@pytest.mark.asyncio
async def test_parse_tool_call_with_complex_arguments():
    """Test parsing tool calls with nested JSON arguments"""
    from app.services.tools.executor import ToolExecutor

    executor = ToolExecutor()

    tool_call_data = {
        "id": "call_123",
        "type": "function",
        "function": {
            "name": "create_recipe",
            "arguments": """{
                "title": "Pasta",
                "ingredients": [
                    {"name": "pasta", "amount": "200", "unit": "g"},
                    {"name": "eggs", "amount": "2", "unit": "whole"}
                ],
                "instructions": [
                    {"step_number": 1, "instruction": "Boil water"}
                ]
            }""",
        },
    }

    tool_calls = executor.parse_tool_calls([tool_call_data])

    assert len(tool_calls) == 1
    assert tool_calls[0].arguments["title"] == "Pasta"
    assert len(tool_calls[0].arguments["ingredients"]) == 2
    assert tool_calls[0].arguments["ingredients"][0]["name"] == "pasta"


@pytest.mark.asyncio
async def test_parse_tool_call_invalid_json_arguments():
    """Test handling of malformed JSON in tool arguments"""
    from app.services.tools.executor import ToolExecutor, ToolExecutorError

    executor = ToolExecutor()

    tool_call_data = {
        "id": "call_123",
        "type": "function",
        "function": {
            "name": "create_recipe",
            "arguments": "{invalid json}",
        },
    }

    with pytest.raises(ToolExecutorError) as exc_info:
        executor.parse_tool_calls([tool_call_data])

    assert (
        "parse" in str(exc_info.value).lower() or "json" in str(exc_info.value).lower()
    )


# Test: Tool call state management


@pytest.mark.asyncio
async def test_tool_call_initial_state_pending():
    """Test that tool calls requiring confirmation start in pending state"""
    from app.services.tools.executor import ToolExecutor, ToolCallStatus

    executor = ToolExecutor()

    tool_call_data = {
        "id": "call_123",
        "type": "function",
        "function": {
            "name": "create_recipe",
            "arguments": '{"title": "Test"}',
        },
    }

    tool_calls = executor.parse_tool_calls([tool_call_data])

    assert tool_calls[0].status == ToolCallStatus.PENDING_CONFIRMATION


@pytest.mark.asyncio
async def test_read_only_tool_auto_approved():
    """Test that read-only tools are automatically approved"""
    from app.services.tools.executor import ToolExecutor, ToolCallStatus

    executor = ToolExecutor()

    tool_call_data = {
        "id": "call_123",
        "type": "function",
        "function": {
            "name": "suggest_substitutions",
            "arguments": '{"recipe_id": "abc"}',
        },
    }

    tool_calls = executor.parse_tool_calls([tool_call_data])

    assert tool_calls[0].status == ToolCallStatus.APPROVED


@pytest.mark.asyncio
async def test_approve_tool_call():
    """Test approving a pending tool call"""
    from app.services.tools.executor import ToolExecutor, ToolCallStatus

    executor = ToolExecutor()

    tool_call_data = {
        "id": "call_123",
        "type": "function",
        "function": {
            "name": "edit_recipe",
            "arguments": '{"recipe_id": "abc", "title": "New Title"}',
        },
    }

    tool_calls = executor.parse_tool_calls([tool_call_data])
    assert tool_calls[0].status == ToolCallStatus.PENDING_CONFIRMATION

    executor.approve_tool_call("call_123")

    assert tool_calls[0].status == ToolCallStatus.APPROVED


@pytest.mark.asyncio
async def test_reject_tool_call():
    """Test rejecting a pending tool call"""
    from app.services.tools.executor import ToolExecutor, ToolCallStatus

    executor = ToolExecutor()

    tool_call_data = {
        "id": "call_123",
        "type": "function",
        "function": {
            "name": "create_recipe",
            "arguments": '{"title": "Test"}',
        },
    }

    tool_calls = executor.parse_tool_calls([tool_call_data])
    executor.reject_tool_call("call_123")

    assert tool_calls[0].status == ToolCallStatus.REJECTED


@pytest.mark.asyncio
async def test_approve_nonexistent_tool_call_raises():
    """Test that approving a non-existent tool call raises error"""
    from app.services.tools.executor import ToolExecutor, ToolExecutorError

    executor = ToolExecutor()

    with pytest.raises(ToolExecutorError) as exc_info:
        executor.approve_tool_call("nonexistent_id")

    assert "not found" in str(exc_info.value).lower()


# Test: Confirmation gating


@pytest.mark.asyncio
async def test_execute_blocked_without_confirmation():
    """Test that tools requiring confirmation cannot execute without approval"""
    from app.services.tools.executor import ToolExecutor, ToolExecutorError

    executor = ToolExecutor()

    tool_call_data = {
        "id": "call_123",
        "type": "function",
        "function": {
            "name": "create_recipe",
            "arguments": '{"title": "Test"}',
        },
    }

    executor.parse_tool_calls([tool_call_data])

    with pytest.raises(ToolExecutorError) as exc_info:
        await executor.execute_tool_call("call_123")

    assert (
        "confirmation" in str(exc_info.value).lower()
        or "approved" in str(exc_info.value).lower()
    )


@pytest.mark.asyncio
async def test_execute_rejected_tool_raises():
    """Test that rejected tools cannot be executed"""
    from app.services.tools.executor import ToolExecutor, ToolExecutorError

    executor = ToolExecutor()

    tool_call_data = {
        "id": "call_123",
        "type": "function",
        "function": {
            "name": "create_recipe",
            "arguments": '{"title": "Test"}',
        },
    }

    executor.parse_tool_calls([tool_call_data])
    executor.reject_tool_call("call_123")

    with pytest.raises(ToolExecutorError) as exc_info:
        await executor.execute_tool_call("call_123")

    assert "rejected" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_create_recipe_requires_confirmation():
    """Test that create_recipe tool requires confirmation"""
    from app.services.tools.executor import ToolExecutor

    executor = ToolExecutor()

    assert executor.requires_confirmation("create_recipe") is True


@pytest.mark.asyncio
async def test_edit_recipe_requires_confirmation():
    """Test that edit_recipe tool requires confirmation"""
    from app.services.tools.executor import ToolExecutor

    executor = ToolExecutor()

    assert executor.requires_confirmation("edit_recipe") is True


@pytest.mark.asyncio
async def test_suggest_substitutions_no_confirmation():
    """Test that suggest_substitutions tool does not require confirmation"""
    from app.services.tools.executor import ToolExecutor

    executor = ToolExecutor()

    assert executor.requires_confirmation("suggest_substitutions") is False


# Test: Tool execution


@pytest.mark.asyncio
async def test_execute_approved_tool_call():
    """Test executing an approved tool call"""
    from app.services.tools.executor import ToolExecutor

    executor = ToolExecutor()

    tool_call_data = {
        "id": "call_123",
        "type": "function",
        "function": {
            "name": "create_recipe",
            "arguments": '{"title": "Test Recipe", "ingredients": [], "instructions": []}',
        },
    }

    executor.parse_tool_calls([tool_call_data])
    executor.approve_tool_call("call_123")

    # Mock the tool handler
    mock_handler = AsyncMock(return_value={"recipe_id": "new_123", "success": True})
    executor.register_tool("create_recipe", mock_handler)

    result = await executor.execute_tool_call("call_123")

    assert result["success"] is True
    assert result["recipe_id"] == "new_123"
    mock_handler.assert_called_once()


@pytest.mark.asyncio
async def test_execute_read_only_tool_without_explicit_approval():
    """Test that read-only tools execute without explicit approval"""
    from app.services.tools.executor import ToolExecutor

    executor = ToolExecutor()

    tool_call_data = {
        "id": "call_123",
        "type": "function",
        "function": {
            "name": "suggest_substitutions",
            "arguments": '{"recipe_id": "abc", "substitutions": []}',
        },
    }

    executor.parse_tool_calls([tool_call_data])

    # Mock the tool handler
    mock_handler = AsyncMock(
        return_value={"suggestions": [{"original": "butter", "replacement": "oil"}]}
    )
    executor.register_tool("suggest_substitutions", mock_handler)

    # Should execute without needing explicit approval
    result = await executor.execute_tool_call("call_123")

    assert "suggestions" in result
    mock_handler.assert_called_once()


@pytest.mark.asyncio
async def test_tool_execution_passes_arguments():
    """Test that tool execution passes correct arguments to handler"""
    from app.services.tools.executor import ToolExecutor

    executor = ToolExecutor()

    tool_call_data = {
        "id": "call_123",
        "type": "function",
        "function": {
            "name": "edit_recipe",
            "arguments": '{"recipe_id": "abc", "title": "Updated Title", "servings": 6}',
        },
    }

    executor.parse_tool_calls([tool_call_data])
    executor.approve_tool_call("call_123")

    mock_handler = AsyncMock(return_value={"success": True})
    executor.register_tool("edit_recipe", mock_handler)

    await executor.execute_tool_call("call_123")

    mock_handler.assert_called_once_with(
        recipe_id="abc", title="Updated Title", servings=6
    )


@pytest.mark.asyncio
async def test_tool_execution_updates_status():
    """Test that tool execution updates the tool call status"""
    from app.services.tools.executor import ToolExecutor, ToolCallStatus

    executor = ToolExecutor()

    tool_call_data = {
        "id": "call_123",
        "type": "function",
        "function": {
            "name": "create_recipe",
            "arguments": '{"title": "Test"}',
        },
    }

    tool_calls = executor.parse_tool_calls([tool_call_data])
    executor.approve_tool_call("call_123")

    mock_handler = AsyncMock(return_value={"success": True})
    executor.register_tool("create_recipe", mock_handler)

    await executor.execute_tool_call("call_123")

    assert tool_calls[0].status == ToolCallStatus.EXECUTED


# Test: Error handling


@pytest.mark.asyncio
async def test_execute_unknown_tool_raises():
    """Test that executing an unknown tool raises error"""
    from app.services.tools.executor import ToolExecutor, ToolExecutorError

    executor = ToolExecutor()

    tool_call_data = {
        "id": "call_123",
        "type": "function",
        "function": {
            "name": "unknown_tool",
            "arguments": "{}",
        },
    }

    executor.parse_tool_calls([tool_call_data])
    # Unknown tools might be auto-approved or need special handling
    # but should fail on execution if no handler registered

    with pytest.raises(ToolExecutorError) as exc_info:
        await executor.execute_tool_call("call_123")

    assert (
        "unknown" in str(exc_info.value).lower()
        or "not registered" in str(exc_info.value).lower()
    )


@pytest.mark.asyncio
async def test_tool_execution_failure_captured():
    """Test that tool execution failures are captured and reported"""
    from app.services.tools.executor import ToolExecutor, ToolCallStatus

    executor = ToolExecutor()

    tool_call_data = {
        "id": "call_123",
        "type": "function",
        "function": {
            "name": "create_recipe",
            "arguments": '{"title": "Test"}',
        },
    }

    tool_calls = executor.parse_tool_calls([tool_call_data])
    executor.approve_tool_call("call_123")

    # Mock handler that raises an exception
    mock_handler = AsyncMock(side_effect=Exception("Database error"))
    executor.register_tool("create_recipe", mock_handler)

    result = await executor.execute_tool_call("call_123")

    assert result["success"] is False
    assert "error" in result
    assert tool_calls[0].status == ToolCallStatus.FAILED


@pytest.mark.asyncio
async def test_execute_nonexistent_tool_call_raises():
    """Test that executing a non-existent tool call raises error"""
    from app.services.tools.executor import ToolExecutor, ToolExecutorError

    executor = ToolExecutor()

    with pytest.raises(ToolExecutorError) as exc_info:
        await executor.execute_tool_call("nonexistent_id")

    assert "not found" in str(exc_info.value).lower()


# Test: Tool registration


@pytest.mark.asyncio
async def test_register_tool_handler():
    """Test registering a tool handler"""
    from app.services.tools.executor import ToolExecutor

    executor = ToolExecutor()

    async def my_handler(**kwargs):
        return {"result": "success"}

    executor.register_tool("my_tool", my_handler)

    assert executor.has_tool("my_tool") is True


@pytest.mark.asyncio
async def test_get_registered_tools():
    """Test getting list of registered tools"""
    from app.services.tools.executor import ToolExecutor

    executor = ToolExecutor()

    executor.register_tool("tool_a", AsyncMock())
    executor.register_tool("tool_b", AsyncMock())

    tools = executor.get_registered_tools()

    assert "tool_a" in tools
    assert "tool_b" in tools


# Test: Get pending tool calls


@pytest.mark.asyncio
async def test_get_pending_tool_calls():
    """Test getting all pending tool calls"""
    from app.services.tools.executor import ToolExecutor, ToolCallStatus

    executor = ToolExecutor()

    # Add a tool that requires confirmation
    tool_call_data_1 = {
        "id": "call_1",
        "type": "function",
        "function": {
            "name": "create_recipe",
            "arguments": '{"title": "Test 1"}',
        },
    }
    # Add a read-only tool (auto-approved)
    tool_call_data_2 = {
        "id": "call_2",
        "type": "function",
        "function": {
            "name": "suggest_substitutions",
            "arguments": '{"recipe_id": "abc"}',
        },
    }

    executor.parse_tool_calls([tool_call_data_1, tool_call_data_2])

    pending = executor.get_pending_tool_calls()

    assert len(pending) == 1
    assert pending[0].id == "call_1"
    assert pending[0].status == ToolCallStatus.PENDING_CONFIRMATION


@pytest.mark.asyncio
async def test_get_tool_call_by_id():
    """Test retrieving a specific tool call by ID"""
    from app.services.tools.executor import ToolExecutor

    executor = ToolExecutor()

    tool_call_data = {
        "id": "call_123",
        "type": "function",
        "function": {
            "name": "create_recipe",
            "arguments": '{"title": "Test"}',
        },
    }

    executor.parse_tool_calls([tool_call_data])

    tool_call = executor.get_tool_call("call_123")

    assert tool_call is not None
    assert tool_call.id == "call_123"
    assert tool_call.name == "create_recipe"


@pytest.mark.asyncio
async def test_get_nonexistent_tool_call_returns_none():
    """Test that getting a non-existent tool call returns None"""
    from app.services.tools.executor import ToolExecutor

    executor = ToolExecutor()

    tool_call = executor.get_tool_call("nonexistent")

    assert tool_call is None


# Test: Clear tool calls


@pytest.mark.asyncio
async def test_clear_tool_calls():
    """Test clearing all tool calls from executor"""
    from app.services.tools.executor import ToolExecutor

    executor = ToolExecutor()

    tool_call_data = {
        "id": "call_123",
        "type": "function",
        "function": {
            "name": "create_recipe",
            "arguments": '{"title": "Test"}',
        },
    }

    executor.parse_tool_calls([tool_call_data])
    assert executor.get_tool_call("call_123") is not None

    executor.clear()

    assert executor.get_tool_call("call_123") is None


# Test: Tool call serialization for API response


@pytest.mark.asyncio
async def test_tool_call_to_dict():
    """Test converting tool call to dictionary for API response"""
    from app.services.tools.executor import ToolExecutor

    executor = ToolExecutor()

    tool_call_data = {
        "id": "call_123",
        "type": "function",
        "function": {
            "name": "create_recipe",
            "arguments": '{"title": "Test Recipe"}',
        },
    }

    tool_calls = executor.parse_tool_calls([tool_call_data])
    tool_dict = tool_calls[0].to_dict()

    assert tool_dict["id"] == "call_123"
    assert tool_dict["name"] == "create_recipe"
    assert tool_dict["arguments"] == {"title": "Test Recipe"}
    assert "status" in tool_dict
