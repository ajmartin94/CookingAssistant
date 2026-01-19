# Bug Issue Template

Use this template when creating bug issues.

## Command Template

```bash
bd create \
  --title="Fix: [BROKEN BEHAVIOR]" \
  --type=bug \
  --priority=2 \
  --description="## Steps to Reproduce
1. [First step]
2. [Second step]
3. [Third step]

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Environment
- Browser/OS: [if relevant]
- API version: [if relevant]" \
  --acceptance="## Verification Steps
- [ ] [How to verify the bug is fixed]
- [ ] [Edge case to check]
- [ ] Original reproduction steps no longer trigger the bug
- [ ] No regression in related functionality"
```

## Checklist Before Creating

- [ ] Reproduced the bug locally
- [ ] Checked if there's an existing issue (`bd list --status=open`)
- [ ] Title clearly describes the broken behavior
- [ ] Reproduction steps are specific and numbered
- [ ] Acceptance criteria include verification steps

## Example: Well-Formed Bug

```bash
bd create \
  --title="Fix: Recipe list returns 500 when no recipes exist" \
  --type=bug \
  --priority=1 \
  --description="## Steps to Reproduce
1. Create new user account
2. Navigate to My Recipes page
3. Observe error

## Expected Behavior
Empty state message: 'No recipes yet. Create your first recipe!'

## Actual Behavior
500 Internal Server Error. Console shows: TypeError: Cannot read property 'map' of null

## Environment
- Browser: Chrome 120
- Backend logs show: NoneType has no attribute 'all'" \
  --acceptance="## Verification Steps
- [ ] New user sees empty state message (not error)
- [ ] API returns empty array [] not null
- [ ] Existing users with recipes still see their recipes
- [ ] Unit test added for empty recipe list case"
```
