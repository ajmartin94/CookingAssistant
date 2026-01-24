"""
Integration Tests for LLM Client

Tests for LLMClient class (wrapping litellm.acompletion) and TestProvider
with deterministic canned responses. Mocks the external litellm call
but tests the full client logic including error handling.
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from app.ai.llm_client import LLMClient
from app.ai.test_provider import TestProvider
from app.ai.exceptions import LLMTimeoutError, LLMAuthError, LLMRateLimitError
from app.ai.schemas import ChatMessage


class TestLLMClientCompletion:
    """Tests for LLM client calling litellm with correct parameters."""

    @pytest.mark.asyncio
    async def test_calls_litellm_with_correct_parameters(self):
        """LLM client passes model, messages, temperature, max_tokens to litellm."""
        # SETUP
        client = LLMClient(
            model="gpt-4",
            temperature=0.7,
            max_tokens=2000,
            timeout=30,
        )
        messages = [
            ChatMessage(role="system", content="You are a cooking assistant."),
            ChatMessage(role="user", content="Suggest a pasta recipe."),
        ]

        mock_response = MagicMock()
        mock_response.choices = [
            MagicMock(message=MagicMock(content="Here's a pasta recipe for you!"))
        ]

        # ACTION
        with patch(
            "app.ai.llm_client.litellm.acompletion", new_callable=AsyncMock
        ) as mock_completion:
            mock_completion.return_value = mock_response
            result = await client.complete(messages)

            # VERIFY
            mock_completion.assert_called_once()
            call_kwargs = mock_completion.call_args[1]
            assert call_kwargs["model"] == "gpt-4"
            assert call_kwargs["temperature"] == 0.7
            assert call_kwargs["max_tokens"] == 2000
            assert len(call_kwargs["messages"]) == 2
            assert call_kwargs["messages"][0]["role"] == "system"
            assert call_kwargs["messages"][1]["role"] == "user"

        assert result == "Here's a pasta recipe for you!"


class TestLLMClientTimeout:
    """Tests for LLM client timeout configuration."""

    @pytest.mark.asyncio
    async def test_respects_timeout_configuration(self):
        """LLM client passes timeout parameter to litellm."""
        # SETUP
        client = LLMClient(
            model="gpt-4",
            temperature=0.7,
            max_tokens=2000,
            timeout=15,
        )
        messages = [
            ChatMessage(role="user", content="Quick question"),
        ]

        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content="Quick answer"))]

        # ACTION
        with patch(
            "app.ai.llm_client.litellm.acompletion", new_callable=AsyncMock
        ) as mock_completion:
            mock_completion.return_value = mock_response
            await client.complete(messages)

            # VERIFY
            call_kwargs = mock_completion.call_args[1]
            assert call_kwargs["timeout"] == 15


class TestLLMClientErrorHandling:
    """Tests for LLM client error handling (timeout, auth, rate limit)."""

    @pytest.mark.asyncio
    async def test_handles_timeout_error_gracefully(self):
        """LLM client raises LLMTimeoutError when litellm times out."""
        # SETUP
        client = LLMClient(
            model="gpt-4",
            temperature=0.7,
            max_tokens=2000,
            timeout=30,
        )
        messages = [
            ChatMessage(role="user", content="Generate a complex recipe"),
        ]

        # ACTION / VERIFY
        with patch(
            "app.ai.llm_client.litellm.acompletion", new_callable=AsyncMock
        ) as mock_completion:
            mock_completion.side_effect = TimeoutError("Request timed out")
            with pytest.raises(LLMTimeoutError):
                await client.complete(messages)

    @pytest.mark.asyncio
    async def test_handles_auth_error_gracefully(self):
        """LLM client raises LLMAuthError when authentication fails."""
        # SETUP
        client = LLMClient(
            model="gpt-4",
            temperature=0.7,
            max_tokens=2000,
            timeout=30,
        )
        messages = [
            ChatMessage(role="user", content="Hello"),
        ]

        # ACTION / VERIFY
        with patch(
            "app.ai.llm_client.litellm.acompletion", new_callable=AsyncMock
        ) as mock_completion:
            mock_completion.side_effect = Exception(
                "AuthenticationError: Invalid API key"
            )
            with pytest.raises(LLMAuthError):
                await client.complete(messages)

    @pytest.mark.asyncio
    async def test_handles_rate_limit_error_gracefully(self):
        """LLM client raises LLMRateLimitError when rate limited."""
        # SETUP
        client = LLMClient(
            model="gpt-4",
            temperature=0.7,
            max_tokens=2000,
            timeout=30,
        )
        messages = [
            ChatMessage(role="user", content="Hello"),
        ]

        # ACTION / VERIFY
        with patch(
            "app.ai.llm_client.litellm.acompletion", new_callable=AsyncMock
        ) as mock_completion:
            mock_completion.side_effect = Exception("RateLimitError: Too many requests")
            with pytest.raises(LLMRateLimitError):
                await client.complete(messages)


class TestTestProvider:
    """Tests for TestProvider which returns deterministic canned responses."""

    @pytest.mark.asyncio
    async def test_returns_canned_recipe_for_creation_prompts(self):
        """Test provider returns a canned recipe JSON response for recipe creation."""
        # SETUP
        provider = TestProvider()
        messages = [
            ChatMessage(role="system", content="You are a cooking assistant."),
            ChatMessage(role="user", content="Create a recipe for chocolate cake"),
        ]

        # ACTION
        result = await provider.complete(messages)

        # VERIFY - should contain a JSON recipe block
        assert "```json" in result
        assert '"title"' in result
        assert '"ingredients"' in result
        assert '"instructions"' in result

    @pytest.mark.asyncio
    async def test_returns_canned_text_for_conversational_prompts(self):
        """Test provider returns text-only response for non-recipe prompts."""
        # SETUP
        provider = TestProvider()
        messages = [
            ChatMessage(role="system", content="You are a cooking assistant."),
            ChatMessage(role="user", content="What is the best way to store herbs?"),
        ]

        # ACTION
        result = await provider.complete(messages)

        # VERIFY - should be a text response without JSON recipe block
        assert isinstance(result, str)
        assert len(result) > 0
        assert "```json" not in result
