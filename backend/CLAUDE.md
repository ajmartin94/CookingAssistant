# Backend Development Guide

**Stack:** FastAPI, SQLAlchemy (async), Pydantic v2, SQLite
**Testing:** pytest, pytest-asyncio

---

<!-- Per AD-0105 -->
## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI entry point
│   ├── config.py            # Configuration (incl. LLM settings)
│   ├── database.py          # DB connection/session
│   ├── models/              # SQLAlchemy ORM models
│   ├── schemas/             # Pydantic request/response
│   ├── api/v1/              # Route handlers
│   ├── services/            # Business logic
│   │   ├── llm/             # LLM service (LiteLLM wrapper)
│   │   └── tools/           # Tool executor framework
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

---

<!-- Per AD-0105 -->
## LLM Service Conventions

The LLM service layer (`app/services/llm/`) provides provider-agnostic LLM access via LiteLLM.

### LLMService Usage

```python
from app.services.llm import LLMService, get_llm_service

# Get singleton instance
service = get_llm_service()

# Streaming (default)
async for chunk in service.chat(messages):
    # Process streaming chunks
    pass

# Non-streaming
response = await service.chat(messages, stream=False)
```

### Tool Executor Pattern

Tools requiring user confirmation use the `ToolExecutor` framework (`app/services/tools/`):

1. **Define tool handlers** in `app/services/tools/` (e.g., `recipe_tools.py`)
2. **Register handlers** with `ToolExecutor.register_tool()`
3. **Categorize tools**:
   - Read-only tools: auto-approved (e.g., `suggest_substitutions`)
   - Mutation tools: require confirmation (e.g., `create_recipe`, `edit_recipe`)

Tool lifecycle: `PENDING_CONFIRMATION` → `APPROVED`/`REJECTED` → `EXECUTED`/`FAILED`

### Adding New Tools

1. Add tool schema to `app/services/tools/` with OpenAI function format
2. Implement async handler function
3. Register in tool lists:
   - `READ_ONLY_TOOLS` for auto-approved tools
   - `CONFIRMATION_REQUIRED_TOOLS` for mutation tools
4. Write unit tests for the handler

---

<!-- Per AD-0105 -->
## Environment Variables

LLM-related configuration in `app/config.py`:

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_MODEL` | `ollama/llama3.1:8b` | LiteLLM model identifier |
| `OLLAMA_API_BASE` | `http://localhost:11434` | Ollama server URL |
| `OPENAI_API_KEY` | None | OpenAI API key (if using OpenAI) |
| `ANTHROPIC_API_KEY` | None | Anthropic API key (if using Claude) |

Model format follows LiteLLM conventions: `provider/model` (e.g., `ollama/llama3.1:8b`, `anthropic/claude-3-haiku`, `openai/gpt-4`).

---

<!-- Per AD-0101 -->
## Test Enforcement

All PRs must pass `backend-ci` before merge. This includes:
- **Lint**: `ruff check .`
- **Format**: `black --check .`
- **Types**: `mypy app` (errors block merge)
- **Tests**: `pytest` (failures block merge)

See [docs/TESTING.md](../docs/TESTING.md#enforcement-policy) for full enforcement policy.
