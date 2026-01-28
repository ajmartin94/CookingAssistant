.PHONY: help setup setup-backend setup-frontend \
       test test-backend test-frontend test-e2e test-e2e-full \
       dev dev-backend dev-frontend \
       lint format typecheck check \
       migrate migration

# Paths (relative from repo root)
VENV    = backend/venv
PYTHON  = $(VENV)/bin/python
PIP     = $(VENV)/bin/pip
DB      = backend/cooking_assistant.db

# When cd-ing into backend/, use venv/bin/python (relative to backend/)
BPYTHON = venv/bin/python

help: ## Show available targets
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

# ── Setup ────────────────────────────────────────────────────────────

setup: setup-backend setup-frontend ## Full environment setup

setup-backend: ## Backend: venv, deps, database
	@if [ ! -d $(VENV) ]; then \
		echo "Creating virtual environment..."; \
		python3 -m venv $(VENV); \
	fi
	$(PIP) install -r backend/requirements.txt
	@if [ ! -f $(DB) ]; then \
		echo "Initializing fresh database..."; \
		cd backend && $(BPYTHON) -c "import asyncio; from app.database import init_db; asyncio.run(init_db())"; \
		cd backend && $(BPYTHON) -m alembic stamp head; \
	else \
		echo "Running migrations..."; \
		cd backend && $(BPYTHON) -m alembic upgrade head; \
	fi

setup-frontend: ## Frontend: npm install + Playwright browsers
	cd frontend && npm install
	npx playwright install chromium

# ── Tests ────────────────────────────────────────────────────────────

test: test-backend test-frontend ## Run backend + frontend tests

test-backend: ## Run backend tests (pytest)
	cd backend && $(BPYTHON) -m pytest

test-frontend: ## Run frontend tests (vitest)
	cd frontend && npm test -- --run

test-e2e: ## Run E2E tests (smoke + core)
	npm run test:e2e

test-e2e-full: ## Run all E2E tests
	npm run test:e2e:full

# ── Dev Servers ──────────────────────────────────────────────────────

dev: ## Show instructions to start dev servers
	@echo "Start each in a separate terminal:"
	@echo "  make dev-backend    # http://localhost:8000"
	@echo "  make dev-frontend   # http://localhost:5173"

dev-backend: ## Start backend dev server
	cd backend && $(BPYTHON) -m uvicorn app.main:app --reload --port 8000

dev-frontend: ## Start frontend dev server
	cd frontend && npm run dev

# ── Code Quality ─────────────────────────────────────────────────────

lint: ## Run all linters
	cd backend && $(BPYTHON) -m ruff check app/ tests/
	cd frontend && npm run lint:all

format: ## Auto-format all code
	cd backend && $(BPYTHON) -m black app/ tests/
	cd frontend && npm run format

typecheck: ## Run type checkers (mypy + tsc)
	cd backend && $(BPYTHON) -m mypy app/
	cd frontend && npx tsc --noEmit

check: ## Full CI check locally (lint + format-check + typecheck + test)
	@echo "=== Lint ==="
	cd backend && $(BPYTHON) -m ruff check app/ tests/
	cd frontend && npm run lint:all
	@echo "=== Format Check ==="
	cd backend && $(BPYTHON) -m black --check app/ tests/
	cd frontend && npm run format:check
	@echo "=== Type Check ==="
	cd backend && $(BPYTHON) -m mypy app/
	cd frontend && npx tsc --noEmit
	@echo "=== Tests ==="
	cd backend && $(BPYTHON) -m pytest
	cd frontend && npm test -- --run

# ── Database ─────────────────────────────────────────────────────────

migrate: ## Run pending migrations
	cd backend && $(BPYTHON) -m alembic upgrade head

migration: ## Create new migration (usage: make migration MSG="description")
	cd backend && $(BPYTHON) -m alembic revision --autogenerate -m "$(MSG)"
