"""
Feedback API

API endpoints for submitting and retrieving user feedback.
Feedback can be submitted anonymously or by authenticated users.
"""

from typing import Annotated, Optional
from fastapi import APIRouter, Depends, Request, Query, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.feedback import Feedback
from app.models.user import User
from app.schemas.feedback import (
    FeedbackCreate,
    FeedbackResponse,
    FeedbackListResponse,
)
from app.services.auth_service import decode_access_token, get_user_by_username

router = APIRouter(prefix="/feedback", tags=["feedback"])

# Optional OAuth2 scheme - doesn't require auth but accepts it
oauth2_scheme_optional = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login", auto_error=False
)


async def get_optional_user(
    token: Annotated[Optional[str], Depends(oauth2_scheme_optional)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Optional[User]:
    """
    Get the current user if authenticated, None otherwise.

    This dependency allows both authenticated and unauthenticated requests.
    """
    if token is None:
        return None

    token_data = decode_access_token(token)
    if token_data is None or token_data.username is None:
        return None

    user = await get_user_by_username(db, username=token_data.username)
    return user


@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
async def create_feedback(
    feedback_create: FeedbackCreate,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[User], Depends(get_optional_user)],
):
    """
    Submit user feedback.

    - **message**: Feedback message (10-2000 characters)
    - **page_url**: The page URL where feedback was submitted

    User-Agent is captured automatically from the request header.
    If authenticated, user_id is captured; otherwise it's null.
    """
    user_agent = request.headers.get("User-Agent")
    user_id = current_user.id if current_user else None

    feedback = Feedback(
        message=feedback_create.message,
        page_url=feedback_create.page_url,
        user_agent=user_agent,
        user_id=user_id,
    )

    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)

    return feedback


@router.get("", response_model=FeedbackListResponse)
async def list_feedback(
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=100, description="Number of items to return"),
):
    """
    List all feedback with pagination.

    - **skip**: Number of items to skip (default: 0)
    - **limit**: Number of items to return (default: 100, max: 100)
    """
    result = await db.execute(
        select(Feedback).order_by(Feedback.created_at.desc()).offset(skip).limit(limit)
    )
    feedback_list = result.scalars().all()

    return FeedbackListResponse(
        items=[FeedbackResponse.model_validate(f) for f in feedback_list]
    )
