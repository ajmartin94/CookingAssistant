---
name: tdd
description: |
  TDD orchestration that executes a feature plan through outside-in test-driven development
  using impl/review sub-agents with independent contexts. Use this skill when: (1) a plan
  exists and the user wants to execute it via TDD, (2) the user says "run TDD" or "execute
  this plan", (3) resuming a partially completed TDD session with existing Tasks.
---

# TDD Orchestrator

Execute a feature plan through outside-in TDD. Manage tasks, spawn sub-agents, surface
friction. Never write code yourself.

## Workflow

### 1. Setup

Read the plan file. Create Tasks with `addBlockedBy` enforcing outside-in order:

| Phase | Type | Verify |
|-------|------|--------|
| E2E RED | Write E2E test | Tests FAIL |
| Backend RED | Write backend tests | Tests FAIL |
| Backend GREEN | Implement backend | ALL tests PASS |
| Frontend RED | Write frontend tests | Tests FAIL |
| Frontend GREEN | Implement frontend | ALL tests PASS |
| E2E GREEN | Verify acceptance | E2E tests PASS |

Skip layers not relevant to the plan. Use plan's acceptance criteria for E2E phases.

### 2. Execution Loop

For each ready task (pending, not blocked):

1. Mark task `in_progress`
2. Spawn **impl sub-agent** (`Task` tool, `subagent_type="general-purpose"`)
3. Run verification (RED: new tests must FAIL; GREEN: ALL tests must PASS)
4. Spawn **review sub-agent** (`Task` tool, `subagent_type="general-purpose"`)
5. Review PASS → mark task `completed`, summarize to user
6. Review FAIL → retry from step 2 (max 3 attempts)
7. After 3 failures → mark task `completed`, create LEARNING task, continue to next

### 3. Sub-Agent Prompts

#### Impl — RED phase

```
Write failing tests for: [task description]

Context from the plan:
[relevant plan section]

Follow project conventions (CLAUDE.md). Tests must fail against current codebase.
Run the tests yourself to confirm they fail.

Report:
- Files created/modified
- Test names and what each verifies
- Test output showing failures
```

#### Impl — GREEN phase

```
Make the failing tests pass for: [task description]

These tests currently fail:
[test file paths from RED phase]

Write minimal implementation. Follow project conventions (CLAUDE.md).
Run ALL tests (not just new ones) to confirm the full suite passes.

If existing tests fail because this feature intentionally changes behavior,
update those tests to reflect the new behavior. Do NOT weaken assertions
or delete tests — update them to test the new correct behavior.

Report:
- Files created/modified
- Implementation approach (brief)
- New tests now passing: [list]
- Existing tests updated: [list + why each changed]
- Full test output
```

#### Review — any phase

```
Review the code written for: [task description]

Phase: [RED/GREEN]
Files changed: [file paths from impl output]

Evaluate against project standards (follow CLAUDE.md references to testing standards).
You have not seen the implementation reasoning — evaluate the artifact only.

For GREEN phases with existing test modifications:
- Verify each change is legitimate (behavior intentionally changed)
- FAIL if tests were weakened, assertions removed, or tests deleted without replacement

Report:
- PASS or FAIL
- Specific reasons (what meets or violates standards)
- If FAIL: what needs to change
```

### 4. Friction Detection

Create a LEARNING task (do not stop execution) when:

- A command fails unexpectedly (missing dependency, wrong path)
- Impl fails review 2+ times on the same issue
- Sub-agent installs a new library not in project standards
- Sub-agent finds competing patterns and must choose
- Verification produces unexpected results (tests pass when should fail, etc.)

LEARNING task format:
- Subject: `LEARNING: [brief description]`
- Description: what happened, what was ambiguous, what the sub-agent decided

### 5. User Communication

**After each task completes:** One-line summary.

> "Backend RED complete. 3 tests: create_recipe, duplicate_rejected, missing_fields_error."

**After all tasks complete:** Full summary + all LEARNING tasks presented together.

### 6. Resume

If Tasks already exist when invoked:
- Check status of existing tasks
- For `in_progress` tasks: run relevant tests to determine current state
- Continue execution from where it left off

If no Tasks exist but plan references prior work:
- Run the test suite
- Tests exist and pass → phase done
- Tests exist and fail → GREEN phase needed
- No tests → RED phase needed
- Create Tasks for remaining work only
