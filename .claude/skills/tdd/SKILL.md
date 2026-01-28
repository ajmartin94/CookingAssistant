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

## Prerequisites

Verify `.plans/issue-{issue-number}/plan.md` exists. If it doesn't, stop and
tell the user: "No plan found. Run `/plan` first to structure the implementation."

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
2. Spawn **impl sub-agent** using custom agent type:
   - RED phase: `Task` tool with `subagent_type="tdd-red-impl"`
   - GREEN phase: `Task` tool with `subagent_type="tdd-green-impl"`
3. Run verification (RED: new tests must FAIL; GREEN: ALL tests must PASS)
4. Spawn **review sub-agent** (`Task` tool, `subagent_type="tdd-review"`)
5. Review PASS → mark task `completed`, summarize to user
6. Review FAIL → retry from step 2 (max 3 attempts)
7. After 3 failures → mark task `completed`, create LEARNING task, continue to next

**Agent Definitions:**
- `tdd-red-impl`: Has Read/Write/Edit/Bash - writes failing tests (Opus model)
- `tdd-green-impl`: Has Read/Write/Edit/Bash - implements code (Opus model)
- `tdd-review`: Has Read/Bash only - cannot edit, reviews artifacts (Sonnet model)

### 3. Sub-Agent Prompts

The agent definitions (`.claude/agents/tdd-*.md`) provide behavioral rules and required reading.
Your prompts provide task-specific context only.

#### Impl — RED phase (tdd-red-impl agent)

```
Write failing tests for: [task description]

Layer: [E2E/backend/frontend]

Context from the plan:
[relevant plan section - acceptance criteria, expected behavior]

Files to understand:
[existing related files the agent should read first]
```

#### Impl — GREEN phase (tdd-green-impl agent)

```
Make the failing tests pass for: [task description]

Layer: [E2E/backend/frontend]

Failing test files:
[test file paths from RED phase]

Related implementation files:
[existing files in the area being modified]
```

#### Review — any phase (tdd-review agent)

```
Review the [RED/GREEN] phase output for: [task description]

Layer: [E2E/backend/frontend]

Files changed:
[file paths from impl output]
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
