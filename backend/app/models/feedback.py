"""
Feedback Model

Database model for storing user feedback.
"""

from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
import uuid

from app.database import Base


class Feedback(Base):
    """Feedback model for storing user-submitted feedback"""

    __tablename__ = "feedback"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    page_url: Mapped[str] = mapped_column(String(500), nullable=False)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    screenshot: Mapped[str | None] = mapped_column(Text, nullable=True)
    github_issue_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    user_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    def __repr__(self) -> str:
        return f"<Feedback(id={self.id}, user_id={self.user_id})>"
