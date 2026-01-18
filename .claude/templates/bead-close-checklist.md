# Bead Closure Checklist

Follow this checklist for EVERY bead closure.

## Pre-Closure Verification

- [ ] All acceptance criteria from the issue are met
- [ ] Tests written and passing (`pytest` / `npm test`)
- [ ] Linter clean (`mypy` / `npx tsc`)
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors/warnings in browser (if frontend change)

## Closure Command

```bash
bd close <ISSUE-ID> --reason="[SUMMARY]

What was done:
- [Key change 1]
- [Key change 2]

Tests: [X unit, Y integration] passing
Files changed: [list key files]"
```

## Post-Closure MANDATORY Steps

**IMMEDIATELY after `bd close`:**

```bash
# 1. Stage all changes (including .beads/issues.jsonl)
git add .

# 2. Commit with conventional message
git commit -m "type(scope): description

Closes: <ISSUE-ID>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

# 3. Verify the closure is committed
git log -1 --name-only | grep issues.jsonl
```

## Verification

- [ ] `git status` shows no uncommitted changes
- [ ] `git log -1` shows the closure commit
- [ ] `.beads/issues.jsonl` is in the commit

## Example: Complete Closure Flow

```bash
# 1. Close the bead with detailed reason
bd close CookingAssistant-abc --reason="Implemented recipe rating system

What was done:
- Added rating column to recipes table with Alembic migration
- Created POST /api/recipes/{id}/rate endpoint with validation
- Added RatingStars component to RecipeDetail page
- Updated RecipeCard to show average rating

Tests: 8 unit tests, 2 integration tests, all passing
Files changed: models/recipe.py, api/recipes.py, RatingStars.tsx, RecipeCard.tsx"

# 2. IMMEDIATELY commit
git add .
git commit -m "feat(recipes): add recipe rating system

Users can now rate recipes 1-5 stars. Ratings are displayed
on recipe cards and detail pages.

Closes: CookingAssistant-abc

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

# 3. Verify
git log -1 --name-only
# Should show: .beads/issues.jsonl in the list
```

## CRITICAL RULES

- **One closure = One commit** - Never batch multiple closures
- **Commit IMMEDIATELY** - Don't do other work between close and commit
- **Include .beads/** - The commit MUST contain issues.jsonl changes
- **Never skip** - Even for "trivial" closures
