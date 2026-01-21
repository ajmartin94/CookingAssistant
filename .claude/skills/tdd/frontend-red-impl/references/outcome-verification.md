# Outcome Verification for Frontend

Frontend tests verify **user-visible outcomes**, not internal state.

## The Frontend Outcome Pattern

```
1. Render component with initial state
2. Perform user action (click, type, etc.)
3. Assert user-visible outcome (text appears, element changes, etc.)
```

## Good vs Bad Examples

### Form Submission

```tsx
// BAD: Tests implementation details
it('should update isSubmitted state', async () => {
  const { result } = renderHook(() => useFormState());
  act(() => result.current.submit());
  expect(result.current.isSubmitted).toBe(true);  // ✗ Internal state
});

// GOOD: Tests user-visible outcome
it('should show success message after submit', async () => {
  render(<ContactForm />);
  await user.type(screen.getByLabelText('Email'), 'test@example.com');
  await user.click(screen.getByRole('button', { name: 'Submit' }));
  expect(screen.getByText('Message sent!')).toBeInTheDocument();  // ✓ User sees this
});
```

### Toggle Behavior

```tsx
// BAD: Tests state
it('should set isOpen to true', async () => {
  const [isOpen, setIsOpen] = useState(false);
  // ... checking state directly

// GOOD: Tests what user sees
it('should show menu when clicked', async () => {
  render(<Dropdown />);
  await user.click(screen.getByRole('button', { name: 'Menu' }));
  expect(screen.getByRole('menu')).toBeVisible();  // ✓ User sees menu
});
```

### Loading States

```tsx
// BAD: Tests loading prop
expect(component.props.isLoading).toBe(true);

// GOOD: Tests what user sees during loading
expect(screen.getByRole('progressbar')).toBeInTheDocument();
// or
expect(screen.getByText('Loading...')).toBeInTheDocument();
```

## What Counts as a Frontend Outcome

| Action | Outcome to verify |
|--------|-------------------|
| Click button | UI changes (modal opens, text changes) |
| Submit form | Success/error message appears |
| Toggle | Element shows/hides |
| Navigate | New content rendered |
| Type | Input value updates, validation shown |

## What Does NOT Count

- Internal state values (`useState` values)
- Redux store state
- Component props
- Mock function calls (in isolation)
- CSS classes (usually)

## The Acid Test

> "Can the user see or interact with this outcome?"

If no, you're testing implementation details.
