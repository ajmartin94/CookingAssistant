"""
LLM Client

Async client wrapping litellm.acompletion() for unified LLM access.
Supports configurable model, temperature, max_tokens, and timeout.
Uses TestProvider when model is set to "test".
"""

import litellm

from app.ai.exceptions import LLMError, LLMTimeoutError, LLMAuthError, LLMRateLimitError
from app.ai.schemas import ChatMessage
from app.ai.test_provider import TestProvider


class LLMClient:
    """
    Async LLM client that wraps litellm for multi-provider support.

    When model is "test", delegates to TestProvider for deterministic responses.
    Otherwise, calls litellm.acompletion() with the configured parameters.
    """

    def __init__(
        self,
        model: str = "test",
        temperature: float = 0.7,
        max_tokens: int = 2000,
        timeout: int = 30,
    ):
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.timeout = timeout
        self._test_provider = TestProvider() if model == "test" else None

    async def complete(self, messages: list[ChatMessage]) -> str:
        """
        Send messages to the LLM and return the response text.

        Args:
            messages: List of ChatMessage objects forming the conversation.

        Returns:
            The response content string from the LLM.

        Raises:
            LLMTimeoutError: When the request times out.
            LLMAuthError: When authentication fails.
            LLMRateLimitError: When rate-limited by the provider.
            LLMError: For other LLM-related errors.
        """
        # Use test provider for deterministic testing
        if self._test_provider:
            return await self._test_provider.complete(messages)

        # Convert ChatMessage objects to dicts for litellm
        message_dicts = [{"role": msg.role, "content": msg.content} for msg in messages]

        try:
            response = await litellm.acompletion(
                model=self.model,
                messages=message_dicts,
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                timeout=self.timeout,
            )
            return response.choices[0].message.content

        except TimeoutError as e:
            raise LLMTimeoutError(f"LLM request timed out: {str(e)}") from e

        except Exception as e:
            error_msg = str(e)

            if "AuthenticationError" in error_msg:
                raise LLMAuthError(f"LLM authentication failed: {error_msg}") from e

            if "RateLimitError" in error_msg:
                raise LLMRateLimitError(f"LLM rate limit exceeded: {error_msg}") from e

            raise LLMError(f"LLM error: {error_msg}") from e
