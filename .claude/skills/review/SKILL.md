---
name: review
description: |
  Final gate before PR. Runs the full test suite to catch regressions, then reviews
  code against the plan and project standards. Use this skill when: (1) TDD is complete
  and the branch needs validation before PR, (2) the user says "review" or "ready for PR",
  (3) multiple TDD runs have completed and the branch needs a final check.
---

# Review

Final gate between `/tdd` completion and PR creation. Phase 1 ensures the suite is
healthy. Phase 2 reviews code against the plan and standards. If Phase 2 fixes break
tests, loop back to Phase 1.

Handles output from one or more `/tdd` runs on the same branch.

## Prerequisites

- `/tdd` has completed on this branch
- `.plans/issue-{issue-number}/plan.md` exists (every issue gets a plan)

## Process

### Phase 1: Suite Health

#### 1.0 Environment Setup

Verify infrastructure before running tests:

```bash
# Verify backend venv exists
make test-backend ARGS="--version"

# Verify frontend node_modules
ls frontend/node_modules/.bin/vitest
```

If venv or node_modules don't exist, run `make setup` first.

#### 1.1 Run Full Suite

This is the single authoritative cross-layer test run. TDD sub-agents only verify
their own layer — this is where cross-layer regressions surface.

```bash
make test-backend
make test-frontend
make test-e2e
```

Collect all failures.

#### 1.2 Categorize Failures

Separate failures into:

| Category | Meaning | Action |
|----------|---------|--------|
| New feature tests failing | Bug in the feature | Flag — TDD didn't complete cleanly |
| Existing tests failing | Cascade from new behavior | Present to user for decision |

All failures are caused by this branch — main is always green.

#### 1.3 Present Each Failure

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

#### 1.4 Execute Decisions

**Context management**: Spawn a `general-purpose` sub-agent (via `Task` tool) when a fix
requires reading multiple files or making coordinated changes across files. Do simple
single-file edits (update one assertion, delete one test) inline.

When spawning a sub-agent, provide:
- The specific test file(s) and line numbers
- What the old behavior was and what the new behavior is
- The exact decision (update/remove)
- Instructions to run the affected test file after the fix

For each decision:
- **Update test**: Modify the test to assert new behavior. Run the specific test to confirm pass.
- **Remove test**: Delete the test. If it was the only test for that behavior, ask if replacement coverage is needed.
- **Bug**: Create a LEARNING task noting the regression. Fix the bug before continuing.
- **Skip**: Leave as-is, note it for later.

#### 1.5 Database Migrations

Evaluate code changes for database impact:

- Check for new/modified models, schema changes, or new fields
- Check for changed relationships or constraints
- Check for renamed or removed columns/tables

If database changes are detected, present to user via `AskUserQuestion`:
- What changed (model/field/relationship)
- Whether a migration is needed
- Suggested migration approach

If no database changes detected, skip this step.

#### 1.6 Verify Suite Health

After all decisions are executed:
- Run only the affected layers again
- If new failures appear, repeat from 1.3
- Once affected layers are green, run the full suite one final time:
  ```bash
  make test-backend
  make test-frontend
  make test-e2e
  ```
- Continue until suite is green or only skipped/bug items remain

---

### Phase 2: Code Review

#### 2.1 Gather Context

- Read the plan: `.plans/issue-{issue-number}/plan.md`
- Get the full diff: `git diff main...HEAD`
- List all changed files: `git diff main...HEAD --name-only`

#### 2.2 Spawn Review Agents

Spawn 4 independent review sub-agents (Task tool, `subagent_type="general-purpose"`):

**Plan conformance reviewer:**
```
Compare this implementation against its plan.

Plan:
[plan.md content]

Changed files:
[file list]

For each feature in the plan, evaluate:
- Is it fully implemented? (all acceptance criteria met)
- Is anything missing?
- Was anything added that isn't in the plan?
- Does the approach match what was specified?

Report:
- IMPLEMENTED: criteria met as planned
- DEVIATED: implemented differently than planned (explain how)
- MISSING: planned but not implemented
- EXTRA: implemented but not in plan
```

**Standards conformance reviewer:**
```
Review these code changes against project standards.

Changed files:
[file list]

Read the project's CLAUDE.md and relevant subdirectory CLAUDE.md files.
Check each changed file against the standards defined there.

Evaluate:
- Naming conventions followed?
- File organization correct?
- Patterns match established codebase conventions?
- Error handling consistent with project style?
- Test structure follows testing standards?

Report each violation with:
- File and line
- What standard is violated
- What it should be instead
```

**Quality reviewer:**
```
Review these code changes for quality issues.

Changed files:
[file list]

Read the changed files and evaluate:
- Dead code or unused imports introduced?
- Overly complex logic that could be simplified?
- Missing error handling at system boundaries?
- Hardcoded values that should be configurable?
- Security concerns (injection, XSS, exposed secrets)?
- Performance concerns (N+1 queries, unnecessary re-renders)?

Report only concrete issues, not style preferences.
```

**Docs-update reviewer:**
```
Review these code changes for documentation impact.

Changed files:
[file list]

Read ALL durable context files:
- CLAUDE.md (root)
- backend/CLAUDE.md
- frontend/CLAUDE.md
- e2e/CLAUDE.md
- All files in docs/

For each changed file, evaluate:
- Does it introduce a new pattern, convention, or architectural decision
  that should be recorded in a CLAUDE.md or docs/ file?
- Does it change existing behavior that is currently documented?
- Does it add a new dependency, command, or configuration that should
  be mentioned in setup/quick-start docs?

Report:
- STALE: existing documentation that no longer matches the code
- MISSING: new patterns or conventions that should be documented
- OK: no documentation impact

Only flag concrete gaps. Do not suggest adding docs for trivial changes.
```

#### 2.3 Present Findings

Summarize all reviewer findings grouped by severity:

**Must fix** (blocks PR):
- Missing acceptance criteria
- Standards violations
- Security issues

**Should fix** (improves quality):
- Deviations from plan approach
- Quality concerns
- Minor standards issues

**Note** (informational):
- Extra features added beyond plan
- Suggestions for future improvement

For each finding, use `AskUserQuestion`:
- Present the issue
- Options: fix now / accept as-is / create follow-up issue

#### 2.4 Execute Fixes

**Context management**: Spawn a `general-purpose` sub-agent (via `Task` tool) when a fix
touches multiple files or requires reading surrounding code. Do simple single-file
cosmetic edits inline.

For "fix now" decisions:
- Make the change
- If the fix could break tests → **loop back to Phase 1** (re-run suite from 1.1)
- If the fix is cosmetic only → run lint/typecheck for the affected layer

---

### Phase 2.5: Friction Resolution

Check for `.plans/issue-{issue-number}/friction.md`. If it exists, `/tdd` recorded
friction during execution that needs resolution here.

For each friction entry:

1. Read the entry and understand the gap
2. Determine the appropriate resolution:
   - **Durable context update** — update CLAUDE.md, docs/, or scripts to prevent recurrence
     (e.g., a repeated bash failure → add a make target or document the correct command)
   - **Breaking test resolution** — existing tests broke due to intentional behavior changes
     during GREEN phase. Present to user with same options as Phase 1.3 (update/remove/bug/skip)
   - **Incomplete task** — a task left `in_progress` after 3 failures. Diagnose the root cause,
     fix the underlying issue, and complete the task
   - **Follow-up issue** — the friction reveals a larger problem that shouldn't block this PR
3. Present each friction item to the user via `AskUserQuestion` with resolution options
4. Execute the resolution
5. If any resolution changes code or tests → **loop back to Phase 1** (re-run suite)

After all friction is resolved, delete the friction file.

---

### Phase 3: Final Gate

1. Confirm no unaddressed must-fix items remain
2. Confirm suite is green (from Phase 1, or re-verified after Phase 2 fixes)
3. Run lint/typecheck if any Phase 2 cosmetic fixes were made:
   ```bash
   make lint
   make typecheck
   ```
4. Post summary comment on the GitHub issue

### Summary

Present final state:

- **Suite health**: Tests updated [count], removed [count], migrations [count], bugs [count], skipped [count]
- **Friction resolved**: [count] — durable context updates [count], breaking tests fixed [count], incomplete tasks completed [count]
- **Plan conformance**: [percentage of criteria fully implemented]
- **Standards issues fixed**: [count]
- **Quality issues fixed**: [count]
- **Accepted deviations**: [list]
- **Follow-up issues created**: [list]
- **Suite status**: GREEN / remaining failures

Tell the user: "Review complete. Ready for PR."

## Principles

- **Suite green is non-negotiable** — the branch must pass all tests before PR
- **Plan is the source of truth** — deviations need justification
- **Standards are non-negotiable** — must-fix, not suggestions
- **Quality is contextual** — only flag concrete issues, not preferences
- **User decides** — never update or remove a test without explicit approval
- **Group related failures** — don't ask about 10 tests one at a time if they're the same issue
- **Bugs get fixed, not deferred** — if the feature broke something unintentionally, fix it here
- **Phase 2 fixes that break tests loop back** — no skipping the suite re-run
