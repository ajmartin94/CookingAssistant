"""
Feedback Service

Business logic for AI chat feedback operations.
"""

from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.feedback import ChatFeedback, FeedbackRating
from app.schemas.feedback import FeedbackCreate


async def create_or_update_feedback(
    db: AsyncSession,
    user_id: str,
    feedback_data: FeedbackCreate,
) -> ChatFeedback:
    """
    Create or update feedback for a message.

    If feedback already exists for this user/message combo, update it.
    Otherwise, create new feedback.

    Args:
        db: Database session
        user_id: ID of the user submitting feedback
        feedback_data: Feedback data from request

    Returns:
        ChatFeedback: Created or updated feedback
    """
    # Check if feedback already exists for this user/message
    existing = await get_feedback_by_message(
        db, user_id=user_id, message_id=feedback_data.message_id
    )

    if existing:
        # Update existing feedback
        existing.rating = feedback_data.rating
        existing.comment = feedback_data.comment
        await db.commit()
        await db.refresh(existing)
        return existing
    else:
        # Create new feedback
        feedback = ChatFeedback(
            user_id=user_id,
            message_id=feedback_data.message_id,
            rating=feedback_data.rating,
            comment=feedback_data.comment,
        )
        db.add(feedback)
        await db.commit()
        await db.refresh(feedback)
        return feedback


async def get_feedback_by_message(
    db: AsyncSession,
    user_id: str,
    message_id: str,
) -> Optional[ChatFeedback]:
    """
    Get feedback for a specific message by a specific user.

    Args:
        db: Database session
        user_id: ID of the user
        message_id: ID of the message

    Returns:
        ChatFeedback or None: Feedback if found, None otherwise
    """
    result = await db.execute(
        select(ChatFeedback).where(
            ChatFeedback.user_id == user_id,
            ChatFeedback.message_id == message_id,
        )
    )
    return result.scalar_one_or_none()


async def get_feedback_by_id(
    db: AsyncSession,
    feedback_id: str,
) -> Optional[ChatFeedback]:
    """
    Get feedback by its ID.

    Args:
        db: Database session
        feedback_id: ID of the feedback

    Returns:
        ChatFeedback or None: Feedback if found, None otherwise
    """
    result = await db.execute(
        select(ChatFeedback).where(ChatFeedback.id == feedback_id)
    )
    return result.scalar_one_or_none()
