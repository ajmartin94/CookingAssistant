"""
User Service

Business logic for user preference management.
"""

from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.user import UserPreferencesUpdate


async def update_user_preferences(
    db: AsyncSession,
    user: User,
    preferences: UserPreferencesUpdate,
) -> User:
    """
    Update user preference fields (partial update).

    Only fields explicitly provided in the request body are updated.
    Unset fields are left unchanged.

    Args:
        db: Database session
        user: Current authenticated user
        preferences: Preferences data (only set fields are applied)

    Returns:
        Updated user
    """
    update_data = preferences.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(user, key, value)

    # Explicitly bump updated_at for the partial update
    user.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(user)
    return user
