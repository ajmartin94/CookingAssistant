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

Read the plan file. Create Tasks for each user story, with `addBlockedBy` enforcing
outside-in order **within** each story:

| Phase | Type | Verify |
|-------|------|--------|
| E2E RED | Write E2E test | New test file FAILs |
| Backend RED | Write backend tests | New test file FAILs |
| Backend GREEN | Implement backend | Backend layer PASS |
| Frontend RED | Write frontend tests | New test file FAILs |
| Frontend GREEN | Implement frontend | Frontend layer PASS |
| E2E GREEN | Verify acceptance | E2E layer PASS |

Skip layers not relevant to the plan. Use plan's acceptance criteria for E2E phases.
The plan's complexity determines TDD scope — a one-story bug plan produces a single
RED/GREEN pair, a multi-story feature plan produces the full outside-in sequence.

#### Parallel Execution

Parallelization is allowed **only when there are zero dependencies** between the
work items. Two types of safe parallelism:

1. **Within a story**: Frontend RED and Backend RED for the same story can run in
   parallel (they write tests in different layers with no shared files)
2. **Across stories**: Unrelated stories that share no code, models, or API surface
   can run their phases concurrently

**Do NOT parallelize when:**
- Stories touch the same models, routes, components, or shared infrastructure
- A GREEN phase in one story could affect files another story reads
- You are unsure — default to sequential

When creating tasks:
- Use `addBlockedBy` for within-story phase ordering (RED → GREEN)
- Use `addBlockedBy` for cross-story dependencies when stories share any code surface
- Only leave tasks unblocked when you are confident they are fully independent

### 2. Execution Loop

For each ready task (pending, not blocked). When multiple tasks are ready
simultaneously (e.g., independent stories), execute them in parallel using
multiple `Task` tool calls in a single message:

1. Mark task `in_progress`
2. Spawn **impl sub-agent** using custom agent type:
   - RED phase: `Task` tool with `subagent_type="tdd-red-impl"`
   - GREEN phase: `Task` tool with `subagent_type="tdd-green-impl"`
3. Run verification (RED: new test file must FAIL; GREEN: new RED tests must PASS — existing test breakage is recorded as friction)
4. Spawn **review sub-agent** (`Task` tool, `subagent_type="tdd-review"`)
5. Review PASS → mark task `completed`, summarize to user
6. Review FAIL → retry from step 2 (max 3 attempts)
7. After 3 failures → **leave task `in_progress`**, record friction (see §4), continue to next ready task

**Agent Definitions:**
- `tdd-red-impl`: Has Read/Write/Edit/Bash - writes failing tests (Opus model)
- `tdd-green-impl`: Has Read/Write/Edit/Bash - implements code, **never modifies test files** (Opus model)
- `tdd-review`: Has Read/Bash only - cannot edit, reviews artifacts (Sonnet model)

**Critical rule**: GREEN phase agents must make the RED tests pass **as written**.
They cannot modify, weaken, or delete test files. If existing tests break due to
intentional behavior changes, record friction and leave resolution to `/review`.

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

### 4. Friction Recording

The orchestrator (you) records friction to `.plans/issue-{issue-number}/friction.md`
(create if it doesn't exist). Sub-agents report friction in their output — you
extract it and append it to the file. Do not stop execution. Do not attempt to
resolve friction — that is `/review`'s job.

**Sources of friction:**

- Sub-agent reports a `## Friction` section in its output (extract and record)
- A command fails unexpectedly during verification (missing dependency, wrong path)
- Impl fails review 2+ times on the same issue
- Sub-agent installs a new library not in project standards
- Verification produces unexpected results (tests pass when should fail, etc.)
- A task fails 3 times and is left `in_progress` (see §2 step 7)
- A repeated bash command fails in a way that suggests documentation is missing

**When you detect friction from any source, append an entry to friction.md:**

```markdown
### [brief description]
- **Phase**: [RED/GREEN] [layer]
- **What happened**: [description]
- **What was ambiguous or missing**: [gap in guidance, docs, or tooling]
- **What the sub-agent decided** (if applicable): [decision made]
```

Keep entries factual. Do not suggest resolutions — `/review` determines the right fix
with user input.

### 5. User Communication

**After each task completes:** One-line summary.

> "Backend RED complete. 3 tests: create_recipe, duplicate_rejected, missing_fields_error."

**After all tasks complete:** Summary of completed tasks, incomplete tasks, and
friction count. Tell the user: "N friction items recorded for `/review` to resolve."

### 6. Resume

If Tasks already exist when invoked:
- Check status of existing tasks
- For `in_progress` tasks: run relevant tests to determine current state
- Continue execution from where it left off

If no Tasks exist but plan references prior work:
- Run the layer suite (`make test-backend`, `make test-frontend`, or `make test-e2e`)
- Tests exist and pass → phase done
- Tests exist and fail → GREEN phase needed
- No tests → RED phase needed
- Create Tasks for remaining work only
