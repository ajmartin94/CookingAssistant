"""
Integration Tests for Feedback API

Tests for submitting and retrieving user feedback.
Feedback can be submitted anonymously or by authenticated users.

TDD Note: These tests are written before the Feedback model and API routes exist.
They will fail initially - that's the RED phase of TDD.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


class TestCreateFeedback:
    """Tests for POST /api/v1/feedback endpoint."""

    @pytest.mark.asyncio
    async def test_create_feedback_unauthenticated(
        self,
        client: AsyncClient,
        test_db: AsyncSession,
    ):
        """Unauthenticated user can submit feedback with user_id null."""
        # Import Feedback model lazily (will fail if model doesn't exist)
        from app.models.feedback import Feedback
        from sqlalchemy import select, func

        # 1. SETUP: Capture state before
        before_count = await test_db.scalar(select(func.count(Feedback.id)))

        # 2. ACTION: POST feedback without auth
        response = await client.post(
            "/api/v1/feedback",
            json={
                "message": "This is a test feedback message with sufficient length.",
                "page_url": "/recipes/123",
            },
        )

        # 3. VERIFY: Response
        assert response.status_code == 201
        data = response.json()
        assert (
            data["message"] == "This is a test feedback message with sufficient length."
        )
        assert data["page_url"] == "/recipes/123"
        assert data["user_id"] is None
        assert "id" in data
        assert "created_at" in data

        # 4. OUTCOME: Verify database state
        after_count = await test_db.scalar(select(func.count(Feedback.id)))
        assert after_count == before_count + 1

        # Verify the actual record
        feedback = await test_db.get(Feedback, data["id"])
        assert feedback is not None
        assert (
            feedback.message
            == "This is a test feedback message with sufficient length."
        )
        assert feedback.user_id is None

    @pytest.mark.asyncio
    async def test_create_feedback_authenticated(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_user,
        test_db: AsyncSession,
    ):
        """Authenticated user's ID is captured in feedback."""
        # Import Feedback model lazily
        from app.models.feedback import Feedback
        from sqlalchemy import select, func

        # 1. SETUP: Capture state before
        before_count = await test_db.scalar(select(func.count(Feedback.id)))

        # 2. ACTION: POST feedback with auth
        response = await client.post(
            "/api/v1/feedback",
            headers=auth_headers,
            json={
                "message": "Authenticated feedback message with enough characters.",
                "page_url": "/libraries",
            },
        )

        # 3. VERIFY: Response
        assert response.status_code == 201
        data = response.json()
        assert (
            data["message"] == "Authenticated feedback message with enough characters."
        )
        assert data["page_url"] == "/libraries"
        assert data["user_id"] == test_user.id

        # 4. OUTCOME: Verify database state
        after_count = await test_db.scalar(select(func.count(Feedback.id)))
        assert after_count == before_count + 1

        # Verify the actual record
        feedback = await test_db.get(Feedback, data["id"])
        assert feedback is not None
        assert feedback.user_id == test_user.id

    @pytest.mark.asyncio
    async def test_create_feedback_captures_user_agent(
        self,
        client: AsyncClient,
        test_db: AsyncSession,
    ):
        """User-Agent header is captured from the request."""
        # Import Feedback model lazily
        from app.models.feedback import Feedback

        custom_user_agent = "Mozilla/5.0 (Test Browser) AppleWebKit/537.36"

        # ACTION: POST with custom User-Agent header
        response = await client.post(
            "/api/v1/feedback",
            headers={"User-Agent": custom_user_agent},
            json={
                "message": "Feedback message to test user agent capture functionality.",
                "page_url": "/home",
            },
        )

        # VERIFY: Response
        assert response.status_code == 201
        data = response.json()
        assert data["user_agent"] == custom_user_agent

        # OUTCOME: Verify in database
        feedback = await test_db.get(Feedback, data["id"])
        assert feedback is not None
        assert feedback.user_agent == custom_user_agent

    @pytest.mark.asyncio
    async def test_create_feedback_validation_message_too_short(
        self,
        client: AsyncClient,
    ):
        """Message shorter than 10 characters returns 422 validation error."""
        response = await client.post(
            "/api/v1/feedback",
            json={
                "message": "Short",  # 5 characters, less than 10 minimum
                "page_url": "/recipes",
            },
        )

        assert response.status_code == 422
        error = response.json()
        # Verify the error mentions the message field
        assert "message" in str(error["detail"]).lower()

    @pytest.mark.asyncio
    async def test_create_feedback_validation_message_too_long(
        self,
        client: AsyncClient,
    ):
        """Message longer than 2000 characters returns 422 validation error."""
        long_message = "x" * 2001  # Exceeds 2000 character limit

        response = await client.post(
            "/api/v1/feedback",
            json={
                "message": long_message,
                "page_url": "/recipes",
            },
        )

        assert response.status_code == 422
        error = response.json()
        # Verify the error mentions the message field
        assert "message" in str(error["detail"]).lower()

    @pytest.mark.asyncio
    async def test_create_feedback_message_at_minimum_length(
        self,
        client: AsyncClient,
        test_db: AsyncSession,
    ):
        """Message exactly at 10 characters is accepted."""
        response = await client.post(
            "/api/v1/feedback",
            json={
                "message": "0123456789",  # Exactly 10 characters
                "page_url": "/test",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["message"] == "0123456789"

    @pytest.mark.asyncio
    async def test_create_feedback_message_at_maximum_length(
        self,
        client: AsyncClient,
        test_db: AsyncSession,
    ):
        """Message exactly at 2000 characters is accepted."""
        max_message = "x" * 2000  # Exactly 2000 characters

        response = await client.post(
            "/api/v1/feedback",
            json={
                "message": max_message,
                "page_url": "/test",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert len(data["message"]) == 2000


class TestListFeedback:
    """Tests for GET /api/v1/feedback endpoint."""

    @pytest.mark.asyncio
    async def test_list_feedback_returns_paginated_list(
        self,
        client: AsyncClient,
        test_db: AsyncSession,
    ):
        """GET /api/v1/feedback returns a paginated list of feedback."""
        # Import Feedback model lazily
        from app.models.feedback import Feedback

        # 1. SETUP: Create some feedback entries directly in DB
        for i in range(3):
            feedback = Feedback(
                message=f"Test feedback message number {i} with enough chars.",
                page_url=f"/page/{i}",
                user_agent="Test Agent",
                user_id=None,
            )
            test_db.add(feedback)
        await test_db.commit()

        # 2. ACTION: GET feedback list
        response = await client.get("/api/v1/feedback")

        # 3. VERIFY: Response structure
        assert response.status_code == 200
        data = response.json()

        # Paginated response should have items and pagination info
        assert "items" in data
        assert isinstance(data["items"], list)
        assert len(data["items"]) >= 3

        # Verify each item has expected fields
        for item in data["items"]:
            assert "id" in item
            assert "message" in item
            assert "page_url" in item
            assert "user_agent" in item
            assert "created_at" in item

    @pytest.mark.asyncio
    async def test_list_feedback_empty(
        self,
        client: AsyncClient,
    ):
        """GET /api/v1/feedback returns empty list when no feedback exists."""
        response = await client.get("/api/v1/feedback")

        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert data["items"] == []

    @pytest.mark.asyncio
    async def test_list_feedback_pagination_parameters(
        self,
        client: AsyncClient,
        test_db: AsyncSession,
    ):
        """GET /api/v1/feedback respects pagination parameters."""
        # Import Feedback model lazily
        from app.models.feedback import Feedback

        # SETUP: Create multiple feedback entries
        for i in range(15):
            feedback = Feedback(
                message=f"Paginated test feedback entry number {i} here.",
                page_url=f"/paginated/{i}",
                user_agent="Test Agent",
                user_id=None,
            )
            test_db.add(feedback)
        await test_db.commit()

        # ACTION: Request with pagination
        response = await client.get("/api/v1/feedback?skip=0&limit=5")

        # VERIFY: Only requested number of items returned
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 5
