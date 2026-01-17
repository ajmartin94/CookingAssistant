# Frontend Development Guide

**Stack:** React 18, TypeScript, Vite
**Testing:** Vitest, React Testing Library, MSW

---

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── auth/
│   │   ├── recipes/
│   │   ├── libraries/
│   │   └── common/
│   ├── pages/               # Page-level components
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API client functions
│   ├── contexts/            # React Context providers
│   ├── types/               # TypeScript definitions
│   ├── utils/               # Helpers
│   ├── test/                # Test infrastructure
│   │   ├── setup.ts
│   │   ├── test-utils.tsx   # Custom render
│   │   └── mocks/           # MSW handlers
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── vite.config.ts
├── vitest.config.ts
└── tsconfig.json
```

---

## Key Principles

- **TypeScript strict**: Type all props, state, returns
- **Functional components**: Hooks only, no class components
- **Test user behavior**: Query by role/label, not implementation
- **Accessibility**: ARIA labels, semantic HTML, keyboard nav
- **Performance**: `useMemo`/`useCallback` for expensive ops

---

## Running Tests

```bash
# All tests
npm test

# Specific file
npm test -- --run RecipeForm.test.tsx

# With UI
npm run test:ui

# Coverage
npm run test:coverage

# E2E (Playwright)
npm run test:e2e
```

---

## Common Commands

```bash
# Dev server
npm run dev

# Build
npm run build

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

---

## Component Conventions

- **Props interface**: Always define `interface XxxProps`
- **Co-located tests**: `Component.test.tsx` next to `Component.tsx`
- **Custom hooks**: Extract stateful logic to `hooks/`
- **API calls**: Use `services/` functions, not inline fetch

---

<!-- Per AD-0100 -->
## API Conventions

- **Response transformation**: Backend uses snake_case (Python), frontend uses camelCase (TypeScript)
- Transform at service layer (see `services/recipeApi.ts:transformRecipe`)
- All API clients should follow this pattern for consistency

---

<!-- Per AD-0100 -->
## Tailwind Gotchas

- **No comments in className**: Tailwind's JIT scans template literals for class patterns. A comment containing a class name (e.g., `// collapse when...`) will be interpreted as that class.
  ```tsx
  // BAD: "collapse" in comment gets parsed as .collapse utility
  className={`sidebar ${isOpen ? 'w-64' : 'w-16'} // collapse when closed`}

  // GOOD: No comments in className
  className={`sidebar ${isOpen ? 'w-64' : 'w-16'}`}
  ```
- **Tailwind v4 + Vite**: Use `@tailwindcss/vite` plugin, not `@tailwindcss/postcss`

---

## Testing Patterns

- **Custom render**: Use `test-utils.tsx` with providers
- **MSW mocks**: Define API handlers in `test/mocks/`
- **Query by role**: Prefer `getByRole` over `getByTestId`
- **User events**: Use `userEvent` from `@testing-library/user-event`

**Pattern reference**: Read existing `.test.tsx` files for conventions.
