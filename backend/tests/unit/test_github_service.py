"""
Unit Tests for GitHub Service

Tests for creating GitHub issues from feedback submissions.
These test pure functions (title/body building) and the GitHub API integration
(with mocked httpx).

TDD Note: These tests are written before app/services/github_service.py exists.
They will fail initially - that's the RED phase of TDD.
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from app.services.github_service import (
    build_issue_title,
    build_issue_body,
    create_github_issue,
)


class TestBuildIssueTitle:
    """Tests for build_issue_title helper."""

    def test_short_message_used_as_is(self):
        """Message under 60 chars is returned exactly."""
        msg = "Button is broken on mobile"
        assert build_issue_title(msg) == msg

    def test_exactly_60_chars_no_ellipsis(self):
        """Message exactly 60 chars has no ellipsis."""
        msg = "A" * 60
        result = build_issue_title(msg)
        assert result == msg
        assert "..." not in result

    def test_long_message_trimmed_at_word_boundary(self):
        """Message over 60 chars is trimmed at word boundary with ellipsis."""
        msg = "The feedback button does not appear correctly when the screen is very small"
        result = build_issue_title(msg)
        assert len(result) <= 63  # 60 + "..."
        assert result.endswith("...")
        # Should not cut mid-word
        without_ellipsis = result[:-3]
        assert not without_ellipsis.endswith(" ")  # no trailing space before ellipsis
        # Each word should be complete
        assert without_ellipsis == without_ellipsis.rstrip()

    def test_leading_trailing_whitespace_trimmed(self):
        """Leading and trailing whitespace is stripped."""
        msg = "   Some feedback message   "
        result = build_issue_title(msg)
        assert result == "Some feedback message"

    def test_long_message_with_whitespace_trimmed_first(self):
        """Whitespace is trimmed before length check."""
        msg = "   " + "a " * 40  # Long message with leading spaces
        result = build_issue_title(msg)
        assert not result.startswith(" ")


class TestBuildIssueBody:
    """Tests for build_issue_body helper."""

    def test_includes_all_metadata_fields(self):
        """Body includes message, page_url, user_agent, timestamp in markdown."""
        body = build_issue_body(
            message="Something is broken",
            page_url="/recipes/123",
            user_agent="Mozilla/5.0",
            timestamp="2026-02-01T12:00:00",
        )
        assert "Something is broken" in body
        assert "/recipes/123" in body
        assert "Mozilla/5.0" in body
        assert "2026-02-01T12:00:00" in body

    def test_with_screenshot_includes_details_section(self):
        """When screenshot is provided, body includes collapsible <details> section."""
        body = build_issue_body(
            message="Bug with screenshot",
            page_url="/home",
            user_agent="TestAgent",
            timestamp="2026-02-01T12:00:00",
            screenshot="data:image/png;base64,abc123",
        )
        assert "<details>" in body
        assert "data:image/png;base64,abc123" in body

    def test_without_screenshot_no_details_section(self):
        """When no screenshot, body omits <details> section entirely."""
        body = build_issue_body(
            message="Bug without screenshot",
            page_url="/home",
            user_agent="TestAgent",
            timestamp="2026-02-01T12:00:00",
        )
        assert "<details>" not in body

    def test_without_screenshot_none_no_details(self):
        """Explicitly passing screenshot=None omits <details>."""
        body = build_issue_body(
            message="Bug",
            page_url="/home",
            user_agent="TestAgent",
            timestamp="2026-02-01T12:00:00",
            screenshot=None,
        )
        assert "<details>" not in body


class TestCreateGitHubIssue:
    """Tests for create_github_issue async function."""

    @pytest.mark.asyncio
    async def test_sends_correct_post_to_github_api(self):
        """create_github_issue sends POST to correct GitHub API endpoint."""
        mock_response = MagicMock()
        mock_response.status_code = 201
        mock_response.json.return_value = {
            "html_url": "https://github.com/owner/repo/issues/42"
        }

        with patch("app.services.github_service.httpx.AsyncClient") as MockClient:
            mock_client_instance = AsyncMock()
            mock_client_instance.post.return_value = mock_response
            MockClient.return_value.__aenter__ = AsyncMock(
                return_value=mock_client_instance
            )
            MockClient.return_value.__aexit__ = AsyncMock(return_value=False)

            await create_github_issue(
                title="Test issue",
                body="Test body",
                pat="ghp_testtoken",
                repo="owner/repo",
            )

            mock_client_instance.post.assert_called_once()
            call_args = mock_client_instance.post.call_args
            assert "repos/owner/repo/issues" in call_args[0][0]
            payload = call_args[1].get("json") or call_args[0][1]
            assert payload["title"] == "Test issue"
            assert payload["body"] == "Test body"

    @pytest.mark.asyncio
    async def test_request_includes_feedback_label(self):
        """The POST request includes 'feedback' in the labels."""
        mock_response = MagicMock()
        mock_response.status_code = 201
        mock_response.json.return_value = {
            "html_url": "https://github.com/owner/repo/issues/1"
        }

        with patch("app.services.github_service.httpx.AsyncClient") as MockClient:
            mock_client_instance = AsyncMock()
            mock_client_instance.post.return_value = mock_response
            MockClient.return_value.__aenter__ = AsyncMock(
                return_value=mock_client_instance
            )
            MockClient.return_value.__aexit__ = AsyncMock(return_value=False)

            await create_github_issue(
                title="Test",
                body="Body",
                pat="ghp_testtoken",
                repo="owner/repo",
            )

            call_args = mock_client_instance.post.call_args
            payload = call_args[1].get("json") or call_args[0][1]
            assert "feedback" in payload["labels"]

    @pytest.mark.asyncio
    async def test_returns_issue_url_on_success(self):
        """Returns html_url from GitHub response on success."""
        expected_url = "https://github.com/owner/repo/issues/42"
        mock_response = MagicMock()
        mock_response.status_code = 201
        mock_response.json.return_value = {"html_url": expected_url}

        with patch("app.services.github_service.httpx.AsyncClient") as MockClient:
            mock_client_instance = AsyncMock()
            mock_client_instance.post.return_value = mock_response
            MockClient.return_value.__aenter__ = AsyncMock(
                return_value=mock_client_instance
            )
            MockClient.return_value.__aexit__ = AsyncMock(return_value=False)

            result = await create_github_issue(
                title="Test",
                body="Body",
                pat="ghp_testtoken",
                repo="owner/repo",
            )

            assert result == expected_url

    @pytest.mark.asyncio
    async def test_returns_none_on_api_failure(self):
        """Returns None when GitHub API returns non-201 status (doesn't raise)."""
        mock_response = MagicMock()
        mock_response.status_code = 422
        mock_response.json.return_value = {"message": "Validation Failed"}

        with patch("app.services.github_service.httpx.AsyncClient") as MockClient:
            mock_client_instance = AsyncMock()
            mock_client_instance.post.return_value = mock_response
            MockClient.return_value.__aenter__ = AsyncMock(
                return_value=mock_client_instance
            )
            MockClient.return_value.__aexit__ = AsyncMock(return_value=False)

            result = await create_github_issue(
                title="Test",
                body="Body",
                pat="ghp_testtoken",
                repo="owner/repo",
            )

            assert result is None

    @pytest.mark.asyncio
    async def test_returns_none_on_exception(self):
        """Returns None when an exception occurs (network error, etc.)."""
        with patch("app.services.github_service.httpx.AsyncClient") as MockClient:
            mock_client_instance = AsyncMock()
            mock_client_instance.post.side_effect = Exception("Connection refused")
            MockClient.return_value.__aenter__ = AsyncMock(
                return_value=mock_client_instance
            )
            MockClient.return_value.__aexit__ = AsyncMock(return_value=False)

            result = await create_github_issue(
                title="Test",
                body="Body",
                pat="ghp_testtoken",
                repo="owner/repo",
            )

            assert result is None
