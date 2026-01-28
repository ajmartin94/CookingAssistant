---
name: plan
description: |
  Structure a brainstorm into a TDD-ready plan with acceptance criteria, layer breakdown,
  and independent review. Use this skill when: (1) a brainstorm.md exists and needs
  structuring for TDD, (2) the user says "plan this" or "make a plan", (3) preparing
  a feature for /tdd execution.
---

# Plan

Transform a brainstorm document into a structured plan that `/tdd` can execute.

## Multi-Feature Plans

A brainstorm may contain multiple features. The plan should break these into
**separate feature sections**, each sized for one TDD round. Each feature section
is independently executable by `/tdd`.

If a brainstorm is too large for one TDD session, split it into features that can
be executed sequentially. Note dependencies between features where order matters.

## Prerequisites

Verify `.plans/issue-{issue-number}/brainstorm.md` exists. If it doesn't, stop and
tell the user: "No brainstorm found. Run `/brainstorm` first to design the feature."

## Process

### 1. Read the Brainstorm

Read `.plans/issue-{issue-number}/brainstorm.md` to understand what
was designed.

### 2. Draft the Plan Structure

Build the plan with the following structure. Repeat the Feature section for each
feature in the brainstorm:

```markdown
# Plan: {overall name}

## Overview
What this plan covers and how many features/TDD rounds it contains.

## Feature Order
List features in execution order with dependencies noted.
1. Feature A (no dependencies)
2. Feature B (depends on A)

---

## Feature: {name}

### Summary
One paragraph: what we're building and why.

### Layers
Which layers are involved: [E2E, Backend, Frontend]

### Acceptance Criteria
What the E2E tests verify when this feature is complete.
- [ ] Criterion 1
- [ ] Criterion 2

### Backend
What the backend tests should cover and what implementation looks like.
- Tests: [what to test]
- Implementation: [brief approach]

### Frontend
What the frontend tests should cover and what implementation looks like.
- Tests: [what to test]
- Implementation: [brief approach]

### Breaking Changes
What existing behavior changes. What existing tests will likely break.
- [change 1]: [which tests/features affected]
- None (if no breaking changes)

---

## Feature: {next name}
[repeat structure]

---

## Open Questions
Anything unresolved that the user should decide before TDD starts.
```

### 3. Clarify with User

Present the draft plan. Use `AskUserQuestion` to clarify:
- Gaps in acceptance criteria
- Unclear implementation approaches
- Whether breaking changes are complete
- Feature ordering and dependencies
- Any open questions from the brainstorm

One topic per round, multiple questions per topic for efficiency.
Iterate until the user is satisfied with the structure.

### 4. Review Agents

Spawn 2-3 independent review sub-agents (Task tool, `subagent_type="general-purpose"`)
to critique the plan from different angles:

**Feasibility reviewer:**
```
Review this feature plan for feasibility:
[plan content]

Based on the project's current codebase (read CLAUDE.md and relevant source files),
identify:
- Missing dependencies or prerequisites
- Scope concerns (any single feature too large for one TDD session?)
- Technical risks or unknowns
- Whether feature ordering makes sense
```

**Completeness reviewer:**
```
Review this feature plan for completeness:
[plan content]

Identify:
- Acceptance criteria that are vague or untestable
- Missing edge cases or error scenarios
- Layers that should be involved but aren't listed
- Features that should be split further
```

**Migration reviewer:**
```
Review this feature plan for migration risk:
[plan content]

Based on the current codebase (read relevant test files and source),
identify:
- Existing tests that will break
- Existing features that depend on changed behavior
- Data migration needs
- Cross-feature conflicts
```

### 5. Present Review Feedback

Summarize all reviewer findings to the user. For each finding, use `AskUserQuestion`:
- Present the concern
- Options: address now (update plan) / accept the risk / split into separate feature

Iterate until the user approves.

### 6. Save

Save to: `.plans/issue-{issue-number}/plan.md`

Tell the user: "Plan saved. Run `/tdd` to execute the first feature, or specify
which feature to start with."

## Principles

- **One feature = one TDD round** — keep features independently executable
- **Plan is for the machine** — structured enough for TDD to parse
- **User decides** — reviewers surface concerns, user resolves them
- **Complete before starting** — open questions must be resolved before TDD
- **Breaking changes are explicit** — this feeds `/migrate` later
