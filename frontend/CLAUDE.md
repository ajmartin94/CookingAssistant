# Frontend Development Guide

**Stack:** React 18, TypeScript, Vite
**Testing:** Vitest, React Testing Library, MSW

---

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── recipes/
│   │   ├── libraries/
│   │   ├── sharing/
│   │   └── common/
│   ├── pages/               # Page-level components
│   ├── services/            # API client functions
│   ├── contexts/            # React Context providers
│   ├── types/               # TypeScript definitions
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
- **Global UI elements**: Components that should appear on ALL pages (including unauthenticated routes like `/login`) belong in `App.tsx`, not inside layouts
- **Class components**: Acceptable only for Error Boundaries (React has no hooks API for `componentDidCatch`)

---

<!-- Per AD-0100 -->
## API Conventions

- **Response transformation**: Backend uses snake_case (Python), frontend uses camelCase (TypeScript)
- Transform at service layer (see `services/recipeApi.ts:transformRecipe`)
- All API clients should follow this pattern for consistency

---

<!-- Per AD-0102 -->
## Navigation Patterns

For programmatic redirects (e.g., 401 handling), use the navigation service instead of `window.location.href`:

```typescript
// ✅ Use navigation service (works with E2E tests)
import { navigationService } from './services/navigationService';
navigationService.navigate('/login');

// ❌ Avoid window.location.href (breaks Playwright E2E tests)
window.location.href = '/login';
```

**Why?** Hard navigation conflicts with Playwright's `page.goto()`, causing unpredictable E2E test behavior. The navigation service uses React Router internally.

See [E2E Infrastructure Conventions](../e2e/CLAUDE.md#infrastructure-conventions) for full context.

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

### Custom Render

Always use the custom render from `test-utils.tsx`:

```tsx
import { render, screen } from '../../test/test-utils';
// NOT from @testing-library/react directly
```

This includes providers (Router, Auth, etc.).

### Test Template

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should allow user to [action] and see [outcome]', async () => {
    const user = userEvent.setup();

    // Render
    render(<MyComponent />);

    // Action
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    // Outcome
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });
});
```

### Query Priority

Use queries in this order (most to least preferred):

```tsx
// 1. Role (best - accessible to everyone)
screen.getByRole('button', { name: 'Submit' })
screen.getByRole('textbox', { name: 'Email' })
screen.getByRole('heading', { name: 'Welcome' })

// 2. Label (form elements)
screen.getByLabelText('Email')
screen.getByPlaceholderText('Enter email')

// 3. Text (visible content)
screen.getByText('Success!')
screen.getByText(/welcome/i)  // Regex for partial match

// 4. Test ID (last resort)
screen.getByTestId('custom-element')
```

### User Events

```tsx
import userEvent from '@testing-library/user-event';

const user = userEvent.setup();

// Click
await user.click(screen.getByRole('button'));

// Type
await user.type(screen.getByLabelText('Email'), 'test@example.com');

// Clear and type
await user.clear(screen.getByLabelText('Email'));
await user.type(screen.getByLabelText('Email'), 'new@example.com');

// Select option
await user.selectOptions(screen.getByRole('combobox'), 'option-value');

// Keyboard
await user.keyboard('{Enter}');
```

### Async Patterns

```tsx
// Wait for element to appear
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

// Find (async version of get)
const element = await screen.findByText('Loaded');

// Wait for element to disappear
await waitFor(() => {
  expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
});
```

### MSW API Mocking

MSW handlers are a **faithful proxy** of the real backend — not a convenience shortcut.

**Rules:**
- Handlers must return the same response shape as the real API (snake_case fields, same structure)
- When backend response fields change, update MSW handlers in the same PR
- Include realistic error responses (401, 404, 422) — not just happy paths
- Never use `vi.fn()` to mock API calls directly — use MSW

```tsx
// test/mocks/handlers.ts — must match real backend responses
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/v1/recipes', () => {
    return HttpResponse.json([
      { id: '1', title: 'Test Recipe', prep_time_minutes: 30, dietary_tags: [] }
    ]);
  }),
  http.post('/api/v1/recipes', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      { id: '2', ...body, created_at: new Date().toISOString() },
      { status: 201 }
    );
  }),
];
```

### Testing Forms (verify user outcomes, not callbacks)

```tsx
it('should show success after creating recipe', async () => {
  const user = userEvent.setup();

  render(<CreateRecipePage />);

  await user.type(screen.getByLabelText('Title'), 'New Recipe');
  await user.type(screen.getByLabelText('Servings'), '4');
  await user.click(screen.getByRole('button', { name: 'Create' }));

  // Verify what the USER sees — not internal callbacks
  await waitFor(() => {
    expect(screen.getByText(/recipe created/i)).toBeInTheDocument();
  });
});
```

**When `vi.fn()` IS appropriate:** Testing that a reusable child component calls its
parent's callback prop correctly (true component-level isolation). NOT for testing
form submissions, API interactions, or page-level flows.

### Frontend Integration Tests (page-level)

Beyond component tests, write page-level tests that verify the full render → fetch → display → interact cycle:

```tsx
describe('RecipesPage', () => {
  it('should load and display recipes from the API', async () => {
    render(<RecipesPage />);

    // MSW serves the response — verify it renders
    await waitFor(() => {
      expect(screen.getByText('Test Recipe')).toBeInTheDocument();
    });

    // Verify meaningful data displayed (not just "something rendered")
    expect(screen.getByText('30 min')).toBeInTheDocument();
  });

  it('should show empty state when no recipes exist', async () => {
    // Override handler for this test
    server.use(
      http.get('/api/v1/recipes', () => HttpResponse.json([]))
    );

    render(<RecipesPage />);

    await waitFor(() => {
      expect(screen.getByText(/no recipes yet/i)).toBeInTheDocument();
    });
  });
});
```

These tests verify what the user sees after the full data flow — not just that a component renders without crashing.

### File Naming

```
src/components/recipes/RecipeCard.test.tsx  # Component test
src/pages/RecipesPage.test.tsx              # Page test
src/hooks/useRecipes.test.ts                # Hook test
src/services/recipeApi.test.ts              # Service test
```

**Pattern reference**: Read existing `.test.tsx` files for conventions.

### TypeScript Assertions in Mock Tests

When accessing properties from mocked function calls or captured request bodies, TypeScript may need explicit type assertions:

```typescript
// Mocked function context (e.g., Sentry)
const sentryCall = vi.mocked(Sentry.captureException).mock.calls[0];
const context = sentryCall[1] as { extra?: { componentStack?: string } };

// Captured request body (after null check, use non-null assertion)
expect(capturedBody).not.toBeNull();
expect(capturedBody!.message).toBe('expected');
```

### Accessible Names Must Be Unique

Choose unique accessible names that won't conflict with other UI elements. E2E tests use regex patterns like `/send/i` to find buttons — if multiple elements match, tests fail with "strict mode violation."

```tsx
// BAD: "Send Feedback" matches /send/i along with chat's "Send" button
<button aria-label="Send Feedback">Feedback</button>

// GOOD: "Give Feedback" is unique
<button aria-label="Give Feedback">Feedback</button>
```

---

<!-- Per AD-0101 -->
## Test Enforcement

All PRs must pass `frontend-ci` before merge. This includes:
- **Lint**: `eslint`, `stylelint`
- **Format**: `prettier --check`
- **Types**: `tsc --noEmit` (errors block merge)
- **Build**: `npm run build` (failures block merge)
- **Tests**: `vitest --run` (failures block merge)

See [docs/TESTING.md](../docs/TESTING.md#enforcement-policy) for full enforcement policy.
