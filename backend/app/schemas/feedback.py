"""
Feedback Schemas

Pydantic schemas for feedback API request/response validation.
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

from app.models.feedback import FeedbackRating


class FeedbackCreate(BaseModel):
    """Schema for creating feedback."""

    message_id: str = Field(
        ..., min_length=1, max_length=255, description="ID of the message being rated"
    )
    rating: FeedbackRating = Field(..., description="Rating: 'up' or 'down'")
    comment: Optional[str] = Field(
        None, max_length=2000, description="Optional feedback comment"
    )


class FeedbackResponse(BaseModel):
    """Schema for feedback response."""

    id: str
    message_id: str
    rating: FeedbackRating
    comment: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
