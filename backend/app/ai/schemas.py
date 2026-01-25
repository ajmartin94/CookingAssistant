"""
AI Schemas

Pydantic models for chat messages, requests, and responses.
"""

from typing import Optional

from pydantic import BaseModel, field_validator


class ChatMessage(BaseModel):
    """A single message in a chat conversation."""

    role: str  # "system", "user", or "assistant"
    content: str


class ChatRequest(BaseModel):
    """Request payload for a chat completion."""

    messages: list[ChatMessage]
    current_recipe: Optional[dict] = None
    recipe_id: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None

    @field_validator("messages")
    @classmethod
    def messages_not_empty_and_within_limit(
        cls,
        v: list[ChatMessage],
    ) -> list[ChatMessage]:
        if len(v) == 0:
            raise ValueError("messages list must not be empty")
        if len(v) > 50:
            raise ValueError("messages list must not exceed 50 messages")
        return v


class ChatResponse(BaseModel):
    """Response from a chat completion."""

    message: str
    proposed_recipe: Optional[dict] = None
    error: Optional[str] = None
