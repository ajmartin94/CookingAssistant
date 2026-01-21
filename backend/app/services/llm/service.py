"""
LLM Service

Provides a thin wrapper over LiteLLM for provider-agnostic LLM access.
Supports streaming responses and tool calls.
"""

import asyncio
import os
from typing import Any, AsyncIterator

from litellm import acompletion

from app.config import settings


class LLMServiceError(Exception):
    """Exception raised when LLM service encounters an error."""

    pass


class ChatResponse:
    """
    Wrapper that supports both async iteration (streaming) and await (non-streaming).

    Usage:
        # Streaming
        async for chunk in service.chat(messages):
            print(chunk)

        # Non-streaming
        result = await service.chat(messages, stream=False)
    """

    def __init__(
        self,
        service: "LLMService",
        messages: list[dict],
        tools: list[dict] | None,
        stream: bool,
    ):
        self._service = service
        self._messages = messages
        self._tools = tools
        self._stream = stream
        self._result: Any = None

    def __aiter__(self) -> AsyncIterator[dict]:
        """Return async iterator for streaming responses."""
        return self._stream_response()

    def __await__(self):
        """Allow awaiting for non-streaming responses."""
        return self._complete_response().__await__()

    async def _stream_response(self) -> AsyncIterator[dict]:
        """Stream chat responses from the LLM."""
        try:
            response = await acompletion(
                model=self._service.model,
                messages=self._messages,
                tools=self._tools,
                stream=True,
            )

            async for chunk in response:
                yield chunk

        except asyncio.TimeoutError as e:
            raise LLMServiceError(f"Request timeout: {e}") from e
        except Exception as e:
            self._handle_error(e)

    async def _complete_response(self) -> Any:
        """Get a complete (non-streaming) response from the LLM."""
        try:
            response = await acompletion(
                model=self._service.model,
                messages=self._messages,
                tools=self._tools,
                stream=False,
            )
            return response

        except asyncio.TimeoutError as e:
            raise LLMServiceError(f"Request timeout: {e}") from e
        except Exception as e:
            self._handle_error(e)

    def _handle_error(self, e: Exception) -> None:
        """Handle and wrap exceptions appropriately."""
        error_msg = str(e).lower()
        if "connection" in error_msg or "refused" in error_msg:
            raise LLMServiceError(f"LLM provider unavailable: {e}") from e
        elif "api" in error_msg and "key" in error_msg:
            raise LLMServiceError(f"Invalid API key: {e}") from e
        elif "rate" in error_msg and "limit" in error_msg:
            raise LLMServiceError(f"Rate limit exceeded: {e}") from e
        else:
            raise LLMServiceError(f"LLM error: {e}") from e


class LLMService:
    """
    LLM service that wraps LiteLLM for provider-agnostic access.

    Supports multiple providers via LiteLLM's unified interface:
    - ollama/llama3.1:8b (local)
    - anthropic/claude-3-haiku (cloud)
    - openai/gpt-4 (cloud)
    """

    def __init__(self) -> None:
        """Initialize the LLM service with model from settings."""
        self.model = settings.llm_model

    def chat(
        self,
        messages: list[dict],
        tools: list[dict] | None = None,
        stream: bool = True,
    ) -> ChatResponse:
        """
        Send messages to the LLM and get a response.

        Args:
            messages: List of message dicts with 'role' and 'content' keys.
            tools: Optional list of tool definitions for function calling.
            stream: Whether to stream the response (default True).

        Returns:
            ChatResponse object that can be used as:
            - Async iterator (streaming): async for chunk in response
            - Awaitable (non-streaming): result = await response

        Raises:
            LLMServiceError: If the LLM provider is unavailable or returns an error.

        Examples:
            # Streaming
            async for chunk in service.chat(messages):
                print(chunk)

            # Non-streaming
            result = await service.chat(messages, stream=False)
        """
        return ChatResponse(self, messages, tools, stream)


# Singleton instance for dependency injection
_llm_service: LLMService | None = None


def get_llm_service() -> LLMService:
    """
    Get or create the LLM service singleton.

    In E2E testing mode (E2E_TESTING=true), returns a mock LLM service
    that provides deterministic, predictable responses for testing.

    Returns:
        LLMService: The shared LLM service instance (or mock for e2e).
    """
    # Use mock LLM for e2e testing
    if os.getenv("E2E_TESTING", "false").lower() == "true":
        from app.services.llm.mock_service import get_mock_llm_service

        return get_mock_llm_service()  # type: ignore[return-value]

    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service
