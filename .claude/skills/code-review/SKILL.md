---
name: code-review
description: |
  Compare implementation against the original plan and project code standards.
  Use this skill when: (1) TDD and migration are complete and code needs review
  before PR, (2) the user says "review" or "code review", (3) verifying a feature
  matches its plan before merging.
---

# Code Review

Compare the implementation against the plan and project standards. Surface deviations
and conformance issues. This is the final gate before PR.

## Process

### 1. Gather Context

- Check for plan: `.plans/issue-{issue-number}/plan.md`
  - If it exists → use it as review baseline (normal flow)
  - If it doesn't exist (e.g., chore) → use the issue description as baseline instead
    (`gh issue view <number> --json body`). Skip the plan conformance reviewer in step 2.
- Get the full diff: `git diff main...HEAD`
- List all changed files: `git diff main...HEAD --name-only`

### 2. Spawn Review Agents

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

### 3. Present Findings

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
- Options: fix now / accept as-is / create follow-up task

### 4. Execute Fixes

**Context management**: Spawn a `general-purpose` sub-agent (via `Task` tool) when a fix
touches multiple files or requires reading surrounding code for context. Do simple
single-file cosmetic edits inline.

When spawning a sub-agent, provide:
- The specific file(s) and line numbers
- What standard or convention is violated
- What the fix should look like

For any "fix now" decisions:
- Make the change
- Fixes here should be cosmetic (naming, patterns, docs, minor standards issues)
- If a fix is significant enough that it could break tests, flag it and send it back through `/migrate` instead

### 5. Final Verification

- Confirm no unaddressed must-fix items remain
- Do NOT re-run the test suite — it's already green from `/migrate`
- If step 4 made code changes, run only the affected layer's lint/typecheck to catch syntax issues:
  ```bash
  make lint
  make typecheck
  ```

### 6. Summary

Present final state:
- Plan conformance: [percentage of criteria fully implemented]
- Standards issues fixed: [count]
- Quality issues fixed: [count]
- Accepted deviations: [list]
- Follow-up tasks created: [list]
- Lint/typecheck status: PASS (if fixes were made)

Tell the user: "Code review complete. Ready for PR."

## Principles

- **Plan is the source of truth** — deviations need justification
- **Standards are non-negotiable** — must-fix, not suggestions
- **Quality is contextual** — only flag concrete issues, not preferences
- **User decides on deviations** — extra features or different approaches aren't always wrong
- **Tests are migrate's job** — code-review does not run the test suite; the suite is already green from `/migrate`
- **Significant fixes go back** — if a review fix could break tests, route it through `/migrate`
