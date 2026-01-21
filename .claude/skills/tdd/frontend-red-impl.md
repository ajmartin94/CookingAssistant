---
name: frontend-red-impl
description: Design frontend tests (Vitest/RTL) verifying user behavior. Use when orchestrator assigns a frontend-red task. Outputs tests that query by role, not implementation.
---

# Frontend Test Design (RED Phase)

Design Vitest/React Testing Library tests that verify **user behavior**, not implementation details.

## Input

From orchestrator:
- Bead ID and title
- Acceptance criteria
- Related E2E test (from e2e-red phase)

## Process

1. Read acceptance criteria and E2E test
2. Identify what UI components/behavior are needed
3. Write tests following RTL patterns (see references/vitest-patterns.md)
4. Run tests to confirm they FAIL (RED state)

## Test Structure

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should allow user to [action] and see [outcome]', async () => {
    const user = userEvent.setup();

    // 1. RENDER
    render(<MyComponent />);

    // 2. ACTION: User interaction
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    // 3. OUTCOME: Verify user-visible result
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });
});
```

## Key Rules

1. **Query by role** - Use `getByRole`, `getByLabelText`, not `getByTestId`
2. **Test user behavior** - What user sees/does, not internal state
3. **Use userEvent** - Not `fireEvent` for realistic interactions
4. **Custom render** - Use `test-utils.tsx` with providers

## File Location

```
frontend/src/components/{feature}/Component.test.tsx  # Co-located
frontend/src/pages/Page.test.tsx                      # Co-located
```

## Output Format

```
STATUS: COMPLETE|FAILED
SUMMARY: <what tests were written>
FILES: <files created>
OUTCOME: <what user behavior this verifies>
TEST_COUNT: <number of tests>
```

## Verification

Run tests - they MUST fail:

```bash
cd frontend && npm test -- --run path/to/Component.test.tsx
```

## References

- See references/vitest-patterns.md for project patterns
- See frontend/CLAUDE.md for conventions
