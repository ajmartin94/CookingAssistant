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

- Read the plan: `.claude/plans/YYYY-MM-DD-{feature-slug}/plan.md`
- Get the full diff: `git diff main...HEAD`
- List all changed files: `git diff main...HEAD --name-only`

### 2. Spawn Review Agents

Spawn 3 independent review sub-agents (Task tool, `subagent_type="general-purpose"`):

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

For any "fix now" decisions:
- Make the change
- Run relevant tests to confirm nothing breaks

### 5. Final Verification

- Run full test suite one last time
- Confirm suite is green
- Confirm no unaddressed must-fix items remain

### 6. Summary

Present final state:
- Plan conformance: [percentage of criteria fully implemented]
- Standards issues fixed: [count]
- Quality issues fixed: [count]
- Accepted deviations: [list]
- Follow-up tasks created: [list]
- Suite status: GREEN

Tell the user: "Code review complete. Ready for PR."

## Principles

- **Plan is the source of truth** — deviations need justification
- **Standards are non-negotiable** — must-fix, not suggestions
- **Quality is contextual** — only flag concrete issues, not preferences
- **User decides on deviations** — extra features or different approaches aren't always wrong
- **Green suite always** — never approve with failing tests
