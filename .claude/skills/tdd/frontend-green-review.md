---
name: frontend-green-review
description: Review frontend implementation for quality and test compliance. Fresh context review. Use when orchestrator requests frontend-green review.
---

# Frontend Implementation Review (GREEN Phase)

Review implementation with **fresh context**. Verify tests pass and code is acceptable.

## Input

From orchestrator:
- Implementation file paths
- Test file paths
- Test run output

## Review Checklist

### Critical (must pass)

- [ ] **Tests pass**: All frontend-red tests now pass
- [ ] **No test changes**: Tests weren't modified to pass
- [ ] **Minimal implementation**: Only implemented what tests require
- [ ] **TypeScript valid**: No type errors

### Important (should pass)

- [ ] **Follows patterns**: Matches existing component patterns
- [ ] **Accessible**: Uses semantic HTML, ARIA where needed
- [ ] **No regressions**: Full test suite still passes

### Warning (note but don't fail)

- [ ] **Styling**: Basic styling present (not required by tests)
- [ ] **Error states**: Error handling implemented

## Review Process

1. **Run tests yourself**:
   ```bash
   cd frontend && npm test -- --run
   ```

2. **Check for test modifications**:
   ```bash
   git diff frontend/src/**/*.test.tsx
   ```

3. **Type check**:
   ```bash
   cd frontend && npx tsc --noEmit
   ```

4. **Review implementation**:
   - Does it do more than tests require?
   - Are there hardcoded values?
   - Does it follow project patterns?

## Output Format

```
STATUS: PASS|FAIL
TESTS_RESULT: <X/Y passed>
CRITERIA_MET:
  - <list items that passed>
CRITERIA_FAILED:
  - <list items that failed with specifics>
FEEDBACK:
  <if FAIL, what needs to change>
```

## Common Review Failures

### Tests modified

```diff
- expect(screen.getByText('Exact Message')).toBeInTheDocument();
+ expect(screen.getByText(/message/i)).toBeInTheDocument();  // ✗ Loosened
```

### Over-implementation

```tsx
// Tests only require a button, but component has:
<Dialog>           {/* ✗ Not tested */}
  <DialogTitle>    {/* ✗ Not tested */}
  <Button>OK</Button>
</Dialog>
```

### Type errors

```
error TS2339: Property 'foo' does not exist on type 'Props'
```
**Action**: Fix type errors before passing review.

## References

- See references/review-criteria.md for detailed criteria
- See frontend/CLAUDE.md for conventions
