"""
Chat API

API endpoint for AI-powered chat conversations about cooking.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.exceptions import LLMError
from app.ai.llm_client import LLMClient
from app.ai.prompts import build_system_prompt
from app.ai.response_parser import parse_chat_response
from app.ai.schemas import ChatMessage, ChatRequest, ChatResponse
from app.config import settings
from app.database import get_db
from app.models.recipe import Recipe
from app.services.chat_service import truncate_message_history
from app.utils.dependencies import CurrentUser

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ChatResponse:
    """
    Send a chat message and get an AI-powered cooking response.

    - **messages**: Conversation history (1-50 messages)
    - **current_recipe**: Optional recipe context for the conversation
    - **recipe_id**: Optional ID of an existing recipe to discuss

    Returns a ChatResponse with message text and optional proposed_recipe.
    """
    # Fetch user preferences
    preferences = None
    if current_user.dietary_restrictions or current_user.skill_level:
        preferences = {
            "dietary_tags": current_user.dietary_restrictions or [],
            "skill_level": current_user.skill_level,
        }

    # If recipe_id provided, verify ownership and fetch full recipe
    recipe_state = request.current_recipe
    if request.recipe_id:
        result = await db.execute(select(Recipe).where(Recipe.id == request.recipe_id))
        recipe = result.scalar_one_or_none()

        if recipe is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recipe not found",
            )

        if recipe.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this recipe",
            )

        # Use fetched recipe as context
        recipe_state = {
            "title": recipe.title,
            "ingredients": recipe.ingredients,
            "instructions": recipe.instructions,
            "cuisine_type": recipe.cuisine_type,
            "difficulty_level": recipe.difficulty_level,
        }

    # Fetch last 20 recipes for library context
    library_summary = None
    result = await db.execute(
        select(Recipe.title, Recipe.cuisine_type)
        .where(Recipe.owner_id == current_user.id)
        .order_by(Recipe.created_at.desc())
        .limit(20)
    )
    recipes = result.all()
    if recipes:
        library_summary = [
            {"title": r.title, "cuisine_type": r.cuisine_type} for r in recipes
        ]

    # Build system prompt
    system_prompt = build_system_prompt(
        recipe_state=recipe_state,
        preferences=preferences,
        library_summary=library_summary,
    )

    # Truncate message history to last 20
    truncated_messages = truncate_message_history(request.messages)

    # Build full message list with system prompt
    llm_messages = [ChatMessage(role="system", content=system_prompt)]
    llm_messages.extend(truncated_messages)

    # Call LLM
    try:
        llm_client = LLMClient(
            model=settings.llm_model,
            temperature=settings.llm_temperature,
            max_tokens=settings.llm_max_tokens,
            timeout=settings.llm_timeout,
        )
        raw_response = await llm_client.complete(llm_messages)
    except LLMError as e:
        error_msg = str(e).lower()
        if "timeout" in error_msg:
            detail = "Service temporarily unavailable: request timed out"
        else:
            detail = "AI service unavailable"
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=detail,
        )

    # Parse response
    parsed = parse_chat_response(raw_response)

    # If parse had an error (malformed JSON), retry once
    if parsed.error:
        try:
            raw_response_retry = await llm_client.complete(llm_messages)
            parsed_retry = parse_chat_response(raw_response_retry)
            if not parsed_retry.error:
                parsed = parsed_retry
            else:
                # Both attempts failed - return graceful degradation
                return ChatResponse(
                    message=parsed.message or raw_response,
                    proposed_recipe=None,
                    error=parsed.error,
                )
        except LLMError:
            # Retry failed with LLM error - return first parse result
            return ChatResponse(
                message=parsed.message or raw_response,
                proposed_recipe=None,
                error=parsed.error,
            )

    return ChatResponse(
        message=parsed.message,
        proposed_recipe=parsed.proposed_recipe,
    )
