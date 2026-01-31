.PHONY: help setup setup-backend setup-frontend \
       test test-backend test-frontend test-e2e test-e2e-full \
       dev dev-backend dev-frontend \
       dev-lan dev-backend-lan dev-frontend-lan \
       lint format typecheck check \
       migrate migration seed seed-reset

# Paths (relative from repo root)
VENV    = backend/venv
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

test-backend: ## Run backend tests (pytest) — use ARGS for specific files
	cd backend && $(BPYTHON) -m pytest $(ARGS)

test-frontend: ## Run frontend tests (vitest) — use ARGS for specific files
	cd frontend && npm test -- --run $(ARGS)

test-e2e: ## Run E2E tests (smoke + core) — use ARGS for specific files
	npm run test:e2e $(if $(ARGS),-- $(ARGS))

test-e2e-full: ## Run all E2E tests
	npm run test:e2e:full

# ── Dev Servers ──────────────────────────────────────────────────────

dev: ## Show instructions to start dev servers
	@echo "Start each in a separate terminal:"
	@echo "  make dev-backend    # http://localhost:8000"
	@echo "  make dev-frontend   # http://localhost:5173"

dev-backend: ## Start backend dev server (use RESET=1 to kill existing first)
ifdef RESET
	-fuser -k 8000/tcp 2>/dev/null; sleep 1
endif
	cd backend && $(BPYTHON) -m uvicorn app.main:app --reload --port 8000

dev-frontend: ## Start frontend dev server (use RESET=1 to kill existing first)
ifdef RESET
	-fuser -k 5173/tcp 2>/dev/null; sleep 1
endif
	cd frontend && npm run dev

dev-lan: ## Show instructions to start LAN-accessible dev servers
	@IP=$$(hostname -I | awk '{print $$1}'); \
	echo ""; \
	echo "Your LAN IP: $$IP"; \
	echo "Start each in a separate terminal:"; \
	echo "  make dev-backend-lan   # http://$$IP:8000"; \
	echo "  make dev-frontend-lan  # http://$$IP:5173"; \
	echo ""; \
	echo "WSL2 note: you may need to forward ports from Windows."; \
	echo "Run in PowerShell (Admin):"; \
	echo "  netsh interface portproxy add v4tov4 listenport=8000 listenaddress=0.0.0.0 connectport=8000 connectaddress=$$IP"; \
	echo "  netsh interface portproxy add v4tov4 listenport=5173 listenaddress=0.0.0.0 connectport=5173 connectaddress=$$IP"; \
	echo "  New-NetFirewallRule -DisplayName 'CookingAssistant Dev' -Direction Inbound -LocalPort 5173,8000 -Protocol TCP -Action Allow"

dev-backend-lan: ## Start backend dev server accessible on LAN
ifdef RESET
	-fuser -k 8000/tcp 2>/dev/null; sleep 1
endif
	@IP=$$(hostname -I | awk '{print $$1}'); \
	echo "Backend LAN: http://$$IP:8000"; \
	cd backend && CORS_ORIGINS="http://localhost:5173,http://$$IP:5173" \
	$(BPYTHON) -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0

dev-frontend-lan: ## Start frontend dev server accessible on LAN
ifdef RESET
	-fuser -k 5173/tcp 2>/dev/null; sleep 1
endif
	@IP=$$(hostname -I | awk '{print $$1}'); \
	echo "Frontend LAN: http://$$IP:5173"; \
	cd frontend && VITE_API_URL=http://$$IP:8000 npx vite --host 0.0.0.0

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

seed: ## Seed database with demo data (demo@example.com / demopassword123)
	cd backend && SEED_USER_EMAIL=demo@example.com SEED_USER_PASSWORD=demopassword123 $(BPYTHON) -m scripts.seed

seed-reset: ## Wipe and re-seed database
	cd backend && SEED_USER_EMAIL=demo@example.com SEED_USER_PASSWORD=demopassword123 $(BPYTHON) -m scripts.seed --reset

migration: ## Create new migration (usage: make migration MSG="description")
ifndef MSG
	$(error MSG is required. Usage: make migration MSG="description")
endif
	cd backend && $(BPYTHON) -m alembic revision --autogenerate -m "$(MSG)"
