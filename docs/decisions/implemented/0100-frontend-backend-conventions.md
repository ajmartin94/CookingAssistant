# AD-0100: Frontend-Backend Integration Conventions

## Status
Implemented

## Metadata
- **Author**: Claude (AI Assistant)
- **Date**: 2026-01-16
- **Evidence Reference**: [2026-01-16-branch-development-learnings.md](../evidence/2026-01-16-branch-development-learnings.md)
- **Trigger Type**: code-change

## Context

During development of the Cooking Assistant, several integration patterns emerged between the Python backend and TypeScript frontend. Additionally, platform-specific configurations were added for cross-platform compatibility. These patterns exist in code but are undocumented, creating a gap that could cause confusion for contributors or lead to inconsistent implementations.

The patterns include: API response transformation conventions, Tailwind CSS v4 configuration specifics, and Playwright cross-platform setup.

## Problem Statement

How should we document the integration conventions and platform-specific configurations that emerged during development, ensuring contributors understand these patterns?

## Decision

We will add concise documentation of these conventions to the appropriate CLAUDE.md files and E2E testing guide, keeping additions minimal and focused on preventing common pitfalls.

## Alternatives Considered

### Option A: Add to Existing CLAUDE.md Files — SELECTED

**Description**: Add small sections to `frontend/CLAUDE.md`, `backend/CLAUDE.md`, and `docs/E2E_TESTING.md` documenting the specific conventions.

**Pros**:
- Keeps documentation close to where developers need it
- Minimal overhead—extends existing files
- Follows current documentation structure
- Easy to maintain alongside code

**Cons**:
- Distributed across multiple files
- Could be missed if someone only reads one file

**Recommendation**: Selected — pragmatic and follows existing patterns

### Option B: Create Dedicated Integration Guide

**Description**: Create a new `docs/INTEGRATION.md` covering all frontend-backend conventions.

**Pros**:
- Single source of truth for integration patterns
- Comprehensive coverage in one place

**Cons**:
- Another document to maintain
- May duplicate content from CLAUDE.md files
- Adds complexity for small amount of content

**Recommendation**: Not selected — overkill for 4 small conventions

### Option C: Status Quo (No Documentation)

**Description**: Leave patterns undocumented; developers discover through code.

**Pros**:
- No documentation maintenance burden
- Code is the source of truth

**Cons**:
- Contributors may implement inconsistent patterns
- Tailwind gotcha is subtle and hard to discover
- Repeats debugging effort already done

**Recommendation**: Not selected — these are non-obvious patterns worth documenting

## Consequences

**Positive**:
- Contributors understand API transformation pattern
- Tailwind v4 gotcha is explicitly warned against
- Windows developers can run E2E tests without debugging
- Consistent patterns across contributions

**Negative**:
- Slightly longer CLAUDE.md files
- Need to keep docs updated if patterns change

**Constraints**:
- Keep additions concise (bullet points, not paragraphs)
- Link to code examples rather than duplicating

## Affected Documentation

| File | Section | Change Required |
|------|---------|-----------------|
| `frontend/CLAUDE.md` | New "API Conventions" section | Add snake_case→camelCase transformation note |
| `frontend/CLAUDE.md` | New "Tailwind Gotchas" section | Add className comment warning |
| `backend/CLAUDE.md` | "Database Conventions" or new section | Note snake_case API responses |
| `docs/E2E_TESTING.md` | "Quick Start" or "Troubleshooting" | Add Windows compatibility note |

## Proposed Changes

### 1. frontend/CLAUDE.md — Add after "Component Conventions"

```markdown
---

## API Conventions

- **Response transformation**: Backend uses snake_case (Python), frontend uses camelCase (TypeScript)
- Transform at service layer (see `services/recipeApi.ts:transformRecipe`)
- All API clients should follow this pattern for consistency

---

## Tailwind Gotchas

- **No comments in className**: Tailwind's JIT scans template literals for class patterns. A comment containing a class name (e.g., `// collapse when...`) will be interpreted as that class.
  ```tsx
  // BAD: "collapse" in comment gets parsed as .collapse utility
  className={`sidebar ${isOpen ? 'w-64' : 'w-16'} // collapse when closed`}

  // GOOD: No comments in className
  className={`sidebar ${isOpen ? 'w-64' : 'w-16'}`}
  ```
- **Tailwind v4 + Vite**: Use `@tailwindcss/vite` plugin, not `@tailwindcss/postcss`
```

### 2. backend/CLAUDE.md — Add after "Database Conventions"

```markdown
---

## API Response Conventions

- All API responses use **snake_case** (Python convention)
- Frontend handles transformation to camelCase
- Example: `prep_time_minutes`, `cook_time_minutes`, `dietary_tags`
```

### 3. docs/E2E_TESTING.md — Add to "Troubleshooting" section

```markdown
### Windows Compatibility

E2E tests are cross-platform compatible. The Playwright config automatically detects Windows and uses the correct Python path:

- **Windows**: `venv\Scripts\python.exe`
- **Unix/Mac**: `source venv/bin/activate && python`

No manual configuration needed—just ensure your backend venv is set up correctly.
```

## Gate 2 Approval
- **Decision**: APPROVE
- **Approver**: User
- **Date**: 2026-01-16
- **Notes**: Approved as drafted

## Propagation

### Checklist

| File | Status | Change Summary |
|------|--------|----------------|
| `frontend/CLAUDE.md` | Complete | Added "API Conventions" and "Tailwind Gotchas" sections |
| `backend/CLAUDE.md` | Complete | Added "API Response Conventions" section |
| `docs/E2E_TESTING.md` | Complete | Added "Windows Compatibility" to Troubleshooting |

### Commits

- `bce0b02` - docs: implement AD-0100 frontend-backend integration conventions

### Propagation Metadata
- **Implementer**: Claude (AI Assistant)
- **Date**: 2026-01-16

## Gate 3 Approval
- **Decision**: APPROVE
- **Approver**: User
- **Date**: 2026-01-16
- **Notes**: All changes verified correct and complete
