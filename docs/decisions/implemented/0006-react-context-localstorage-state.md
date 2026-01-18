# AD-0006: React Context + localStorage State Management

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

The Cooking Assistant frontend needs to manage application state including user
authentication, UI preferences (sidebar state), and potentially cached data. The
state management solution should balance simplicity with the ability to share state
across components. Authentication state specifically needs to persist across browser
sessions while remaining synchronized with the backend.

## Problem Statement

How should we manage global application state in the React frontend, particularly
for authentication persistence across sessions?

## Decision

We will use React Context API for global state management with localStorage for
authentication token persistence. Context providers wrap the application to share
auth state and UI preferences, with localStorage ensuring tokens survive page
refreshes.

## Alternatives Considered

### Option A: React Context + localStorage - SELECTED

**Description**: React Context for state distribution, localStorage for auth token
persistence, with custom hooks for accessing context.

**Pros**:
- Built into React, no external dependencies
- Simple mental model for state distribution
- localStorage provides cross-session persistence
- Custom hooks (useAuth) provide clean API
- Sufficient for current application complexity
- Easy to understand and debug

**Cons**:
- Context re-renders all consumers on state change
- localStorage is synchronous and limited (5MB)
- No built-in dev tools like Redux DevTools
- Can lead to "provider hell" with many contexts

**Recommendation**: Selected

### Option B: Redux / Redux Toolkit

**Description**: Centralized state management with Redux patterns and middleware.

**Pros**:
- Excellent DevTools for debugging
- Time-travel debugging
- Predictable state updates
- Large ecosystem of middleware

**Cons**:
- Significant boilerplate even with Redux Toolkit
- Overkill for current app complexity
- Additional learning curve
- Larger bundle size

**Recommendation**: Not selected — Redux adds complexity not justified by current
state management needs; Context is sufficient

### Option C: Zustand

**Description**: Lightweight state management with hooks-based API.

**Pros**:
- Minimal boilerplate
- No providers needed
- Built-in persistence middleware
- Small bundle size

**Cons**:
- External dependency when Context suffices
- Less familiar pattern for some developers
- May encourage unnecessary global state

**Recommendation**: Not selected — while Zustand is simpler than Redux, Context
API is sufficient and requires no additional dependency

Note: Zustand is present in package.json but Context is the primary pattern used.

### Option D: React Query / TanStack Query

**Description**: Server state management focused on caching and synchronization.

**Pros**:
- Excellent for server state caching
- Automatic refetching and cache invalidation
- Built-in loading/error states

**Cons**:
- Focused on server state, not client state
- Additional concept (server state vs client state)
- Would still need Context for pure client state

**Recommendation**: Could complement Context for data fetching in future; not a
replacement for auth/UI state management

### Status Quo: N/A (greenfield)

This was a greenfield project with no existing state management.

## Consequences

**Positive**:
- No external dependencies for core state management
- Simple, understandable state flow
- Auth persistence "just works" via localStorage
- Easy to test contexts in isolation
- Clear ownership of state via provider hierarchy

**Negative**:
- Context updates trigger re-renders (mitigated by splitting contexts)
- No time-travel debugging
- localStorage requires manual serialization
- XSS vulnerabilities could access localStorage tokens

**Constraints**:
- Auth tokens stored in localStorage (must consider XSS mitigation)
- Context providers must be near top of component tree
- Large contexts should be split to minimize re-renders
- Custom hooks must be used to access context (not useContext directly)

## Code Evidence

The following files demonstrate this decision:

- `frontend/src/contexts/AuthContext.tsx` — Auth state with localStorage persistence
- `frontend/src/contexts/SidebarContext.tsx` — UI state via Context
- `frontend/package.json` — Zustand available but Context is primary pattern

Example from `frontend/src/contexts/AuthContext.tsx:43-58`:
```typescript
useEffect(() => {
  const loadUser = async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const userData = await authApi.getCurrentUser();
        setUser(userData);
      } catch {
        localStorage.removeItem('auth_token');
      }
    }
    setIsLoading(false);
  };
  loadUser();
}, []);
```

Example from `frontend/src/contexts/AuthContext.tsx:103-106`:
```typescript
const logout = () => {
  authApi.logout();
  setUser(null);
};
```

Context hook pattern from `frontend/src/contexts/AuthContext.tsx:26-32`:
```typescript
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## Gate 1 Evaluation
- **Decision**: YES
- **Evaluator**: User (batch approval)
- **Date**: 2026-01-16
- **Rationale**: Batch retroactive approval - foundational frontend decision

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
