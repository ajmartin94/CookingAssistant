# Vitest Patterns for CookingAssistant

Project-specific patterns for frontend tests.

## Project Structure

```
frontend/src/
├── components/{feature}/
│   ├── Component.tsx
│   └── Component.test.tsx     # Co-located
├── pages/
│   ├── Page.tsx
│   └── Page.test.tsx          # Co-located
├── test/
│   ├── setup.ts               # Test setup
│   ├── test-utils.tsx         # Custom render
│   └── mocks/                 # MSW handlers
```

## Custom Render

Always use the custom render from `test-utils.tsx`:

```tsx
import { render, screen } from '../../test/test-utils';
// NOT from @testing-library/react directly
```

This includes providers (Router, Auth, etc.).

## Test Template

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

## Query Priority

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

## User Events

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

## Async Patterns

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

## Mocking API Calls

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

## Testing Forms

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

## Running Tests

```bash
# All tests
cd frontend && npm test

# Specific file
npm test -- --run RecipeCard.test.tsx

# Watch mode
npm test -- --watch

# With UI
npm run test:ui

# Coverage
npm run test:coverage
```

## File Naming

```
src/components/recipes/RecipeCard.test.tsx  # Component test
src/pages/RecipesPage.test.tsx              # Page test
src/hooks/useRecipes.test.ts                # Hook test
src/services/recipeApi.test.ts              # Service test
```
