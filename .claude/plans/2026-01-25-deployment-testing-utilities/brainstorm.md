# Brainstorm: Beta Testing Deployment & Testing Utilities

**Date:** 2026-01-25
**Branch:** `feature/deployment-testing-utilities`

---

## Problem / Motivation

Deploy the CookingAssistant app for beta testing with a small group of users (2-5 friends/family). This requires:

1. A deployment strategy that works with the app's architecture (FastAPI + React + Ollama for LLM)
2. A way to collect feedback from beta testers
3. Dummy data tooling for local development and testing

---

## Key Decisions

### Deployment Architecture

**Platform:** Fly.io (free tier)
- No cold starts on free tier
- Good SQLite support with Fly Volumes
- Container-based with Dockerfile

**Split Architecture:**
```
┌─────────────────────────────────────────────────┐
│  Fly.io                                         │
│  ┌─────────────┐    ┌─────────────────────────┐ │
│  │  Frontend   │────│  Backend (FastAPI)      │ │
│  │  (React)    │    │  LLM_MODEL=ollama/...   │ │
│  └─────────────┘    └───────────┬─────────────┘ │
└─────────────────────────────────┼───────────────┘
                                  │ HTTPS
                    ┌─────────────▼─────────────┐
                    │  Cloudflare Tunnel        │
                    │  (protected by CF Access) │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │  Local Machine (Ollama)   │
                    │  localhost:11434          │
                    └───────────────────────────┘
```

**Rationale:**
- Ollama requires significant resources (4-8GB RAM) that free PaaS tiers don't provide
- Running Ollama locally keeps LLM costs at zero
- Cloudflare Tunnel exposes local Ollama securely without port forwarding
- LiteLLM abstraction allows swapping to Anthropic/OpenAI later via env var change

**Database:** SQLite with Fly Volumes
- Fly machines are ephemeral; volumes provide persistence across deploys
- Simpler than migrating to PostgreSQL for a small beta

**LLM Flexibility:**
- Current: `LLM_MODEL=ollama/llama3` + `OLLAMA_API_BASE=https://tunnel.domain.com`
- Future: `LLM_MODEL=claude-3-5-sonnet-20241022` + `ANTHROPIC_API_KEY=sk-...`
- No code changes required, just env var swap

---

### Security & Access

**Tunnel Security:** Cloudflare Access
- Requires auth token to access Ollama endpoint
- Prevents unauthorized use of compute resources
- Backend stores CF Access token in env var

**AI Fallback:** Friendly error message
- When Ollama unreachable (machine off, tunnel down): "AI features temporarily unavailable"
- App remains functional for non-AI features

**Beta Access:** Open registration
- Anyone can sign up (acceptable for small beta)
- No invite codes or allowlists

---

### Deployment Workflow

**Trigger:** GitHub Release/tag
- Merge PRs to `main` freely (no auto-deploy)
- Create GitHub Release (e.g., `v0.1.0`) to trigger deployment
- Provides version history and release notes

**Migrations:** Auto-run on deploy
- `alembic upgrade head` runs as part of deploy process
- Supported by local `/migrate` skill for development

**Monitoring:** Fly.io logs + Sentry
- Fly logs for general debugging (`fly logs`)
- Sentry free tier (5K errors/month) for exception tracking
- Catches errors that would otherwise go unnoticed

---

### Feedback Collection

**Method:** In-app feedback widget
- Data stored in app's database (new `Feedback` model)
- No external services (Google Forms, etc.)

**UI:**
- Floating button always visible in corner of app
- Click opens modal with simple form
- Minimal friction: just a text area for message

**Auto-captured context:**
- Current page URL
- User ID (if logged in)
- Timestamp
- Browser/device info (User-Agent)

**Form fields:** Message only
- Free-text field, no dropdowns or categories
- Covers bugs, usability, and feature ideas

**Notifications:** Manual database check
- Query feedback table when ready to review
- No email/Slack notifications (overkill for 2-5 testers)

---

### Dummy Data / Seeding

**Purpose:** Local development only
- Demo the app during development
- Test edge cases (many recipes, long text, special characters)
- Quick reset to known state while coding
- NOT used for beta testers (they start with empty accounts)

**Volume:** 50-100 recipes
- Enough variety to test pagination, search, filtering
- Mix of cuisines, difficulties, dietary tags

**Format:** Static JSON fixtures
- Version-controlled in repo
- Reproducible across machines
- Can be curated for realistic content

**Trigger:** CLI script
- `python scripts/seed_data.py` or similar
- Run manually after `alembic upgrade head`
- Optional `--reset` flag to wipe and re-seed

**Test User:**
- Seed script creates user with known credentials
- Shared with developer for local testing
- e.g., `testuser` / `testpassword123`

---

## Reviewer Questions & Answers

Independent review surfaced these questions:

| Question | Answer |
|----------|--------|
| SQLite persistence on Fly.io? | Fly Volumes (persistent disk) |
| Ollama tunnel authentication? | Cloudflare Access (auth token) |
| AI fallback when Ollama down? | Friendly error message |
| Beta user access control? | Open registration |
| Feedback notifications? | Manual database check |
| Deployment trigger? | GitHub Release/tag |
| Auto-run migrations? | Yes, on deploy |
| Error tracking? | Sentry free tier |
| Seed data test user? | Yes, known credentials for local dev |

---

## Open Questions

None — all implementation-blocking questions resolved.

---

## Next Steps

Run `/plan` to structure this brainstorm into TDD-ready implementation tasks.
