---
name: frontend-red-review
description: Review frontend tests for user behavior focus. Fresh context review. Use when orchestrator requests frontend-red review.
---

# Frontend Test Review (RED Phase)

Review Vitest/RTL tests with **fresh context**. Evaluate the artifact only.

## Input

From orchestrator:
- Test file paths to review
- Acceptance criteria from bead

## Review Checklist

### Critical (must pass)

- [ ] **Queries by role/label**: Uses `getByRole`, `getByLabelText`, not `getByTestId`
- [ ] **Tests user behavior**: Verifies what user sees, not internal state
- [ ] **Would fail if broken**: Tests catch broken UI behavior
- [ ] **Uses userEvent**: Not `fireEvent` for user interactions

### Important (should pass)

- [ ] **Uses custom render**: Uses `test-utils.tsx` with providers
- [ ] **User-goal naming**: Test names describe user intent
- [ ] **Accessibility tested**: Tests verify accessible interactions

### Warning (note but don't fail)

- [ ] **Snapshot overuse**: Too many snapshots testing implementation
- [ ] **Direct state testing**: Checking internal component state

## Output Format

```
STATUS: PASS|FAIL
CRITERIA_MET:
  - <list items that passed>
CRITERIA_FAILED:
  - <list items that failed with file:line and specifics>
FEEDBACK:
  <if FAIL, specific actionable changes needed>
```

## Examples

### PASS Example

```tsx
// Good: Queries by role, tests user behavior
it('should show success message after form submit', async () => {
  render(<ContactForm />);
  await user.type(screen.getByLabelText('Email'), 'test@example.com');
  await user.click(screen.getByRole('button', { name: 'Submit' }));
  expect(screen.getByText('Message sent!')).toBeInTheDocument();
});
```

### FAIL Example

```tsx
// Bad: Tests implementation details
it('should update state on submit', async () => {
  const { result } = renderHook(() => useFormState());
  act(() => result.current.submit());
  expect(result.current.isSubmitted).toBe(true);  // ✗ Internal state
});
```

## References

- See references/review-criteria.md for detailed criteria
- See references/vitest-patterns.md for patterns
