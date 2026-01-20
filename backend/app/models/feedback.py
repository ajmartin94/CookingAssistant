"""
Feedback Model

Database model for AI chat feedback (thumbs up/down).
Used for quality tracking and building evaluation sets.
"""

from sqlalchemy import String, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime
import uuid
import enum

from app.database import Base


class FeedbackRating(str, enum.Enum):
    """Feedback rating enum."""

    UP = "up"
    DOWN = "down"


class ChatFeedback(Base):
    """Feedback model for AI chat messages."""

    __tablename__ = "chat_feedback"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    message_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    rating: Mapped[FeedbackRating] = mapped_column(
        SQLEnum(FeedbackRating), nullable=False
    )
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    user = relationship("User", backref="feedback")

    def __repr__(self) -> str:
        return f"<ChatFeedback(id={self.id}, message_id={self.message_id}, rating={self.rating})>"
