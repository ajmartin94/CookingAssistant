# Backend Development Guide

**Stack:** FastAPI, SQLAlchemy (async), Pydantic v2, SQLite
**Testing:** pytest, pytest-asyncio

---

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI entry point
│   ├── config.py            # Configuration
│   ├── database.py          # DB connection/session
│   ├── models/              # SQLAlchemy ORM models
│   ├── schemas/             # Pydantic request/response
│   ├── api/v1/              # Route handlers
│   ├── services/            # Business logic
│   ├── ai/                  # AI integration (prompts, client)
│   └── utils/               # Helpers
├── migrations/              # Alembic migrations
├── tests/
│   ├── conftest.py          # Shared fixtures
│   ├── unit/                # Service/model tests
│   ├── integration/         # API endpoint tests
│   └── e2e/                 # User journey tests
└── requirements.txt
```

---

## Key Principles

- **Async everywhere**: Use `async/await` for I/O (DB, HTTP)
- **Type hints**: All functions, arguments, returns
- **Thin routes**: Business logic in `services/`, not `api/`
- **Pydantic validation**: All request/response data
- **FastAPI DI**: Use `Depends()` for DB sessions

---

## Running Tests

```bash
# All tests
pytest

# Specific file
pytest tests/unit/test_recipe_service.py -v

# With coverage
pytest --cov=app tests/

# Watch mode
pytest-watch
```

---

## Common Commands

```bash
# Start dev server
uvicorn app.main:app --reload --port 8000

# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one
alembic downgrade -1

# Type check
mypy app/

# Format
black app/ tests/

# Lint
ruff check app/ tests/
```

---

## Database Conventions

- **UUIDs** for primary keys (string(36))
- **Timestamps**: `created_at`, `updated_at` on all tables
- **JSON columns** for structured data (ingredients, instructions)
- **Foreign keys** for referential integrity
- **Index** frequently queried columns

---

<!-- Per AD-0100 -->
## API Response Conventions

- All API responses use **snake_case** (Python convention)
- Frontend handles transformation to camelCase
- Example: `prep_time_minutes`, `cook_time_minutes`, `dietary_tags`

---

## Adding New Features

1. Define Pydantic schema in `app/schemas/`
2. Create model in `app/models/` (if DB needed)
3. Add service function in `app/services/`
4. Create route in `app/api/v1/`
5. Write tests: unit for service, integration for API

**Pattern reference**: Read existing files in `app/services/` and `tests/` for conventions.
