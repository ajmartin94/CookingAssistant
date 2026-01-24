"""
AI Exception Classes

Domain-specific exceptions for the LLM client layer.
"""


class LLMError(Exception):
    """Base exception for LLM-related errors."""

    pass


class LLMTimeoutError(LLMError):
    """Raised when the LLM request times out."""

    pass


class LLMAuthError(LLMError):
    """Raised when authentication with the LLM provider fails."""

    pass


class LLMRateLimitError(LLMError):
    """Raised when the LLM provider rate-limits the request."""

    pass
