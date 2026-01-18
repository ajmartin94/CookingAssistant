# State of the Union: Development Learnings from docs-alignment Branch

## Metadata
- **Date**: 2026-01-16
- **Author**: Claude (AI Assistant)
- **Trigger Type**: code-change

## Trigger Event

### What Happened
Review of code changes on the `docs-alignment` branch revealed several patterns and learnings that emerged during development but are not currently documented. These include API response transformations, Tailwind v4 configuration issues, and cross-platform compatibility solutions.

### Reference
- Branch: `docs-alignment`
- Commits reviewed: `git log main..HEAD`
- Key fix commits: `a8f92fe`, `24801b6`, `6947fdf`

## Evidence

### Learning 1: API Response Transformation Pattern

**Code Changes**:
- File: `frontend/src/services/recipeApi.ts:28-100`

**Summary**:
The frontend transforms snake_case API responses from the Python backend to camelCase for TypeScript consumption. This transformation happens at the API client layer.

**Current Documentation State**:
- `frontend/CLAUDE.md` does not mention this pattern
- `backend/CLAUDE.md` does not mention the snake_case convention expectation

**Observations**:
- Backend uses Python convention (snake_case): `prep_time_minutes`, `cook_time_minutes`
- Frontend uses TypeScript convention (camelCase): `prepTimeMinutes`, `cookTimeMinutes`
- Transform function `transformRecipe()` handles the conversion
- This is a standard pattern but undocumented, which could cause confusion

### Learning 2: Tailwind v4 className Comment Gotcha

**Code Changes**:
- File: `frontend/src/components/common/layout/Sidebar.tsx`
- Commit: `a8f92fe`

**Summary**:
Comments inside className template literals can be incorrectly parsed as Tailwind class names. The word "collapse" in a comment was being interpreted as Tailwind's `.collapse` utility class, breaking sidebar visibility.

**Observations**:
- This is a subtle bug that's difficult to diagnose
- Tailwind's JIT compiler scans for class-like patterns in template literals
- Solution: Remove comments from className strings entirely

### Learning 3: Tailwind v4 + Vite Configuration

**Code Changes**:
- Files: `frontend/vite.config.ts`, `frontend/postcss.config.js`, `frontend/index.css`
- Commit: `a8f92fe`

**Summary**:
Tailwind v4 with Vite requires specific configuration:
- Use `@tailwindcss/vite` plugin (not `@tailwindcss/postcss`)
- Use v4 CSS syntax: `@import "tailwindcss"`, `@config`, `@source`

**Current Documentation State**:
- No Tailwind configuration guidance in `frontend/CLAUDE.md`
- AD-0005 mentions Tailwind but not v4-specific setup

### Learning 4: Windows Compatibility for Playwright

**Code Changes**:
- File: `playwright.config.ts`
- Commit: `6947fdf`

**Summary**:
Playwright config uses platform-specific server commands:
```typescript
command: process.platform === 'win32'
  ? 'cd backend && venv\\Scripts\\python.exe -m app.main'
  : 'cd backend && source venv/bin/activate && python -m app.main'
```

**Current Documentation State**:
- `docs/E2E_TESTING.md` doesn't mention Windows compatibility
- The pattern is in code but not explained

## Potentially Affected Documentation

- [ ] `frontend/CLAUDE.md` — API transformation pattern, Tailwind gotchas
- [ ] `backend/CLAUDE.md` — snake_case API convention
- [ ] `docs/E2E_TESTING.md` — Windows compatibility note
- [ ] `docs/decisions/implemented/0005-react-typescript-vite-tailwind-stack.md` — Tailwind v4 specifics (or new AD)

## Gate 1 Evaluation
- **Decision**: YES
- **Evaluator**: User
- **Date**: 2026-01-16
- **AD Number**: AD-0100
- **Rationale**: All 4 learnings show meaningful gaps between code patterns and documentation
