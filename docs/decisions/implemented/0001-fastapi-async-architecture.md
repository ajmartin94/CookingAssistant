# AD-0001: FastAPI Async Architecture

## Status
Implemented

## Metadata
- **Author**: Claude (AI Assistant)
- **Date**: 2026-01-16 (retroactive documentation)
- **Original Decision Date**: 2024 (approximate, initial development)
- **Trigger Type**: retroactive-documentation
- **Batch**: Retroactive-2026-01

## Retroactive Documentation Notice
This ADR documents a decision made during initial development and is being
retroactively recorded. The decision is already implemented in the codebase.

## Context

The Cooking Assistant needed a web framework for its backend API. The application
requires real-time responsiveness for AI-assisted features, efficient handling of
concurrent users, and seamless database I/O operations. As a local-first application
designed for modern development practices, the framework choice would significantly
impact developer experience, performance characteristics, and maintainability.

## Problem Statement

Which Python web framework should we use for the Cooking Assistant backend API,
and what concurrency model should we adopt for I/O operations?

## Decision

We will use FastAPI as our web framework with async/await patterns for all I/O
operations including database access, external API calls, and file operations.

## Alternatives Considered

### Option A: FastAPI with Async/Await - SELECTED

**Description**: FastAPI with native async support, using async database drivers
and await patterns throughout the codebase.

**Pros**:
- Native async support with high performance (comparable to Node.js/Go)
- Automatic OpenAPI/Swagger documentation generation
- Pydantic integration for request/response validation
- Type hints provide excellent IDE support and catch errors early
- Modern Python patterns that align with async SQLAlchemy
- Built-in dependency injection system

**Cons**:
- Requires understanding of async programming model
- Some third-party libraries may not have async support
- Debugging async code can be more complex

**Recommendation**: Selected

### Option B: Flask

**Description**: Traditional synchronous Python web framework with extensive ecosystem.

**Pros**:
- Simple, well-understood programming model
- Massive ecosystem of extensions
- Easy to learn and debug

**Cons**:
- Synchronous by default, requires WSGI server threading for concurrency
- No built-in request validation
- Manual OpenAPI documentation required
- Less performant under concurrent load

**Recommendation**: Not selected — synchronous model doesn't align with our need
for responsive AI operations and concurrent user handling

### Option C: Django REST Framework

**Description**: Full-featured framework with batteries-included approach.

**Pros**:
- Mature ecosystem with built-in admin, auth, ORM
- Well-documented with large community
- Good for rapid prototyping

**Cons**:
- Heavier weight than needed for API-only application
- Async support added later, not native to design
- Django ORM doesn't align with our SQLite/async requirements
- More opinionated structure may conflict with our patterns

**Recommendation**: Not selected — too heavyweight for our API-only needs and async
support is not as mature

### Status Quo: N/A (greenfield)

This was a greenfield project with no existing framework.

## Consequences

**Positive**:
- High performance under concurrent load from multiple AI operations
- Automatic API documentation reduces maintenance burden
- Strong typing catches errors at development time
- Clean async patterns make code easier to reason about
- Modern Python development experience

**Negative**:
- Team must understand async/await patterns
- Some synchronous libraries require careful handling
- Testing requires async-aware test frameworks (pytest-asyncio)

**Constraints**:
- All database operations must use async drivers (aiosqlite)
- HTTP clients must be async (httpx instead of requests)
- Background tasks should use FastAPI's BackgroundTasks or asyncio

## Code Evidence

The following files demonstrate this decision:

- `backend/app/main.py` — FastAPI application setup with async event handlers
- `backend/app/database.py` — Async SQLAlchemy engine and session configuration
- `backend/requirements.txt` — FastAPI, uvicorn, aiosqlite dependencies
- `backend/app/api/*.py` — All route handlers use async def

Example from `backend/app/main.py:52-55`:
```python
@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {"status": "healthy", "service": "cooking-assistant-api", "version": "1.0.0"}
```

## Gate 1 Evaluation
- **Decision**: YES
- **Evaluator**: User (batch approval)
- **Date**: 2026-01-16
- **Rationale**: Batch retroactive approval - foundational architecture decision

## Gate 2 Approval
- **Decision**: APPROVE
- **Approver**: User (batch approval)
- **Date**: 2026-01-16
- **Notes**: Batch retroactive approval - decision validated through successful implementation

## Gate 3 Approval
- **Decision**: APPROVE
- **Approver**: User (batch approval)
- **Date**: 2026-01-16
- **Notes**: No propagation required - already implemented in codebase
