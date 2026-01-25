"""
Unit Tests for Chat Service

Tests for chat service context assembly and message history truncation.
These are pure logic tests that don't require a database or HTTP client.
"""

import pytest

from app.ai.schemas import ChatMessage


# --- Context Assembly Tests ---


@pytest.mark.asyncio
async def test_chat_service_assembles_correct_context():
    """Chat service assembles system prompt context from user data."""
    from app.services.chat_service import build_chat_context

    user_preferences = {
        "dietary_tags": ["vegetarian", "gluten-free"],
        "skill_level": "intermediate",
    }
    current_recipe = {
        "title": "Pasta Primavera",
        "ingredients": [
            {"name": "pasta", "amount": "200", "unit": "g"},
            {"name": "vegetables", "amount": "300", "unit": "g"},
        ],
        "instructions": [
            {"step_number": 1, "instruction": "Boil pasta"},
        ],
    }
    library_summary = [
        {"title": "Chocolate Cake", "cuisine_type": "American"},
        {"title": "Pad Thai", "cuisine_type": "Thai"},
    ]

    context = build_chat_context(
        preferences=user_preferences,
        current_recipe=current_recipe,
        library_summary=library_summary,
    )

    # Context should be a string containing all relevant sections
    assert isinstance(context, str)
    assert "vegetarian" in context
    assert "gluten-free" in context
    assert "intermediate" in context
    assert "Pasta Primavera" in context
    assert "Chocolate Cake" in context
    assert "Pad Thai" in context


# --- Message Truncation Tests ---


@pytest.mark.asyncio
async def test_chat_service_truncates_to_last_20_messages():
    """Chat service truncates message history to last 20 user/assistant messages."""
    from app.services.chat_service import truncate_message_history

    # Create 30 user/assistant messages
    messages = []
    for i in range(30):
        role = "user" if i % 2 == 0 else "assistant"
        messages.append(ChatMessage(role=role, content=f"Message {i}"))

    truncated = truncate_message_history(messages)

    # Should keep only last 20 messages
    assert len(truncated) == 20
    # The last message should be the same as the original last
    assert truncated[-1].content == "Message 29"
    # The first retained message should be message 10 (30 - 20 = 10)
    assert truncated[0].content == "Message 10"
