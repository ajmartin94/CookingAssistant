---
name: frontend-green-impl
description: Implement frontend code to pass tests. Use when orchestrator assigns a frontend-green task. Write minimal code to make RED tests pass.
---

# Frontend Implementation (GREEN Phase)

Implement React components/logic to make the RED phase tests pass. Write **minimal code**.

## Input

From orchestrator:
- Bead ID and title
- Test file path (from frontend-red phase)
- Failing test output

## Process

1. Read the failing tests
2. Understand what UI/behavior is needed
3. Implement minimal code to pass
4. Run tests to confirm PASS

## Implementation Guidelines

### 1. Read Tests First

```bash
cd frontend && npm test -- --run path/to/Component.test.tsx
```

### 2. Implement Minimally

```tsx
// If test expects a button that shows "Success" on click:
// - Add the button
// - Add the onClick handler
// - Add the state for showing message

// DON'T:
// - Add features not tested
// - Add extra styling
// - Refactor unrelated code
```

### 3. Follow Project Patterns

Check existing code:
- `src/components/` for component patterns
- `src/hooks/` for hook patterns
- `src/services/` for API patterns

### 4. Run Tests

```bash
cd frontend && npm test -- --run
```

## Output Format

```
STATUS: COMPLETE|FAILED
SUMMARY: <what was implemented>
FILES: <files created/modified>
TESTS_PASSING: <X/Y tests pass>
```

## Common Patterns

### Adding a Component

```tsx
// src/components/feature/MyComponent.tsx
interface MyComponentProps {
  onAction: () => void;
}

export function MyComponent({ onAction }: MyComponentProps) {
  return (
    <button onClick={onAction} aria-label="Action">
      Click me
    </button>
  );
}
```

### Adding State

```tsx
const [isVisible, setIsVisible] = useState(false);
```

### Adding API Call

```tsx
// Use existing service
import { createRecipe } from '../../services/recipeApi';

const handleSubmit = async () => {
  await createRecipe(data);
};
```

## What This Phase Does NOT Do

- Add tests (that was frontend-red)
- Add features beyond what tests require
- Refactor existing code
- Change tests to make them pass

## Verification

```bash
# Component tests pass
cd frontend && npm test -- --run

# Full suite for regressions
cd frontend && npm test
```

## References

- See references/vitest-patterns.md for patterns
- See frontend/CLAUDE.md for conventions
