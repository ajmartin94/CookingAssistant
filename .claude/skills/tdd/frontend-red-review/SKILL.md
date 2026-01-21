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

## Verification Questions

Ask these about each test:

1. "Does this test query elements the way a user would find them?"
2. "Does this test verify something the user can see or interact with?"
3. "Would this test fail if the feature was broken for the user?"

## Review Process

1. Read each test file
2. For each test, check:
   - Does it use `getByRole`, `getByLabelText`, etc.?
   - Does it verify user-visible outcomes?
   - Does it use `userEvent` (not `fireEvent`)?
3. Check for direct state testing (fail if found)
4. Verify test names describe user goals

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

### FAIL Example (Implementation details)

```tsx
// Bad: Tests implementation details
it('should update state on submit', async () => {
  const { result } = renderHook(() => useFormState());
  act(() => result.current.submit());
  expect(result.current.isSubmitted).toBe(true);  // ✗ Internal state
});
```

### FAIL Example (getByTestId overuse)

```tsx
// Bad: Uses test IDs instead of accessible queries
it('should show the form', () => {
  render(<ContactForm />);
  expect(screen.getByTestId('contact-form')).toBeInTheDocument();  // ✗
  expect(screen.getByTestId('email-input')).toBeInTheDocument();   // ✗
});
```

### FAIL Example (fireEvent)

```tsx
// Bad: Uses fireEvent instead of userEvent
it('should submit form', () => {
  render(<Form />);
  fireEvent.click(screen.getByRole('button'));  // ✗ Use userEvent
});
```
