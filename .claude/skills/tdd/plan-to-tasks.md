---
name: plan-to-tasks
description: Convert a plan document into user stories and pour molecules for each. Use at the start of a workflow to set up the bead structure.
---

# Plan to Tasks Conversion

Convert a plan document into executable user stories with beads and dependencies.

## Input

- Plan document path

## Process

1. Read the plan document
2. Identify discrete user stories
3. For each user story, pour an outside-in-tdd molecule
4. Set up cross-story dependencies if needed
5. Present structure for human approval

## Step 1: Read Plan

```bash
cat docs/plans/YYYY-MM-DD-feature-name.md
```

Look for:
- Feature goals
- User-facing functionality
- Acceptance criteria
- Dependencies between features

## Step 2: Identify User Stories

Break the plan into user stories. Each story should:

- Deliver one user-visible outcome
- Be independently testable via E2E
- Be completable in one TDD cycle

**Good story scope:**
- "User creates recipe via chat"
- "User edits recipe title via chat"
- "User sees recipe suggestions based on ingredients"

**Too large (split it):**
- "User has full chat functionality" → multiple stories

**Too small (combine):**
- "User clicks button" → part of a larger story

## Step 3: Pour Molecules

For each user story:

```bash
bd mol pour outside-in-tdd \
  --var story="[User story name]" \
  --var e2e_outcome="[What E2E test verifies]"
```

Example:
```bash
bd mol pour outside-in-tdd \
  --var story="User creates recipe via chat" \
  --var e2e_outcome="Recipe exists in DB after tool approval"
```

## Step 4: Cross-Story Dependencies

If Story B depends on Story A:

```bash
# Get the e2e-green bead ID from Story A
bd show <story-a-mol-id>

# Add dependency from Story B's e2e-red to Story A's e2e-green
bd dep add <story-b-e2e-red-id> <story-a-e2e-green-id>
```

This ensures Story B doesn't start until Story A is complete.

## Step 5: Present for Approval

Output the structure for human review:

```markdown
# Task Structure

## User Stories (X total)

### Story 1: [Name]
- Molecule ID: [id]
- E2E Outcome: [what it verifies]
- Dependencies: [none | depends on Story X]

### Story 2: [Name]
...

## Dependency Graph

```
Story 1 (no deps)
  ↓
Story 2 (depends on Story 1)
  ↓
Story 3 (depends on Story 2)

Story 4 (no deps, parallel with 1-3)
```

## Ready to Execute?

Run `bd ready` to see available work.
```

## Output Format

```
STATUS: COMPLETE|FAILED
STORIES_CREATED: <count>
MOLECULES_POURED: <list of molecule IDs>
DEPENDENCIES_ADDED: <count>
READY_TO_START: <list of stories with no blockers>
```

## Guidelines

### Story Naming

Use format: "User [action] [outcome]"

- "User creates recipe via chat"
- "User searches recipes by ingredient"
- "User shares recipe with link"

### E2E Outcome

Describe the observable outcome:

- "Recipe exists in DB with correct data"
- "Search results contain matching recipes"
- "Share link returns recipe to anonymous user"

### Dependencies

Only add cross-story dependencies when:
- Story B literally cannot start without Story A's functionality
- Not just "it would be nice to have A first"

## Human Approval

Wait for human to approve the structure before proceeding to execution.

They may:
- Request story splits/combines
- Adjust dependencies
- Add acceptance criteria
- Approve and start execution
