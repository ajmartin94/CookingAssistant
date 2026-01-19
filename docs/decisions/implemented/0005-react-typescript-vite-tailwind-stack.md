# AD-0005: React + TypeScript + Vite + Tailwind Stack

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

The Cooking Assistant needs a modern frontend that delivers a responsive, intuitive
user experience for recipe management and AI-assisted cooking. The frontend must
support complex interactive features (recipe editing, step-by-step cooking mode),
maintain type safety with the backend API, and enable rapid development iteration.
The visual design should feel warm and inviting, appropriate for a cooking application.

## Problem Statement

What frontend framework, build tooling, and styling approach should we use for the
Cooking Assistant user interface?

## Decision

We will use React 18 with TypeScript in strict mode, Vite for build tooling, and
Tailwind CSS v4 with custom design tokens creating a warm, food-themed aesthetic.

## Alternatives Considered

### Option A: React + TypeScript + Vite + Tailwind - SELECTED

**Description**: React 18 with hooks, TypeScript strict mode, Vite for fast builds
and HMR, Tailwind CSS v4 with custom warm color palette.

**Pros**:
- React's component model fits recipe management UI well
- TypeScript provides type safety matching backend schemas
- Vite offers instant HMR and fast builds (10-100x faster than webpack)
- Tailwind enables rapid UI development with design tokens
- Large ecosystem and community support
- React 19 compatibility path clear

**Cons**:
- Tailwind learning curve for developers used to traditional CSS
- TypeScript strict mode requires more upfront typing
- React's flexibility can lead to inconsistent patterns without discipline

**Recommendation**: Selected

### Option B: Vue 3 + TypeScript

**Description**: Vue 3 with Composition API and TypeScript support.

**Pros**:
- Excellent documentation
- Single-file components feel cohesive
- Growing TypeScript support

**Cons**:
- Smaller ecosystem than React
- TypeScript support not as mature
- Fewer team members may have experience

**Recommendation**: Not selected — React's ecosystem and TypeScript integration
are more mature; team has more React experience

### Option C: Next.js

**Description**: React framework with server-side rendering and file-based routing.

**Pros**:
- SSR/SSG capabilities
- File-based routing
- Built-in optimizations

**Cons**:
- Server-side complexity not needed for local-first SPA
- Additional concepts to learn (getServerSideProps, etc.)
- Overhead for primarily client-side application

**Recommendation**: Not selected — SSR benefits don't apply to local-first SPA;
Vite provides simpler, faster development experience

### Option D: CSS Modules / Styled Components

**Description**: Component-scoped CSS approaches instead of utility-first.

**Pros**:
- Traditional CSS knowledge applies
- Clear component boundaries
- No utility class learning curve

**Cons**:
- Slower development for common patterns
- Design consistency harder to enforce
- More CSS files to maintain

**Recommendation**: Not selected — Tailwind's design tokens and utility-first
approach enable faster development with built-in consistency

### Status Quo: N/A (greenfield)

This was a greenfield project with no existing frontend.

## Consequences

**Positive**:
- Fast development iteration with Vite HMR
- Type safety catches API contract mismatches early
- Consistent warm visual design via Tailwind tokens
- Component library reusability
- Clear upgrade path to newer React versions

**Negative**:
- Tailwind classes can make JSX verbose
- Strict TypeScript requires more upfront effort
- Custom Tailwind config adds maintenance burden

**Constraints**:
- All components must use TypeScript with strict mode
- Custom hooks for stateful logic
- Design tokens must be used for colors/spacing (no arbitrary values)
- Functional components with hooks only (no class components)

## Code Evidence

The following files demonstrate this decision:

- `frontend/package.json` — React 19, TypeScript, Vite, Tailwind dependencies
- `frontend/vite.config.ts` — Vite configuration with React and Tailwind plugins
- `frontend/tailwind.config.js` — Custom warm color palette and design tokens
- `frontend/tsconfig.json` — TypeScript strict configuration
- `frontend/CLAUDE.md` — Documents component conventions

Example from `frontend/package.json:23-27`:
```json
"dependencies": {
  "@tailwindcss/vite": "^4.1.18",
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "react-router-dom": "^7.11.0"
}
```

Example from `frontend/tailwind.config.js:33-48` (custom colors):
```javascript
colors: {
  primary: {
    500: '#ec6b42',  // Terracotta - main brand color
    600: '#d94f28',  // Primary hover
  },
  secondary: {
    500: '#f59e0b',  // Amber - warm complement
  },
  // ... warm neutrals, semantic colors
}
```

Example from `frontend/vite.config.ts`:
```typescript
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
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
