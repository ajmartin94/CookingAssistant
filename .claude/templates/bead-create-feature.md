# Feature Issue Template

Use this template when creating feature issues.

## Command Template

```bash
bd create \
  --title="[ACTION] [NOUN]: [OUTCOME]" \
  --type=feature \
  --priority=2 \
  --description="## Problem
[What problem does this solve?]

## User Story
As a [user type], I want [goal] so that [benefit]." \
  --design="## Implementation Plan
1. [Database/model changes if any]
2. [API endpoint changes]
3. [Frontend component changes]
4. [Integration/wiring]
5. [Documentation updates]" \
  --acceptance="## Definition of Done
- [ ] [Specific testable criterion 1]
- [ ] [Specific testable criterion 2]
- [ ] Unit tests written and passing
- [ ] Manual testing completed
- [ ] Code reviewed"
```

## Checklist Before Creating

- [ ] Searched existing issues for duplicates (`bd list --status=open`)
- [ ] Title follows pattern: "Add X", "Implement Y", "Create Z"
- [ ] Priority reflects actual urgency (P2 = normal, P1 = urgent, P0 = critical)
- [ ] Design has numbered, actionable steps
- [ ] Acceptance criteria are testable (not vague)

## Example: Well-Formed Feature

```bash
bd create \
  --title="Add recipe rating system" \
  --type=feature \
  --priority=2 \
  --description="## Problem
Users can't express preferences for recipes they've tried.

## User Story
As a home cook, I want to rate recipes 1-5 stars so that the app can recommend better recipes." \
  --design="## Implementation Plan
1. Add rating column to recipes table (Alembic migration)
2. Create POST /api/recipes/{id}/rate endpoint
3. Add RatingStars component to RecipeDetail page
4. Update RecipeCard to show average rating
5. Add rating filter to recipe list API" \
  --acceptance="## Definition of Done
- [ ] Database migration runs without errors
- [ ] API endpoint validates 1-5 range, returns 400 for invalid
- [ ] Frontend shows clickable stars on recipe detail
- [ ] Average rating updates immediately on new rating
- [ ] Unit tests for rating calculation (edge cases: no ratings, one rating)
- [ ] E2E test for rating flow"
```
