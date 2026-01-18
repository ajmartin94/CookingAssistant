# AD-0002: SQLite + SQLAlchemy Persistence

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

The Cooking Assistant follows a local-first philosophy where users can run the
application on their own machine without complex infrastructure. The persistence
layer needed to support async operations for our FastAPI backend, provide a robust
ORM for structured data, and enable flexible schema evolution. Additionally, the
application stores complex nested data (recipes with ingredients, instructions)
that benefits from JSON column support.

## Problem Statement

What database and ORM should we use for the Cooking Assistant's persistence layer
that aligns with our local-first, privacy-focused design principles?

## Decision

We will use SQLite as our database with async SQLAlchemy 2.0 as the ORM, leveraging
aiosqlite for async database access and JSON columns for structured nested data.

## Alternatives Considered

### Option A: SQLite + Async SQLAlchemy - SELECTED

**Description**: SQLite database file with SQLAlchemy 2.0's async support via
aiosqlite driver, using JSON columns for complex nested structures.

**Pros**:
- Zero configuration — single file database, no server required
- Local-first — data stays on user's machine, privacy by default
- Async SQLAlchemy 2.0 provides modern ORM patterns with type hints
- JSON columns enable LLM-friendly data structures
- SQLite is battle-tested, reliable, and surprisingly performant
- Easy backup/migration — just copy the database file
- Perfect for single-user or small-team deployments

**Cons**:
- Limited concurrent write performance (one writer at a time)
- Not suitable for horizontal scaling without additional infrastructure
- Some advanced SQL features not available

**Recommendation**: Selected

### Option B: PostgreSQL

**Description**: Full-featured relational database with excellent JSON support.

**Pros**:
- Superior concurrent write handling
- Advanced JSON operators (JSONB)
- Better suited for multi-user deployments
- Rich feature set for complex queries

**Cons**:
- Requires separate database server setup
- More complex deployment for local-first use case
- Overkill for typical single-user recipe management
- Higher operational overhead

**Recommendation**: Not selected — violates local-first principle by requiring
additional infrastructure; complexity not justified for typical use case

### Option C: MongoDB

**Description**: Document database with native JSON storage.

**Pros**:
- Native JSON document storage
- Flexible schema
- Good for prototype development

**Cons**:
- Requires separate server process
- Different query patterns than SQL
- Less mature async Python support
- Harder to ensure data consistency
- Violates local-first simplicity

**Recommendation**: Not selected — server requirement conflicts with local-first
design; SQLite with JSON columns provides sufficient document-like flexibility

### Status Quo: N/A (greenfield)

This was a greenfield project with no existing persistence layer.

## Consequences

**Positive**:
- Zero-friction setup for new users
- Data privacy by default (local storage)
- Simple backup and restore
- JSON columns enable AI-friendly data structures
- Async operations align with FastAPI patterns

**Negative**:
- Single-writer limitation may affect future multi-user features
- Migration to PostgreSQL would require schema adaptation
- Some queries may be less performant than with full RDBMS

**Constraints**:
- Must use aiosqlite driver for async support
- Large-scale multi-user deployment would need PostgreSQL migration
- Complex joins with JSON columns require careful query design

## Code Evidence

The following files demonstrate this decision:

- `backend/app/database.py` — Async SQLAlchemy engine configuration with aiosqlite
- `backend/app/config.py:22` — SQLite connection string with aiosqlite protocol
- `backend/requirements.txt:7-9` — sqlalchemy and aiosqlite dependencies
- `backend/app/models/*.py` — SQLAlchemy models with JSON columns

Example from `backend/app/database.py:14-18`:
```python
engine = create_async_engine(
    settings.database_url,
    echo=settings.database_echo,
    future=True,
)
```

Example from `backend/app/config.py:22`:
```python
database_url: str = "sqlite+aiosqlite:///./cooking_assistant.db"
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
