"""
Feedback Schemas

Pydantic schemas for feedback data validation and serialization.
"""

from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional


class FeedbackCreate(BaseModel):
    """Schema for creating feedback"""

    message: str = Field(..., min_length=10, max_length=2000)
    page_url: str = Field(..., max_length=500)


class FeedbackResponse(BaseModel):
    """Schema for feedback API responses"""

    id: str
    message: str
    page_url: str
    user_agent: Optional[str]
    user_id: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FeedbackListResponse(BaseModel):
    """Schema for paginated feedback list responses"""

    items: list[FeedbackResponse]
