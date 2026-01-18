# AD-0004: Pydantic + Service Layer Pattern

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

The Cooking Assistant backend needs a clear architecture for handling business logic,
data validation, and API contracts. The application handles complex nested data
(recipes with ingredients and instructions) that requires robust validation. Clean
separation of concerns is essential for maintainability, testing, and future AI
integrations that may need to access business logic directly.

## Problem Statement

How should we structure request/response validation and organize business logic
in the backend application?

## Decision

We will use Pydantic v2 for all request/response validation with comprehensive
schemas, and implement a service layer pattern where routes are thin handlers
that delegate to service functions containing business logic.

## Alternatives Considered

### Option A: Pydantic v2 + Service Layer - SELECTED

**Description**: Pydantic v2 models for request/response validation, with business
logic extracted into service functions that routes call.

**Pros**:
- Pydantic v2 offers significant performance improvements over v1
- Native integration with FastAPI for automatic validation
- Strong typing catches errors at schema definition time
- Service layer enables reuse of business logic across routes
- Clear separation: routes handle HTTP, services handle logic
- Easy to unit test services in isolation
- Schemas serve as API documentation

**Cons**:
- More files to maintain (schemas + services + routes)
- Indirection can make simple CRUD feel over-engineered
- Learning curve for Pydantic v2 changes from v1

**Recommendation**: Selected

### Option B: Marshmallow

**Description**: Popular serialization library for Python with extensive ecosystem.

**Pros**:
- Mature, well-documented
- Flexible schema definition
- Good for complex validation scenarios

**Cons**:
- Not natively integrated with FastAPI
- Requires manual integration for OpenAPI docs
- Less performant than Pydantic v2
- Different paradigm from type hints

**Recommendation**: Not selected — Pydantic's FastAPI integration provides better
developer experience and automatic documentation

### Option C: Fat Routes (No Service Layer)

**Description**: Business logic directly in route handlers with Pydantic validation.

**Pros**:
- Fewer files, less indirection
- Faster to write simple endpoints
- Everything in one place

**Cons**:
- Routes become hard to read and test
- Business logic can't be reused
- Difficult to unit test without HTTP overhead
- Mixing HTTP concerns with domain logic

**Recommendation**: Not selected — as application grows, fat routes become
unmaintainable; service layer investment pays off

### Status Quo: N/A (greenfield)

This was a greenfield project with no existing architecture.

## Consequences

**Positive**:
- Automatic request validation with clear error messages
- OpenAPI documentation generated from schemas
- Business logic is testable in isolation
- Routes are easy to read and understand
- Consistent patterns across the codebase
- AI integrations can call services directly

**Negative**:
- More boilerplate for simple CRUD operations
- Need to maintain schema/model/service alignment
- Developers must follow the pattern consistently

**Constraints**:
- All API inputs must have corresponding Pydantic schemas
- Business logic must not live in route handlers
- Service functions must be async for database operations

## Code Evidence

The following files demonstrate this decision:

- `backend/app/schemas/` — Pydantic v2 schemas for all entities
- `backend/app/services/` — Service layer functions for business logic
- `backend/app/api/*.py` — Thin route handlers that call services
- `backend/requirements.txt:12-13` — Pydantic v2 dependencies
- `backend/CLAUDE.md` — Documents "thin routes" and service layer pattern

Example directory structure:
```
backend/app/
├── schemas/
│   ├── user.py        # UserCreate, UserResponse, TokenData
│   ├── recipe.py      # RecipeCreate, RecipeResponse, etc.
│   ├── library.py     # LibraryCreate, LibraryResponse
│   └── share.py       # ShareCreate, ShareResponse
└── services/
    ├── auth_service.py     # Authentication logic
    ├── recipe_service.py   # Recipe CRUD logic
    ├── library_service.py  # Library management
    └── share_service.py    # Sharing functionality
```

Example thin route from `backend/app/api/users.py` (pattern):
```python
@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    # Route delegates to service
    return await auth_service.create_user(db, user)
```

From `backend/CLAUDE.md`:
> **Thin routes**: Business logic in `services/`, not `api/`

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
