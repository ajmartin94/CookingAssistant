"""
Chat Schemas

Pydantic schemas for chat API request/response validation.
"""

from pydantic import BaseModel, Field
from typing import Any, Optional


class ChatContext(BaseModel):
    """Context information about the current page/state."""

    page: str = Field(
        ...,
        description="Current page (recipe_detail, recipe_list, recipe_create, recipe_edit)",
    )
    recipe_id: Optional[str] = Field(None, description="Recipe ID if on a recipe page")
    recipe_title: Optional[str] = Field(None, description="Recipe title for context")
    filters: Optional[dict[str, Any]] = Field(
        None, description="Active filters on list page"
    )


class ChatMessage(BaseModel):
    """A single message in conversation history."""

    role: str = Field(..., description="Message role (user, assistant, system)")
    content: str = Field(..., description="Message content")


class ChatRequest(BaseModel):
    """Request schema for sending a chat message."""

    message: str = Field(..., min_length=1, description="User's message")
    context: Optional[ChatContext] = Field(None, description="Page context")
    conversation_history: Optional[list[ChatMessage]] = Field(
        None, description="Previous messages in conversation"
    )
    stream: bool = Field(False, description="Whether to stream the response")


class ToolCallResponse(BaseModel):
    """A tool call returned by the LLM."""

    id: str = Field(..., description="Unique tool call ID")
    name: str = Field(..., description="Tool name")
    arguments: dict[str, Any] = Field(..., description="Tool arguments")
    status: str = Field(
        ...,
        description="Tool call status (pending_confirmation, approved, rejected, executed, failed)",
    )


class ChatResponse(BaseModel):
    """Response schema for chat endpoint."""

    response: Optional[str] = Field(None, description="Assistant's text response")
    tool_calls: list[ToolCallResponse] = Field(
        default_factory=list, description="Tool calls from the LLM"
    )


class ToolConfirmRequest(BaseModel):
    """Request schema for confirming/rejecting a tool call."""

    tool_call_id: str = Field(..., description="ID of the tool call to confirm")
    approved: bool = Field(
        ..., description="Whether to approve or reject the tool call"
    )


class ToolConfirmResponse(BaseModel):
    """Response schema for tool confirmation."""

    status: str = Field(
        ..., description="Result status (approved, rejected, executed, failed)"
    )
    result: Optional[dict[str, Any]] = Field(
        None, description="Tool execution result if executed"
    )
    error: Optional[str] = Field(None, description="Error message if failed")
