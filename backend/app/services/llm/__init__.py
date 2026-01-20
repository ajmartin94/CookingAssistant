"""LLM Service Module

Provides LLM integration via LiteLLM for provider-agnostic access.
"""

from app.services.llm.service import LLMService, LLMServiceError, get_llm_service

__all__ = ["LLMService", "LLMServiceError", "get_llm_service"]
