# Plan: Beta Testing Deployment & Testing Utilities

## Overview

This plan prepares the CookingAssistant app for beta testing with 2-5 users. It covers:
- Seed data script for local development
- Feedback widget for beta tester input
- Deployment infrastructure (Fly.io + Sentry)

**TDD Rounds:** 6 features total

## Feature Order

1. **Seed Data Script** — No dependencies, enables local dev workflow
2. **Feedback Widget** — Backend + Frontend, full TDD
3. **Dockerfile** — Containerization (depends on nothing)
4. **Fly.io Config** — Deployment config (depends on Dockerfile)
5. **GitHub Actions CD** — Deploy workflow (depends on Fly.io Config)
6. **Sentry Integration** — Error tracking (can parallel with 3-5)

---

## Feature 1: Seed Data Script

### Summary

CLI script to populate the local database with a test user and 20 realistic recipes. Used for local development only — not for production beta users. Enables quick reset to known state while coding.

### Layers

Backend only (CLI script)

### Acceptance Criteria

- [ ] Running `python -m scripts.seed` creates a test user with credentials from `.env` (`SEED_USER_EMAIL`, `SEED_USER_PASSWORD`)
- [ ] Running the script creates exactly 20 recipes owned by the seed user
- [ ] Recipes have realistic data: varied cuisines, difficulties, dietary tags, ingredients, instructions
- [ ] Running with `--reset` flag deletes seed user and their recipes, then re-seeds
- [ ] Without `--reset`, if seed user exists, script exits with message: "Seed user already exists. Use --reset to re-seed."
- [ ] Missing `.env` vars: script exits with clear error message listing missing vars
- [ ] Malformed fixtures JSON: script exits with validation error

### Backend

**Tests:**
- `test_seed_creates_user`: Verify user created with expected email
- `test_seed_creates_recipes`: Verify 20 recipes created with valid structure
- `test_seed_reset_flag`: Verify `--reset` wipes and re-creates
- `test_seed_idempotent`: Verify running twice without reset exits early
- `test_seed_missing_env`: Verify clear error when env vars missing
- `test_seed_invalid_fixtures`: Verify validation error on malformed JSON

**Implementation:**
- Create `backend/scripts/__init__.py`
- Create `backend/scripts/seed.py` with CLI using `argparse`
- Create `backend/scripts/fixtures/recipes.json` with 20 curated recipes
- Add to `backend/app/config.py`: `seed_user_email`, `seed_user_password` (optional fields)
- Update `backend/.env.example` with new vars

### Frontend

N/A

### Breaking Changes

None — new functionality only

---

## Feature 2: Feedback Widget

### Summary

In-app feedback collection system. Floating button visible on all pages opens modal with text input. Submissions stored in database with auto-captured context (page URL, user ID, timestamp, browser info from server).

### Layers

E2E, Backend, Frontend

### Acceptance Criteria

**Backend:**
- [ ] `Feedback` model exists with fields: id, message, page_url, user_agent, user_id (nullable), created_at
- [ ] POST `/api/v1/feedback` creates feedback record, returns 201
- [ ] POST accepts unauthenticated requests (user_id is null)
- [ ] POST with authenticated request includes user_id
- [ ] POST validates message: 10-2000 characters required
- [ ] POST captures `User-Agent` header server-side (not from request body)
- [ ] POST with invalid message returns 422 with field-level error
- [ ] GET `/api/v1/feedback` returns paginated list (for future admin use)

**Frontend:**
- [ ] Floating feedback button visible in bottom-right corner on all pages (auth and unauth)
- [ ] Clicking button opens modal with textarea
- [ ] Submit button disabled until message is 10+ characters
- [ ] Submitting shows loading spinner
- [ ] Success: toast "Thanks for your feedback!", modal closes
- [ ] Error: toast "Could not submit feedback. Please try again."
- [ ] Escape key closes modal without submitting
- [ ] Page URL captured from `window.location.href`

**E2E:**
- [ ] Feedback button visible on home page (unauthenticated)
- [ ] Feedback button visible on recipes page (authenticated)
- [ ] Submit feedback flow works end-to-end

### Backend

**Tests:**
- `test_create_feedback_unauthenticated`: POST without auth, verify 201, user_id is null
- `test_create_feedback_authenticated`: POST with auth, verify user_id populated
- `test_create_feedback_captures_user_agent`: Verify User-Agent header captured
- `test_create_feedback_validation`: Message < 10 chars returns 422
- `test_create_feedback_max_length`: Message > 2000 chars returns 422
- `test_list_feedback`: GET returns paginated list

**Implementation:**
- Create `backend/app/models/feedback.py` — Feedback model
- Update `backend/app/models/__init__.py` — export Feedback
- Create `backend/app/schemas/feedback.py` — FeedbackCreate, FeedbackResponse, FeedbackListResponse
- Create `backend/app/api/feedback.py` — router with POST and GET
- Update `backend/app/main.py` — include feedback router
- Create Alembic migration for Feedback table

### Frontend

**Tests:**
- `FeedbackButton.test.tsx`: Renders floating button, click opens modal
- `FeedbackModal.test.tsx`: Form validation, submit calls API, success/error toasts
- `feedbackApi.test.ts`: API service tests with MSW

**Implementation:**
- Create `frontend/src/services/feedbackApi.ts`
- Create `frontend/src/components/feedback/FeedbackButton.tsx`
- Create `frontend/src/components/feedback/FeedbackModal.tsx`
- Update `frontend/src/components/common/layout/MainLayout.tsx` — add FeedbackButton
- Add MSW handlers in `frontend/src/test/mocks/handlers.ts`
- Add Feedback type to `frontend/src/types/index.ts`

### Breaking Changes

None — new functionality only

---

## Feature 3: Dockerfile

### Summary

Multi-stage Dockerfile that builds the frontend and runs the backend. Produces a single container that serves the full application.

### Layers

Infrastructure

### Acceptance Criteria

- [ ] `docker build -t cooking-assistant .` succeeds
- [ ] Built image is < 500MB
- [ ] `docker run` starts the container without errors
- [ ] Container responds to `GET /api/v1/health` with 200
- [ ] Frontend static files served at `/` (React app loads)
- [ ] Container runs Alembic migrations on startup

### Implementation

**Verification tests:**
- Build succeeds: `docker build -t cooking-assistant .`
- Image size: `docker images cooking-assistant --format "{{.Size}}"`
- Health check: `curl http://localhost:8000/api/v1/health`
- Frontend loads: `curl http://localhost:8000/` returns HTML with React root

**Deliverables:**
- Create `Dockerfile` at repo root
  - Stage 1: `node:20-slim` — build frontend (`npm run build`)
  - Stage 2: `python:3.11-slim` — copy frontend dist, install backend deps
  - Entrypoint script runs `alembic upgrade head` then `gunicorn`
- Create `docker-entrypoint.sh` — migration + server startup
- Create `.dockerignore` — exclude node_modules, __pycache__, .git, etc.

### Breaking Changes

None — new infrastructure only

---

## Feature 4: Fly.io Config

### Summary

Fly.io configuration with persistent volume for SQLite database. Enables deployment to Fly.io platform.

### Layers

Infrastructure

### Acceptance Criteria

- [ ] `fly config validate` passes
- [ ] `fly deploy --dry-run` succeeds (or actual deploy to test app)
- [ ] SQLite database persists across deploys (volume mounted)
- [ ] Health check configured and passing
- [ ] Secrets documented: `SECRET_KEY`, `SENTRY_DSN`, `LLM_MODEL`, `OLLAMA_API_BASE`

### Implementation

**Verification tests:**
- Config valid: `fly config validate`
- Deploy works: `fly deploy` (to test app or staging)
- Persistence: Deploy twice, verify data survives

**Deliverables:**
- Create `fly.toml` at repo root
  - App name, primary region
  - VM size (shared-cpu-1x, 256MB for free tier)
  - Volume mount: `/data` for SQLite
  - Health check: `GET /api/v1/health`
  - Environment: `DATABASE_URL=sqlite+aiosqlite:///data/cooking_assistant.db`
- Update `backend/app/config.py` — ensure DATABASE_URL is configurable
- Create `docs/DEPLOYMENT.md` — secrets setup, volume creation instructions

### Breaking Changes

None — new infrastructure only

---

## Feature 5: GitHub Actions CD

### Summary

GitHub Actions workflow that deploys to Fly.io when a release tag is pushed.

### Layers

Infrastructure

### Acceptance Criteria

- [ ] Workflow file passes `actionlint` validation
- [ ] Pushing tag `v1.0.0` triggers the deploy workflow
- [ ] Workflow runs existing CI checks before deploying
- [ ] Successful CI → deploys to Fly.io
- [ ] Failed CI → deployment blocked
- [ ] Workflow requires `FLY_API_TOKEN` secret

### Implementation

**Verification tests:**
- Syntax: `actionlint .github/workflows/deploy.yml`
- Trigger: Push `v0.0.1-test` tag, verify workflow starts
- CI gate: Workflow should run lint/test jobs before deploy

**Deliverables:**
- Create `.github/workflows/deploy.yml`
  ```yaml
  on:
    push:
      tags:
        - 'v*.*.*'
  ```
  - Job 1: Run backend CI (lint, type check, test)
  - Job 2: Run frontend CI (lint, type check, build, test)
  - Job 3: Deploy to Fly.io (needs: [backend-ci, frontend-ci])
- Document `FLY_API_TOKEN` secret setup in `docs/DEPLOYMENT.md`

### Breaking Changes

None — new infrastructure only

---

## Feature 6: Sentry Integration

### Summary

Error tracking with Sentry for both backend and frontend. Captures unhandled exceptions and sends to Sentry dashboard.

### Layers

Backend, Frontend

### Acceptance Criteria

**Backend:**
- [ ] `sentry-sdk[fastapi]` added to requirements.txt
- [ ] Sentry initialized in `main.py` when `SENTRY_DSN` is set
- [ ] Sentry NOT initialized when `SENTRY_DSN` is empty (no errors in dev)
- [ ] Unhandled exception in endpoint appears in Sentry dashboard
- [ ] Release version tagged in Sentry events

**Frontend:**
- [ ] `@sentry/react` added to package.json
- [ ] Sentry initialized in `main.tsx` when `VITE_SENTRY_DSN` is set
- [ ] Unhandled JS error appears in Sentry dashboard
- [ ] React Error Boundary integrated with Sentry

### Implementation

**Verification tests:**
- Backend: Raise exception in test endpoint, verify appears in Sentry
- Frontend: Throw error in component, verify appears in Sentry
- No-DSN: Start app without SENTRY_DSN, verify no errors

**Backend deliverables:**
- Add `sentry-sdk[fastapi]>=1.40.0` to `requirements.txt`
- Add `sentry_dsn: str = ""` to `backend/app/config.py`
- Update `backend/app/main.py` — conditional Sentry init
- Update `backend/.env.example` — add `SENTRY_DSN=`

**Frontend deliverables:**
- Add `@sentry/react` to `package.json`
- Add `VITE_SENTRY_DSN` to `frontend/.env.example`
- Update `frontend/src/main.tsx` — conditional Sentry init
- Create `frontend/src/components/common/ErrorBoundary.tsx` with Sentry integration

### Breaking Changes

None — new functionality only

---

## Open Questions

None — all questions resolved during planning.

---

## Reviewer Findings Addressed

| Finding | Resolution |
|---------|------------|
| Recipe count vague (50-100) | Fixed: exactly 20 recipes |
| Idempotency undefined | Fixed: exits with message if user exists |
| Missing edge cases (env vars, JSON) | Added to acceptance criteria |
| Feedback visibility contradiction | Fixed: visible on all pages (auth + unauth) |
| Message validation missing | Added: 10-2000 characters |
| User-agent capture location | Fixed: server-side from headers |
| Feature 3 too large | Split into 4 features (3-6) |
| Deployment not testable | Added verification tests for each |

---

## Next Steps

Run `/tdd` to execute Feature 1 (Seed Data Script), or specify which feature to start with.
