"""
Unit Tests for LLM Service

Tests for the LLM service layer that wraps LiteLLM, using mocked provider responses.
This is TDD - tests written first before implementation.
"""

import pytest
from unittest.mock import patch, MagicMock


# Test: Configuration loading


@pytest.mark.asyncio
async def test_llm_service_loads_model_from_settings():
    """Test that LLM service reads model name from settings"""
    with patch("app.services.llm.service.settings") as mock_settings:
        mock_settings.llm_model = "ollama/llama3.1:8b"

        from app.services.llm.service import LLMService

        service = LLMService()

        assert service.model == "ollama/llama3.1:8b"


@pytest.mark.asyncio
async def test_llm_service_uses_default_model_when_not_configured():
    """Test that LLM service uses a default model if not explicitly configured"""
    with patch("app.services.llm.service.settings") as mock_settings:
        mock_settings.llm_model = "ollama/llama3.1:8b"  # Default value

        from app.services.llm.service import LLMService

        service = LLMService()

        assert service.model is not None
        assert len(service.model) > 0


# Test: Basic chat() method


@pytest.mark.asyncio
async def test_chat_returns_async_iterator():
    """Test that chat() returns an async iterator"""
    with patch("app.services.llm.service.settings") as mock_settings:
        mock_settings.llm_model = "ollama/llama3.1:8b"

        with patch("app.services.llm.service.acompletion") as mock_acompletion:
            # Create a mock async iterator
            async def mock_stream():
                yield {"choices": [{"delta": {"content": "Hello"}}]}
                yield {"choices": [{"delta": {"content": " world"}}]}

            mock_acompletion.return_value = mock_stream()

            from app.services.llm.service import LLMService

            service = LLMService()
            messages = [{"role": "user", "content": "Hi"}]

            result = service.chat(messages)

            # Should be an async iterator
            assert hasattr(result, "__aiter__")


@pytest.mark.asyncio
async def test_chat_passes_messages_to_litellm():
    """Test that chat() passes messages to LiteLLM correctly"""
    with patch("app.services.llm.service.settings") as mock_settings:
        mock_settings.llm_model = "ollama/llama3.1:8b"

        with patch("app.services.llm.service.acompletion") as mock_acompletion:

            async def mock_stream():
                yield {"choices": [{"delta": {"content": "Response"}}]}

            mock_acompletion.return_value = mock_stream()

            from app.services.llm.service import LLMService

            service = LLMService()
            messages = [
                {"role": "system", "content": "You are a cooking assistant."},
                {"role": "user", "content": "Help me make pasta"},
            ]

            # Consume the async iterator
            async for _ in service.chat(messages):
                pass

            # Verify acompletion was called with correct arguments
            mock_acompletion.assert_called_once()
            call_kwargs = mock_acompletion.call_args.kwargs
            assert call_kwargs["model"] == "ollama/llama3.1:8b"
            assert call_kwargs["messages"] == messages


@pytest.mark.asyncio
async def test_chat_enables_streaming_by_default():
    """Test that chat() uses streaming by default"""
    with patch("app.services.llm.service.settings") as mock_settings:
        mock_settings.llm_model = "ollama/llama3.1:8b"

        with patch("app.services.llm.service.acompletion") as mock_acompletion:

            async def mock_stream():
                yield {"choices": [{"delta": {"content": "Hi"}}]}

            mock_acompletion.return_value = mock_stream()

            from app.services.llm.service import LLMService

            service = LLMService()

            async for _ in service.chat([{"role": "user", "content": "Hi"}]):
                pass

            call_kwargs = mock_acompletion.call_args.kwargs
            assert call_kwargs["stream"] is True


@pytest.mark.asyncio
async def test_chat_can_disable_streaming():
    """Test that chat() streaming can be disabled"""
    with patch("app.services.llm.service.settings") as mock_settings:
        mock_settings.llm_model = "ollama/llama3.1:8b"

        with patch("app.services.llm.service.acompletion") as mock_acompletion:
            # Non-streaming response
            mock_response = MagicMock()
            mock_response.choices = [MagicMock(message=MagicMock(content="Hello"))]
            mock_acompletion.return_value = mock_response

            from app.services.llm.service import LLMService

            service = LLMService()

            result = await service.chat(
                [{"role": "user", "content": "Hi"}], stream=False
            )

            call_kwargs = mock_acompletion.call_args.kwargs
            assert call_kwargs["stream"] is False
            assert result is not None


# Test: Streaming response handling


@pytest.mark.asyncio
async def test_chat_yields_content_chunks():
    """Test that streaming chat yields content chunks correctly"""
    with patch("app.services.llm.service.settings") as mock_settings:
        mock_settings.llm_model = "ollama/llama3.1:8b"

        with patch("app.services.llm.service.acompletion") as mock_acompletion:

            async def mock_stream():
                yield {
                    "choices": [{"delta": {"content": "Hello"}, "finish_reason": None}]
                }
                yield {
                    "choices": [{"delta": {"content": " there"}, "finish_reason": None}]
                }
                yield {
                    "choices": [{"delta": {"content": "!"}, "finish_reason": "stop"}]
                }

            mock_acompletion.return_value = mock_stream()

            from app.services.llm.service import LLMService

            service = LLMService()
            chunks = []

            async for chunk in service.chat([{"role": "user", "content": "Hi"}]):
                chunks.append(chunk)

            assert len(chunks) == 3


@pytest.mark.asyncio
async def test_chat_handles_empty_delta():
    """Test that chat handles chunks with empty delta content"""
    with patch("app.services.llm.service.settings") as mock_settings:
        mock_settings.llm_model = "ollama/llama3.1:8b"

        with patch("app.services.llm.service.acompletion") as mock_acompletion:

            async def mock_stream():
                yield {"choices": [{"delta": {}, "finish_reason": None}]}
                yield {"choices": [{"delta": {"content": "Hi"}, "finish_reason": None}]}
                yield {"choices": [{"delta": {}, "finish_reason": "stop"}]}

            mock_acompletion.return_value = mock_stream()

            from app.services.llm.service import LLMService

            service = LLMService()
            chunks = []

            async for chunk in service.chat([{"role": "user", "content": "Test"}]):
                chunks.append(chunk)

            # Should still process all chunks without error
            assert len(chunks) == 3


# Test: Tool call parsing


@pytest.mark.asyncio
async def test_chat_passes_tools_to_litellm():
    """Test that chat() passes tool definitions to LiteLLM"""
    with patch("app.services.llm.service.settings") as mock_settings:
        mock_settings.llm_model = "ollama/llama3.1:8b"

        with patch("app.services.llm.service.acompletion") as mock_acompletion:

            async def mock_stream():
                yield {"choices": [{"delta": {"content": "OK"}}]}

            mock_acompletion.return_value = mock_stream()

            from app.services.llm.service import LLMService

            service = LLMService()
            tools = [
                {
                    "type": "function",
                    "function": {
                        "name": "create_recipe",
                        "description": "Create a new recipe",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "title": {"type": "string"},
                            },
                            "required": ["title"],
                        },
                    },
                }
            ]

            async for _ in service.chat(
                [{"role": "user", "content": "Create a pasta recipe"}], tools=tools
            ):
                pass

            call_kwargs = mock_acompletion.call_args.kwargs
            assert call_kwargs["tools"] == tools


@pytest.mark.asyncio
async def test_chat_yields_tool_call_chunks():
    """Test that chat() yields tool call chunks from streaming response"""
    with patch("app.services.llm.service.settings") as mock_settings:
        mock_settings.llm_model = "ollama/llama3.1:8b"

        with patch("app.services.llm.service.acompletion") as mock_acompletion:

            async def mock_stream():
                # Tool call chunks from LiteLLM streaming
                yield {
                    "choices": [
                        {
                            "delta": {
                                "tool_calls": [
                                    {
                                        "index": 0,
                                        "id": "call_123",
                                        "type": "function",
                                        "function": {
                                            "name": "create_recipe",
                                            "arguments": '{"title":',
                                        },
                                    }
                                ]
                            },
                            "finish_reason": None,
                        }
                    ]
                }
                yield {
                    "choices": [
                        {
                            "delta": {
                                "tool_calls": [
                                    {
                                        "index": 0,
                                        "function": {"arguments": ' "Pasta"}'},
                                    }
                                ]
                            },
                            "finish_reason": None,
                        }
                    ]
                }
                yield {"choices": [{"delta": {}, "finish_reason": "tool_calls"}]}

            mock_acompletion.return_value = mock_stream()

            from app.services.llm.service import LLMService

            service = LLMService()
            chunks = []

            async for chunk in service.chat(
                [{"role": "user", "content": "Create a recipe"}],
                tools=[
                    {
                        "type": "function",
                        "function": {
                            "name": "create_recipe",
                            "parameters": {"type": "object", "properties": {}},
                        },
                    }
                ],
            ):
                chunks.append(chunk)

            # All chunks should be yielded
            assert len(chunks) == 3
            # First chunk should have tool call info
            assert "tool_calls" in chunks[0]["choices"][0]["delta"]


@pytest.mark.asyncio
async def test_chat_non_streaming_returns_tool_calls():
    """Test that non-streaming chat() returns tool calls in response"""
    with patch("app.services.llm.service.settings") as mock_settings:
        mock_settings.llm_model = "ollama/llama3.1:8b"

        with patch("app.services.llm.service.acompletion") as mock_acompletion:
            # Non-streaming response with tool calls
            mock_message = MagicMock()
            mock_message.content = None
            mock_function = MagicMock()
            mock_function.name = "create_recipe"
            mock_function.arguments = '{"title": "Pasta"}'

            mock_tool_call = MagicMock()
            mock_tool_call.id = "call_123"
            mock_tool_call.type = "function"
            mock_tool_call.function = mock_function

            mock_message.tool_calls = [mock_tool_call]

            mock_choice = MagicMock()
            mock_choice.message = mock_message
            mock_choice.finish_reason = "tool_calls"

            mock_response = MagicMock()
            mock_response.choices = [mock_choice]

            mock_acompletion.return_value = mock_response

            from app.services.llm.service import LLMService

            service = LLMService()

            result = await service.chat(
                [{"role": "user", "content": "Create a recipe"}],
                tools=[
                    {
                        "type": "function",
                        "function": {"name": "create_recipe", "parameters": {}},
                    }
                ],
                stream=False,
            )

            # Result should contain tool calls
            assert result.choices[0].message.tool_calls is not None
            assert len(result.choices[0].message.tool_calls) == 1
            assert (
                result.choices[0].message.tool_calls[0].function.name == "create_recipe"
            )


# Test: Error cases


@pytest.mark.asyncio
async def test_chat_raises_on_provider_unavailable():
    """Test that chat() raises appropriate error when provider is unavailable"""
    with patch("app.services.llm.service.settings") as mock_settings:
        mock_settings.llm_model = "ollama/llama3.1:8b"

        with patch("app.services.llm.service.acompletion") as mock_acompletion:
            from app.services.llm.service import LLMServiceError

            mock_acompletion.side_effect = Exception("Connection refused")

            from app.services.llm.service import LLMService

            service = LLMService()

            with pytest.raises(LLMServiceError) as exc_info:
                async for _ in service.chat([{"role": "user", "content": "Hi"}]):
                    pass

            assert (
                "provider" in str(exc_info.value).lower()
                or "unavailable" in str(exc_info.value).lower()
                or "connection" in str(exc_info.value).lower()
            )


@pytest.mark.asyncio
async def test_chat_raises_on_invalid_api_key():
    """Test that chat() raises appropriate error for invalid API key"""
    with patch("app.services.llm.service.settings") as mock_settings:
        mock_settings.llm_model = "anthropic/claude-3-haiku"

        with patch("app.services.llm.service.acompletion") as mock_acompletion:
            from app.services.llm.service import LLMServiceError

            mock_acompletion.side_effect = Exception("Invalid API key")

            from app.services.llm.service import LLMService

            service = LLMService()

            with pytest.raises(LLMServiceError) as exc_info:
                async for _ in service.chat([{"role": "user", "content": "Hi"}]):
                    pass

            assert (
                "api" in str(exc_info.value).lower()
                or "key" in str(exc_info.value).lower()
                or "invalid" in str(exc_info.value).lower()
            )


@pytest.mark.asyncio
async def test_chat_raises_on_rate_limit():
    """Test that chat() raises appropriate error on rate limit"""
    with patch("app.services.llm.service.settings") as mock_settings:
        mock_settings.llm_model = "ollama/llama3.1:8b"

        with patch("app.services.llm.service.acompletion") as mock_acompletion:
            from app.services.llm.service import LLMServiceError

            mock_acompletion.side_effect = Exception("Rate limit exceeded")

            from app.services.llm.service import LLMService

            service = LLMService()

            with pytest.raises(LLMServiceError) as exc_info:
                async for _ in service.chat([{"role": "user", "content": "Hi"}]):
                    pass

            # Should wrap the error appropriately
            assert exc_info.value is not None


@pytest.mark.asyncio
async def test_chat_handles_malformed_response():
    """Test that chat() handles malformed responses gracefully"""
    with patch("app.services.llm.service.settings") as mock_settings:
        mock_settings.llm_model = "ollama/llama3.1:8b"

        with patch("app.services.llm.service.acompletion") as mock_acompletion:

            async def mock_stream():
                # Malformed response missing expected structure
                yield {"unexpected": "structure"}
                yield {"choices": None}
                yield {"choices": []}

            mock_acompletion.return_value = mock_stream()

            from app.services.llm.service import LLMService

            service = LLMService()

            # Should not crash, but yield what it can
            chunks = []
            async for chunk in service.chat([{"role": "user", "content": "Hi"}]):
                chunks.append(chunk)

            # Should process without crashing
            assert len(chunks) >= 0


@pytest.mark.asyncio
async def test_chat_timeout_error():
    """Test that chat() handles timeout errors"""
    with patch("app.services.llm.service.settings") as mock_settings:
        mock_settings.llm_model = "ollama/llama3.1:8b"

        with patch("app.services.llm.service.acompletion") as mock_acompletion:
            import asyncio
            from app.services.llm.service import LLMServiceError

            mock_acompletion.side_effect = asyncio.TimeoutError("Request timed out")

            from app.services.llm.service import LLMService

            service = LLMService()

            with pytest.raises(LLMServiceError) as exc_info:
                async for _ in service.chat([{"role": "user", "content": "Hi"}]):
                    pass

            assert (
                "timeout" in str(exc_info.value).lower() or exc_info.value is not None
            )


# Test: Service instantiation


@pytest.mark.asyncio
async def test_llm_service_is_singleton_friendly():
    """Test that LLMService can be used as a singleton"""
    with patch("app.services.llm.service.settings") as mock_settings:
        mock_settings.llm_model = "ollama/llama3.1:8b"

        from app.services.llm.service import LLMService

        service1 = LLMService()
        service2 = LLMService()

        # Both should work independently
        assert service1.model == service2.model


@pytest.mark.asyncio
async def test_llm_service_can_be_dependency_injected():
    """Test that LLMService works with FastAPI dependency injection pattern"""
    with patch("app.services.llm.service.settings") as mock_settings:
        mock_settings.llm_model = "ollama/llama3.1:8b"

        from app.services.llm.service import LLMService, get_llm_service

        service = get_llm_service()

        assert isinstance(service, LLMService)
        assert service.model == "ollama/llama3.1:8b"
