"""
GitHub Service

Creates GitHub issues from feedback submissions.
"""

import logging

import httpx

logger = logging.getLogger(__name__)


def build_issue_title(message: str) -> str:
    """Build a GitHub issue title from a feedback message.

    Strips whitespace, truncates at word boundary to 60 chars with ellipsis if needed.
    """
    message = message.strip()
    if len(message) <= 60:
        return message

    truncated = message[:60]
    # Find last space to avoid cutting mid-word
    last_space = truncated.rfind(" ")
    if last_space > 0:
        truncated = truncated[:last_space]
    truncated = truncated.rstrip()
    return truncated + "..."


def build_issue_body(
    message: str,
    page_url: str,
    user_agent: str,
    timestamp: str,
    screenshot: str | None = None,
) -> str:
    """Build a GitHub issue body in markdown format."""
    body = f"""## Feedback

{message}

## Metadata

- **Page URL:** {page_url}
- **User-Agent:** {user_agent}
- **Timestamp:** {timestamp}
"""

    if screenshot:
        body += f"""
<details>
<summary>Screenshot</summary>

![screenshot]({screenshot})

</details>
"""

    return body


async def create_github_issue(
    title: str,
    body: str,
    pat: str,
    repo: str,
) -> str | None:
    """Create a GitHub issue via the API. Returns the issue URL or None on failure."""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"https://api.github.com/repos/{repo}/issues",
                json={
                    "title": title,
                    "body": body,
                    "labels": ["feedback"],
                },
                headers={
                    "Authorization": f"Bearer {pat}",
                    "Accept": "application/vnd.github+json",
                },
            )

            if response.status_code == 201:
                return response.json()["html_url"]
            return None
    except Exception as e:
        logger.error("Failed to create GitHub issue: %s", e)
        return None
