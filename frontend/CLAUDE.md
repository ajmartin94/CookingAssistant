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

See [E2E Infrastructure Conventions](../docs/E2E_TESTING.md#infrastructure-conventions) for full context.

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

### Mocking API Calls

Use MSW handlers in `test/mocks/`:

```tsx
// test/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/v1/recipes', () => {
    return HttpResponse.json([{ id: '1', title: 'Test Recipe' }]);
  }),
];
```

### Testing Forms

```tsx
it('should submit form with user data', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();

  render(<MyForm onSubmit={onSubmit} />);

  await user.type(screen.getByLabelText('Name'), 'John');
  await user.type(screen.getByLabelText('Email'), 'john@example.com');
  await user.click(screen.getByRole('button', { name: 'Submit' }));

  expect(onSubmit).toHaveBeenCalledWith({
    name: 'John',
    email: 'john@example.com',
  });
});
```

### File Naming

```
src/components/recipes/RecipeCard.test.tsx  # Component test
src/pages/RecipesPage.test.tsx              # Page test
src/hooks/useRecipes.test.ts                # Hook test
src/services/recipeApi.test.ts              # Service test
```

**Pattern reference**: Read existing `.test.tsx` files for conventions.

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
