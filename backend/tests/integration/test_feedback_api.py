"""
Integration Tests for Feedback API

TDD tests for AI chat feedback collection (thumbs up/down).
These tests are written before implementation (red phase).

Tests cover:
- POST /api/v1/chat/feedback (submit feedback)
- GET /api/v1/chat/feedback/{message_id} (get feedback for a message)
- Feedback storage and retrieval
- Authentication requirements
- Validation (rating enum, optional comment)
"""

import pytest
from httpx import AsyncClient


# =============================================================================
# POST /api/v1/chat/feedback - Submit Feedback Tests
# =============================================================================


@pytest.mark.asyncio
async def test_submit_feedback_thumbs_up(client: AsyncClient, auth_headers, test_user):
    """Test submitting positive feedback (thumbs up)."""
    response = await client.post(
        "/api/v1/chat/feedback",
        headers=auth_headers,
        json={
            "message_id": "msg_123",
            "rating": "up",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["message_id"] == "msg_123"
    assert data["rating"] == "up"
    assert data["comment"] is None


@pytest.mark.asyncio
async def test_submit_feedback_thumbs_down(
    client: AsyncClient, auth_headers, test_user
):
    """Test submitting negative feedback (thumbs down)."""
    response = await client.post(
        "/api/v1/chat/feedback",
        headers=auth_headers,
        json={
            "message_id": "msg_456",
            "rating": "down",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["message_id"] == "msg_456"
    assert data["rating"] == "down"


@pytest.mark.asyncio
async def test_submit_feedback_with_comment(
    client: AsyncClient, auth_headers, test_user
):
    """Test submitting feedback with optional comment."""
    response = await client.post(
        "/api/v1/chat/feedback",
        headers=auth_headers,
        json={
            "message_id": "msg_789",
            "rating": "down",
            "comment": "The recipe instructions were confusing",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["message_id"] == "msg_789"
    assert data["rating"] == "down"
    assert data["comment"] == "The recipe instructions were confusing"


@pytest.mark.asyncio
async def test_submit_feedback_unauthenticated(client: AsyncClient):
    """Test submitting feedback without authentication."""
    response = await client.post(
        "/api/v1/chat/feedback",
        json={
            "message_id": "msg_123",
            "rating": "up",
        },
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_submit_feedback_missing_message_id(client: AsyncClient, auth_headers):
    """Test submitting feedback without message_id."""
    response = await client.post(
        "/api/v1/chat/feedback",
        headers=auth_headers,
        json={
            "rating": "up",
        },
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_submit_feedback_missing_rating(client: AsyncClient, auth_headers):
    """Test submitting feedback without rating."""
    response = await client.post(
        "/api/v1/chat/feedback",
        headers=auth_headers,
        json={
            "message_id": "msg_123",
        },
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_submit_feedback_invalid_rating(client: AsyncClient, auth_headers):
    """Test submitting feedback with invalid rating value."""
    response = await client.post(
        "/api/v1/chat/feedback",
        headers=auth_headers,
        json={
            "message_id": "msg_123",
            "rating": "maybe",  # Invalid - should be 'up' or 'down'
        },
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_submit_feedback_empty_message_id(client: AsyncClient, auth_headers):
    """Test submitting feedback with empty message_id."""
    response = await client.post(
        "/api/v1/chat/feedback",
        headers=auth_headers,
        json={
            "message_id": "",
            "rating": "up",
        },
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_submit_feedback_comment_too_long(client: AsyncClient, auth_headers):
    """Test submitting feedback with excessively long comment."""
    long_comment = "x" * 2001  # Over 2000 char limit
    response = await client.post(
        "/api/v1/chat/feedback",
        headers=auth_headers,
        json={
            "message_id": "msg_123",
            "rating": "down",
            "comment": long_comment,
        },
    )

    assert response.status_code == 422


# =============================================================================
# Feedback Update/Replace Tests
# =============================================================================


@pytest.mark.asyncio
async def test_update_feedback_changes_rating(
    client: AsyncClient, auth_headers, test_user
):
    """Test that submitting feedback for same message updates existing feedback."""
    # First submission
    response1 = await client.post(
        "/api/v1/chat/feedback",
        headers=auth_headers,
        json={
            "message_id": "msg_update_test",
            "rating": "up",
        },
    )
    assert response1.status_code == 201

    # Second submission for same message - should update
    response2 = await client.post(
        "/api/v1/chat/feedback",
        headers=auth_headers,
        json={
            "message_id": "msg_update_test",
            "rating": "down",
            "comment": "Changed my mind",
        },
    )

    # Could be 200 (updated) or 201 (replaced) depending on implementation
    assert response2.status_code in [200, 201]
    data = response2.json()
    assert data["rating"] == "down"
    assert data["comment"] == "Changed my mind"


# =============================================================================
# GET /api/v1/chat/feedback/{message_id} - Retrieve Feedback Tests
# =============================================================================


@pytest.mark.asyncio
async def test_get_feedback_for_message(client: AsyncClient, auth_headers, test_user):
    """Test retrieving feedback for a specific message."""
    # First submit feedback
    await client.post(
        "/api/v1/chat/feedback",
        headers=auth_headers,
        json={
            "message_id": "msg_get_test",
            "rating": "up",
        },
    )

    # Then retrieve it
    response = await client.get(
        "/api/v1/chat/feedback/msg_get_test",
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["message_id"] == "msg_get_test"
    assert data["rating"] == "up"


@pytest.mark.asyncio
async def test_get_feedback_not_found(client: AsyncClient, auth_headers):
    """Test retrieving feedback for message with no feedback."""
    response = await client.get(
        "/api/v1/chat/feedback/nonexistent_msg",
        headers=auth_headers,
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_feedback_unauthenticated(client: AsyncClient):
    """Test retrieving feedback without authentication."""
    response = await client.get(
        "/api/v1/chat/feedback/msg_123",
    )

    assert response.status_code == 401


# =============================================================================
# Feedback Isolation Tests (User can only see own feedback)
# =============================================================================


@pytest.mark.asyncio
async def test_feedback_isolated_per_user(
    client: AsyncClient, auth_headers, test_user, db_session
):
    """Test that users can only see their own feedback."""
    # Submit feedback as test_user
    await client.post(
        "/api/v1/chat/feedback",
        headers=auth_headers,
        json={
            "message_id": "msg_isolation_test",
            "rating": "up",
        },
    )

    # Create another user and try to get the feedback
    from tests.utils.helpers import create_test_user, generate_auth_headers

    other_user = await create_test_user(
        db_session,
        username="other_user",
        email="other@example.com",
    )
    other_headers = generate_auth_headers(other_user)

    response = await client.get(
        "/api/v1/chat/feedback/msg_isolation_test",
        headers=other_headers,
    )

    # Other user should not see this feedback
    assert response.status_code == 404


# =============================================================================
# Feedback Storage Tests (via service layer)
# =============================================================================


@pytest.mark.asyncio
async def test_feedback_persists_across_requests(
    client: AsyncClient, auth_headers, test_user
):
    """Test that feedback is properly persisted to database."""
    # Submit feedback
    submit_response = await client.post(
        "/api/v1/chat/feedback",
        headers=auth_headers,
        json={
            "message_id": "msg_persist_test",
            "rating": "down",
            "comment": "Persisted comment",
        },
    )
    assert submit_response.status_code == 201

    # Retrieve feedback in new request
    get_response = await client.get(
        "/api/v1/chat/feedback/msg_persist_test",
        headers=auth_headers,
    )

    assert get_response.status_code == 200
    data = get_response.json()
    assert data["rating"] == "down"
    assert data["comment"] == "Persisted comment"


@pytest.mark.asyncio
async def test_feedback_includes_timestamp(
    client: AsyncClient, auth_headers, test_user
):
    """Test that feedback response includes creation timestamp."""
    response = await client.post(
        "/api/v1/chat/feedback",
        headers=auth_headers,
        json={
            "message_id": "msg_timestamp_test",
            "rating": "up",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert "created_at" in data
    # Timestamp should be a valid ISO format string
    assert "T" in data["created_at"]  # ISO format check
