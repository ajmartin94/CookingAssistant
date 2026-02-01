"""
Integration Tests for Feedback API

Tests for submitting and retrieving user feedback.
Feedback can be submitted anonymously or by authenticated users.

TDD Note: These tests are written before the Feedback model and API routes exist.
They will fail initially - that's the RED phase of TDD.
"""

import pytest
from unittest.mock import patch, AsyncMock
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
    async def test_create_feedback_with_screenshot(
        self,
        client: AsyncClient,
        test_db: AsyncSession,
    ):
        """Submit feedback with a screenshot base64 string stores it in DB."""
        from app.models.feedback import Feedback

        fake_screenshot = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg=="

        # ACTION: POST feedback with screenshot
        response = await client.post(
            "/api/v1/feedback",
            json={
                "message": "Bug report with screenshot attached for context.",
                "page_url": "/recipes/456",
                "screenshot": fake_screenshot,
            },
        )

        # VERIFY: Response
        assert response.status_code == 201
        data = response.json()
        assert data["screenshot"] == fake_screenshot

        # OUTCOME: Verify in database
        feedback = await test_db.get(Feedback, data["id"])
        assert feedback is not None
        assert feedback.screenshot == fake_screenshot

    @pytest.mark.asyncio
    async def test_create_feedback_without_screenshot(
        self,
        client: AsyncClient,
        test_db: AsyncSession,
    ):
        """Submit feedback without screenshot field still works, screenshot is null."""
        from app.models.feedback import Feedback

        response = await client.post(
            "/api/v1/feedback",
            json={
                "message": "Feedback without any screenshot attached here.",
                "page_url": "/recipes/789",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["screenshot"] is None

        # OUTCOME: Verify in database
        feedback = await test_db.get(Feedback, data["id"])
        assert feedback is not None
        assert feedback.screenshot is None

    @pytest.mark.asyncio
    async def test_create_feedback_response_includes_github_issue_url(
        self,
        client: AsyncClient,
    ):
        """FeedbackResponse includes github_issue_url field, null by default."""
        response = await client.post(
            "/api/v1/feedback",
            json={
                "message": "Feedback to verify github issue url in response.",
                "page_url": "/home",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert "github_issue_url" in data
        assert data["github_issue_url"] is None

    @pytest.mark.asyncio
    async def test_create_feedback_screenshot_large_base64(
        self,
        client: AsyncClient,
        test_db: AsyncSession,
    ):
        """Screenshot field accepts large base64 strings (no length limit)."""
        from app.models.feedback import Feedback

        # Simulate a large screenshot (~100KB base64)
        large_screenshot = "data:image/png;base64," + "A" * 100_000

        response = await client.post(
            "/api/v1/feedback",
            json={
                "message": "Feedback with a very large screenshot base64 string.",
                "page_url": "/settings",
                "screenshot": large_screenshot,
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["screenshot"] == large_screenshot

        # OUTCOME: Verify full string stored in database
        feedback = await test_db.get(Feedback, data["id"])
        assert feedback is not None
        assert feedback.screenshot == large_screenshot

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


class TestFeedbackGitHubIntegration:
    """Tests for GitHub issue creation triggered by feedback submission.

    These tests mock at the external boundary (httpx calls to GitHub API)
    and verify outcomes in the database. No internal wiring is mocked.
    """

    @pytest.mark.asyncio
    async def test_feedback_creates_github_issue_when_configured(
        self,
        client: AsyncClient,
        test_db: AsyncSession,
        monkeypatch,
    ):
        """When GITHUB_PAT and GITHUB_REPO are set, submitting feedback creates
        a GitHub issue and stores the issue URL in the database."""
        from app.models.feedback import Feedback
        from unittest.mock import MagicMock
        from contextlib import asynccontextmanager

        expected_url = "https://github.com/owner/repo/issues/42"

        # Configure GitHub settings via environment variables
        monkeypatch.setenv("GITHUB_PAT", "ghp_testtoken")
        monkeypatch.setenv("GITHUB_REPO", "owner/repo")

        # Re-initialize settings so env vars take effect
        from app.config import Settings

        test_settings = Settings()
        monkeypatch.setattr("app.config.settings", test_settings)
        monkeypatch.setattr("app.api.feedback.settings", test_settings)

        # Patch AsyncSessionLocal so background task uses the test DB session
        @asynccontextmanager
        async def mock_session_local():
            yield test_db

        monkeypatch.setattr("app.api.feedback.AsyncSessionLocal", mock_session_local)

        # Mock at the httpx boundary - the actual HTTP call to GitHub
        mock_response = MagicMock()
        mock_response.status_code = 201
        mock_response.json.return_value = {"html_url": expected_url}

        mock_client_instance = AsyncMock()
        mock_client_instance.post.return_value = mock_response

        with patch("app.services.github_service.httpx.AsyncClient") as MockClient:
            MockClient.return_value.__aenter__ = AsyncMock(
                return_value=mock_client_instance
            )
            MockClient.return_value.__aexit__ = AsyncMock(return_value=False)

            response = await client.post(
                "/api/v1/feedback",
                json={
                    "message": "This feedback should trigger a GitHub issue creation.",
                    "page_url": "/recipes/123",
                },
            )

        assert response.status_code == 201
        feedback_id = response.json()["id"]

        # OUTCOME: Verify github_issue_url is populated in database
        test_db.expire_all()
        feedback = await test_db.get(Feedback, feedback_id)
        assert feedback is not None
        assert feedback.github_issue_url == expected_url

    @pytest.mark.asyncio
    async def test_feedback_skips_github_when_not_configured(
        self,
        client: AsyncClient,
        test_db: AsyncSession,
        monkeypatch,
    ):
        """When GITHUB_PAT and GITHUB_REPO are not set, feedback is created
        but github_issue_url stays null. No HTTP call is made."""
        from app.models.feedback import Feedback

        # Ensure GitHub settings are empty (the default)
        monkeypatch.delenv("GITHUB_PAT", raising=False)
        monkeypatch.delenv("GITHUB_REPO", raising=False)

        from app.config import Settings

        test_settings = Settings()
        monkeypatch.setattr("app.config.settings", test_settings)

        with patch("app.services.github_service.httpx.AsyncClient") as MockClient:
            response = await client.post(
                "/api/v1/feedback",
                json={
                    "message": "This feedback should not trigger GitHub issue.",
                    "page_url": "/home",
                },
            )

            assert response.status_code == 201
            feedback_id = response.json()["id"]

            # OUTCOME: No GitHub call was made
            MockClient.assert_not_called()

        # OUTCOME: github_issue_url remains null in database
        feedback = await test_db.get(Feedback, feedback_id)
        assert feedback is not None
        assert feedback.github_issue_url is None

    @pytest.mark.asyncio
    async def test_github_issue_url_populated_in_db_on_success(
        self,
        client: AsyncClient,
        test_db: AsyncSession,
        monkeypatch,
    ):
        """After successful GitHub issue creation, the feedback record in DB
        has github_issue_url set to the issue URL from GitHub's response."""
        from app.models.feedback import Feedback
        from unittest.mock import MagicMock
        from contextlib import asynccontextmanager

        expected_url = "https://github.com/owner/repo/issues/99"

        monkeypatch.setenv("GITHUB_PAT", "ghp_testtoken")
        monkeypatch.setenv("GITHUB_REPO", "owner/repo")

        from app.config import Settings

        test_settings = Settings()
        monkeypatch.setattr("app.config.settings", test_settings)
        monkeypatch.setattr("app.api.feedback.settings", test_settings)

        # Patch AsyncSessionLocal so background task uses the test DB session
        @asynccontextmanager
        async def mock_session_local():
            yield test_db

        monkeypatch.setattr("app.api.feedback.AsyncSessionLocal", mock_session_local)

        mock_response = MagicMock()
        mock_response.status_code = 201
        mock_response.json.return_value = {"html_url": expected_url}

        mock_client_instance = AsyncMock()
        mock_client_instance.post.return_value = mock_response

        with patch("app.services.github_service.httpx.AsyncClient") as MockClient:
            MockClient.return_value.__aenter__ = AsyncMock(
                return_value=mock_client_instance
            )
            MockClient.return_value.__aexit__ = AsyncMock(return_value=False)

            response = await client.post(
                "/api/v1/feedback",
                json={
                    "message": "Feedback that will get a GitHub issue URL back.",
                    "page_url": "/settings",
                },
            )

        assert response.status_code == 201
        feedback_id = response.json()["id"]

        # OUTCOME: Verify the DB record has the URL
        test_db.expire_all()
        feedback = await test_db.get(Feedback, feedback_id)
        assert feedback is not None
        assert feedback.github_issue_url == expected_url

    @pytest.mark.asyncio
    async def test_github_issue_url_null_in_db_on_api_failure(
        self,
        client: AsyncClient,
        test_db: AsyncSession,
        monkeypatch,
    ):
        """When GitHub API returns an error, github_issue_url remains null in DB."""
        from app.models.feedback import Feedback
        from unittest.mock import MagicMock

        monkeypatch.setenv("GITHUB_PAT", "ghp_testtoken")
        monkeypatch.setenv("GITHUB_REPO", "owner/repo")

        from app.config import Settings

        test_settings = Settings()
        monkeypatch.setattr("app.config.settings", test_settings)

        # GitHub API returns 422 error
        mock_response = MagicMock()
        mock_response.status_code = 422
        mock_response.json.return_value = {"message": "Validation Failed"}

        mock_client_instance = AsyncMock()
        mock_client_instance.post.return_value = mock_response

        with patch("app.services.github_service.httpx.AsyncClient") as MockClient:
            MockClient.return_value.__aenter__ = AsyncMock(
                return_value=mock_client_instance
            )
            MockClient.return_value.__aexit__ = AsyncMock(return_value=False)

            response = await client.post(
                "/api/v1/feedback",
                json={
                    "message": "Feedback where GitHub creation will fail silently.",
                    "page_url": "/about",
                },
            )

        assert response.status_code == 201
        feedback_id = response.json()["id"]

        # OUTCOME: github_issue_url is still null in database
        feedback = await test_db.get(Feedback, feedback_id)
        assert feedback is not None
        assert feedback.github_issue_url is None
