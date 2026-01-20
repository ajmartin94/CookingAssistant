"""
Chat API

API endpoints for AI chat functionality with tool calling support.
"""

from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ToolCallResponse,
    ToolConfirmRequest,
    ToolConfirmResponse,
)
from app.services.llm.service import get_llm_service, LLMService, LLMServiceError
from app.services.tools.executor import ToolExecutor, ToolExecutorError
from app.utils.dependencies import CurrentUser

router = APIRouter(prefix="/chat", tags=["chat"])

# Session-scoped tool executor (in production, this would be per-user session)
# For MVP, we use a simple in-memory store keyed by user ID
_user_executors: dict[str, ToolExecutor] = {}


def get_tool_executor(user_id: str) -> ToolExecutor:
    """Get or create a tool executor for a user session."""
    if user_id not in _user_executors:
        _user_executors[user_id] = ToolExecutor()
    return _user_executors[user_id]


# System prompt for the cooking assistant
SYSTEM_PROMPT = """You are a helpful cooking assistant. You help users create, edit, and improve recipes.

You have access to the following tools:
- create_recipe: Create a new recipe with title, ingredients, and instructions
- edit_recipe: Modify an existing recipe
- suggest_substitutions: Suggest ingredient substitutions (read-only, no confirmation needed)

When the user asks you to create or modify a recipe, use the appropriate tool.
Be conversational and helpful. Ask clarifying questions if needed.

Current context: {context}
"""


def build_messages(
    request: ChatRequest,
) -> list[dict]:
    """Build the message list for the LLM."""
    messages = []

    # Add system prompt with context
    context_str = "No specific context"
    if request.context:
        context_parts = [f"Page: {request.context.page}"]
        if request.context.recipe_id:
            context_parts.append(f"Recipe ID: {request.context.recipe_id}")
        if request.context.recipe_title:
            context_parts.append(f"Recipe: {request.context.recipe_title}")
        if request.context.filters:
            context_parts.append(f"Filters: {request.context.filters}")
        context_str = ", ".join(context_parts)

    messages.append(
        {
            "role": "system",
            "content": SYSTEM_PROMPT.format(context=context_str),
        }
    )

    # Add conversation history
    if request.conversation_history:
        for msg in request.conversation_history:
            messages.append(
                {
                    "role": msg.role,
                    "content": msg.content,
                }
            )

    # Add current user message
    messages.append(
        {
            "role": "user",
            "content": request.message,
        }
    )

    return messages


# Tool definitions for the LLM
TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "create_recipe",
            "description": "Create a new recipe and save it to the user's library",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "The recipe title",
                    },
                    "description": {
                        "type": "string",
                        "description": "Brief description of the recipe",
                    },
                    "ingredients": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string"},
                                "amount": {"type": "string"},
                                "unit": {"type": "string"},
                                "notes": {"type": "string"},
                            },
                            "required": ["name", "amount", "unit"],
                        },
                        "description": "List of ingredients",
                    },
                    "instructions": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "step_number": {"type": "integer"},
                                "instruction": {"type": "string"},
                                "duration_minutes": {"type": "integer"},
                            },
                            "required": ["step_number", "instruction"],
                        },
                        "description": "List of cooking instructions",
                    },
                    "prep_time_minutes": {"type": "integer"},
                    "cook_time_minutes": {"type": "integer"},
                    "servings": {"type": "integer"},
                    "cuisine_type": {"type": "string"},
                    "dietary_tags": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                },
                "required": ["title", "ingredients", "instructions"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "edit_recipe",
            "description": "Edit an existing recipe",
            "parameters": {
                "type": "object",
                "properties": {
                    "recipe_id": {
                        "type": "string",
                        "description": "ID of the recipe to edit",
                    },
                    "title": {"type": "string"},
                    "description": {"type": "string"},
                    "ingredients": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string"},
                                "amount": {"type": "string"},
                                "unit": {"type": "string"},
                                "notes": {"type": "string"},
                            },
                        },
                    },
                    "instructions": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "step_number": {"type": "integer"},
                                "instruction": {"type": "string"},
                                "duration_minutes": {"type": "integer"},
                            },
                        },
                    },
                },
                "required": ["recipe_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "suggest_substitutions",
            "description": "Suggest ingredient substitutions for a recipe (read-only)",
            "parameters": {
                "type": "object",
                "properties": {
                    "recipe_id": {
                        "type": "string",
                        "description": "ID of the recipe",
                    },
                    "dietary_requirement": {
                        "type": "string",
                        "description": "Dietary requirement (e.g., dairy-free, vegan)",
                    },
                },
                "required": ["recipe_id"],
            },
        },
    },
]


@router.post("", response_model=ChatResponse)
async def send_chat_message(
    request: ChatRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    llm_service: Annotated[LLMService, Depends(get_llm_service)],
):
    """
    Send a chat message and receive a response.

    The response may include tool calls that require user confirmation
    before execution.
    """
    # Validate message is not empty (Pydantic handles min_length but double-check)
    if not request.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty",
        )

    # Build messages for LLM
    messages = build_messages(request)

    try:
        # Get LLM response (non-streaming for now)
        response = await llm_service.chat(
            messages=messages,
            tools=TOOL_DEFINITIONS,
            stream=False,
        )

        # Extract response content
        assistant_message = response.choices[0].message
        response_text = assistant_message.content
        tool_calls_response: list[ToolCallResponse] = []

        # Process tool calls if present
        if assistant_message.tool_calls:
            executor = get_tool_executor(current_user.id)

            # Parse tool calls through executor
            tool_calls = executor.parse_tool_calls(
                [
                    {
                        "id": tc.id,
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments,
                        },
                    }
                    for tc in assistant_message.tool_calls
                ]
            )

            # Convert to response format
            tool_calls_response = [
                ToolCallResponse(
                    id=tc.id,
                    name=tc.name,
                    arguments=tc.arguments,
                    status=tc.status.value,
                )
                for tc in tool_calls
            ]

        return ChatResponse(
            response=response_text,
            tool_calls=tool_calls_response,
        )

    except LLMServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )


@router.post("/confirm", response_model=ToolConfirmResponse)
async def confirm_tool_call(
    request: ToolConfirmRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Approve or reject a pending tool call.

    If approved, the tool will be executed and the result returned.
    """
    executor = get_tool_executor(current_user.id)

    # Check if tool call exists
    tool_call = executor.get_tool_call(request.tool_call_id)
    if tool_call is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tool call not found: {request.tool_call_id}",
        )

    try:
        if request.approved:
            # Approve and execute
            executor.approve_tool_call(request.tool_call_id)

            # Execute the tool (handlers would be registered elsewhere)
            # For now, return approved status without execution
            # TODO: Register tool handlers and execute
            return ToolConfirmResponse(
                status="approved",
                result={"message": "Tool approved (execution not yet implemented)"},
            )
        else:
            # Reject the tool call
            executor.reject_tool_call(request.tool_call_id)
            return ToolConfirmResponse(
                status="rejected",
            )

    except ToolExecutorError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
