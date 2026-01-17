# AD-0003: JWT + bcrypt Authentication

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

The Cooking Assistant requires user authentication to protect personal recipes and
preferences. As a local-first application, the authentication system should work
without external dependencies while remaining secure. The system needs to support
both API-based authentication (for the SPA frontend) and potential future mobile
clients or integrations.

## Problem Statement

What authentication mechanism should we use to secure user accounts and API access,
and how should we handle password storage?

## Decision

We will use stateless JWT (JSON Web Tokens) for API authentication with bcrypt
for secure password hashing. Tokens are signed with HS256 algorithm and stored
client-side in localStorage.

## Alternatives Considered

### Option A: JWT with bcrypt - SELECTED

**Description**: Stateless JWT tokens for authentication, bcrypt for password
hashing, with tokens stored in localStorage on the client.

**Pros**:
- Stateless — no server-side session storage required
- Self-contained tokens work offline or across services
- bcrypt is industry standard for password hashing with adaptive cost factor
- Simple implementation with python-jose and passlib
- Aligns with local-first philosophy (no Redis/memcached needed)
- Easy to verify token validity without database lookup

**Cons**:
- Token revocation requires additional infrastructure (not implemented)
- localStorage is vulnerable to XSS (mitigated by short expiration)
- Token size larger than session ID

**Recommendation**: Selected

### Option B: Session-based Authentication

**Description**: Traditional server-side sessions with session ID cookies.

**Pros**:
- Simple revocation (delete server-side session)
- Smaller cookie size
- Well-understood pattern

**Cons**:
- Requires server-side session storage (Redis, database)
- Adds infrastructure complexity
- Doesn't align with stateless API design
- More complex for SPA frontend

**Recommendation**: Not selected — session storage requirement conflicts with
local-first simplicity; stateless JWT better fits our API-first design

### Option C: OAuth-only (External Provider)

**Description**: Delegate all authentication to external OAuth providers (Google,
GitHub, etc.).

**Pros**:
- No password storage responsibility
- Users don't need another password
- Providers handle security updates

**Cons**:
- Requires internet connectivity (breaks local-first)
- Dependency on external services
- Not all users want social login
- Complex redirect flows

**Recommendation**: Not selected — external dependency violates local-first
principle; could be added as optional feature later

### Status Quo: N/A (greenfield)

This was a greenfield project with no existing authentication.

## Consequences

**Positive**:
- No additional infrastructure needed for sessions
- Works offline once token is obtained
- bcrypt provides strong, adaptive password security
- Stateless design simplifies horizontal scaling if needed
- Clear separation between authentication and authorization

**Negative**:
- Token revocation not currently implemented
- XSS vulnerabilities could expose tokens (mitigated by CSP, short expiration)
- Must handle token refresh for long sessions

**Constraints**:
- Frontend must include token in Authorization header for API requests
- Token expiration currently set to 30 minutes (configurable)
- Password hashing cost factor must balance security and login latency

## Code Evidence

The following files demonstrate this decision:

- `backend/app/services/auth_service.py` — JWT creation/validation and bcrypt hashing
- `backend/app/config.py:26-28` — JWT configuration (secret key, algorithm, expiration)
- `backend/requirements.txt:17-19` — python-jose and passlib[bcrypt] dependencies
- `frontend/src/contexts/AuthContext.tsx:45,64` — localStorage token management

Example from `backend/app/services/auth_service.py:19`:
```python
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
```

Example from `backend/app/services/auth_service.py:52-54`:
```python
encoded_jwt = jwt.encode(
    to_encode, settings.secret_key, algorithm=settings.algorithm
)
```

Example from `frontend/src/contexts/AuthContext.tsx:64`:
```typescript
localStorage.setItem('auth_token', response.access_token);
```

## Gate 1 Evaluation
- **Decision**: YES
- **Evaluator**: User (batch approval)
- **Date**: 2026-01-16
- **Rationale**: Batch retroactive approval - foundational security decision

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
