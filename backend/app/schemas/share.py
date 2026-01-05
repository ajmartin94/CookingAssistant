"""
Share Schemas

Pydantic schemas for recipe/library sharing data validation and serialization.
"""

from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from app.models.share import SharePermission


class ShareCreate(BaseModel):
    """Schema for creating a new share"""

    recipe_id: Optional[str] = None
    library_id: Optional[str] = None
    shared_with_id: Optional[str] = None  # None for public shares
    permission: SharePermission = SharePermission.VIEW
    expires_at: Optional[datetime] = None

    def model_post_init(self, __context):
        """Validate that exactly one of recipe_id or library_id is set"""
        if not self.recipe_id and not self.library_id:
            raise ValueError("Either recipe_id or library_id must be provided")
        if self.recipe_id and self.library_id:
            raise ValueError("Cannot share both recipe and library simultaneously")


class ShareResponse(BaseModel):
    """Schema for share API responses"""

    id: str
    recipe_id: Optional[str]
    library_id: Optional[str]
    shared_by_id: str
    shared_with_id: Optional[str]
    share_token: str
    permission: SharePermission
    expires_at: Optional[datetime]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ShareTokenResponse(BaseModel):
    """Schema for share token response"""

    share_token: str
    share_url: str
    expires_at: Optional[datetime]
