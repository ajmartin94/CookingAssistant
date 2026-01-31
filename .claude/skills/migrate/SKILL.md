---
name: migrate
description: |
  Interactive cleanup of broken tests and code after a new feature lands. Use this skill
  when: (1) TDD is complete but the full test suite has failures, (2) the user says
  "migrate" or "fix broken tests", (3) preparing a branch for PR after feature work.
---

# Migrate

Interactive cleanup after TDD execution. You run the suite, surface breakage, and
the user decides what to do about each failure. You execute their decisions.

## Prerequisites

- TDD execution is complete (new feature tests pass)
- Full test suite has not been verified green yet

## Process

### 0. Environment Setup

Verify infrastructure before running tests:

```bash
# Verify backend venv exists (NEVER claim "pytest unavailable" without checking)
make test-backend ARGS="--version"

# Verify frontend node_modules
ls frontend/node_modules/.bin/vitest
```

If venv or node_modules don't exist, run `make setup` first.

### 1. Run Full Suite

This is the single authoritative cross-layer test run. TDD sub-agents only verify their own layer — this is where cross-layer regressions surface.

Run all test layers from the repo root:

```bash
make test-backend
make test-frontend
make test-e2e
```

Collect all failures.

### 2. Categorize Failures

Separate failures into:

| Category | Meaning | Action |
|----------|---------|--------|
| New feature tests failing | Bug in the feature | Flag — TDD didn't complete cleanly |
| Existing tests failing | Cascade from new behavior | Present to user for decision |

All failures are caused by this branch — main is always green.

### 3. Present Each Failure

For each existing test failure caused by the new feature, use `AskUserQuestion`:

Present:
- Test name and file
- What it asserts (the old behavior)
- Why it fails (the new behavior)
- Relevant code diff if helpful

Options:
- **Update test** — modify assertions to reflect new correct behavior
- **Remove test** — this scenario no longer applies
- **This is a bug** — the feature broke something it shouldn't have; needs fixing
- **Skip for now** — revisit later

Group related failures by topic when possible (e.g., "These 4 tests all assert
the old response format for GET /recipes").

### 4. Execute Decisions

**Context management**: Spawn a `general-purpose` sub-agent (via `Task` tool) when a fix
requires reading multiple files or making coordinated changes across files. Do simple
single-file edits (update one assertion, delete one test) inline to avoid unnecessary overhead.

When spawning a sub-agent, provide:
- The specific test file(s) and line numbers
- What the old behavior was and what the new behavior is
- The exact decision (update/remove)
- Instructions to run the affected test file after the fix: `make test-backend ARGS="path/to/test.py"`

For each decision:

- **Update test**: Modify the test to assert new behavior. Run the specific test file to confirm it passes.
- **Remove test**: Delete the test. If it was the only test for that behavior, ask
  if replacement coverage is needed.
- **Bug**: Create a LEARNING task noting the regression. Do not fix in migration —
  this goes back to the feature implementation.
- **Skip**: Leave as-is, note it for later.

### 5. Database Migrations

Evaluate code changes in this branch for database impact:

- Check for new/modified models, schema changes, or new fields
- Check for changed relationships or constraints
- Check for renamed or removed columns/tables

If database changes are detected, present to user via `AskUserQuestion`:
- What changed (model/field/relationship)
- Whether a migration is needed (new table, altered column, etc.)
- Suggested migration approach (e.g., Alembic revision, data backfill, nullable transition)

For each migration needed:
- **Generate migration**: Create the migration file, run it, verify it applies cleanly
- **Data backfill**: If existing rows need default values, suggest and confirm approach
- **Destructive changes**: Flag column/table removals — confirm data loss is acceptable

If no database changes detected, skip this step.

### 6. Verify

After all decisions are executed:
- Run only the affected layers again (e.g., if you only updated backend tests, run `make test-backend`)
- If new failures appear (from the fixes), repeat from step 3
- Once affected layers are green, run the full suite one final time to confirm:
  ```bash
  make test-backend
  make test-frontend
  make test-e2e
  ```
- Continue until suite is green or only skipped/bug items remain

### 7. Summary

Present final state:
- Tests updated: [count and list]
- Tests removed: [count and list]
- Migrations created: [count and list]
- Bugs found: [count and list — these need attention]
- Skipped: [count and list]
- Suite status: GREEN / remaining failures

Tell the user: "Migration complete. Run `/code-review` to verify against the plan
before PR."

## Principles

- **User decides** — never update or remove a test without explicit approval
- **Group related failures** — don't ask about 10 tests one at a time if they're the same issue
- **Bugs go back** — if the feature broke something unintentionally, that's a bug, not a migration
- **Green suite before PR** — the goal is a clean test suite
