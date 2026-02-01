---
name: plan
description: |
  Structure triage/brainstorm output into TDD-ready user stories with acceptance criteria,
  layer breakdown, journey check, and independent review. Use this skill when: (1) triage
  and/or brainstorm output exists and needs structuring for TDD, (2) the user says "plan
  this" or "make a plan", (3) preparing a feature for /tdd execution.
---

# Plan

Transform triage and/or brainstorm output into a structured plan that `/tdd` can execute.

## User Stories, Not Features

The plan should break work into **user stories** — each describing a complete user-visible
outcome, sized for one TDD round. Each story is independently executable by `/tdd`.

Stories are scoped from the user's perspective, not by technical layer or component.
A good story answers: "What can the user do after this is done that they couldn't before?"

If the work is too large for one TDD session, split it into stories. Note dependencies
between stories where order matters — stories without dependencies can be executed in
parallel by `/tdd`.

**Every issue gets a plan.** The plan scales to the work:
- A small bug → one story, one acceptance criterion ("the bug is fixed"), one layer
- A small chore → one story describing the change and what to verify
- A large feature → multiple stories with full acceptance criteria, journey checks, and review

## Prerequisites

Check for input in this order:
1. `.plans/issue-{issue-number}/brainstorm.md` — use if it exists (richest context)
2. Triage comments on the GitHub issue — use if no brainstorm exists
3. If neither exists, stop: "No triage or brainstorm found. Run `/triage` first."

Also read the triage issue comments regardless of whether a brainstorm exists — the
articulated user need from triage is the foundation for user stories.

## Process

### 1. Read the Input

Read the brainstorm (if exists) and/or triage comments to understand the user need
and any design decisions made.

### 2. Draft the Plan Structure

Build the plan with the following structure. Repeat the Story section for each
story in the brainstorm:

```markdown
# Plan: {overall name}

## Overview
What this plan covers and how many stories/TDD rounds it contains.

## Story Order
List stories in execution order with dependencies noted.
1. Story name (no dependencies)
2. Story name (depends on Story 1)

---

## Story 1: {short name}

> *As a {user role}, I want to {action} so that {benefit}.*

### Layers
Which layers are involved: [E2E, Backend, Frontend]

### Acceptance Criteria
Written from the user's perspective. Each criterion should be directly testable
as an E2E scenario.
- [ ] I can {action} and see {result}
- [ ] When I {trigger}, {observable outcome} happens

### E2E
What the E2E tests verify. Each test maps to one or more acceptance criteria.
- **Tests:**
  - {User action} → {expected outcome}

### Backend
What the backend tests should cover and what implementation looks like.
- Tests: [what to test]
- Implementation: [brief approach]
(Omit this section if the story doesn't touch the backend.)

### Frontend
What the frontend tests should cover and what implementation looks like.
- Tests: [what to test]
- Implementation: [brief approach]

### Breaking Changes
What existing behavior changes. What existing tests will likely break.
- [change 1]: [which tests/features affected]
- None (if no breaking changes)

---

## Story 2: {next name}
[repeat story structure]

---

## Open Questions
Anything unresolved that the user should decide before TDD starts.
```

### 3. Clarify with User

Present the draft plan. Use `AskUserQuestion` to clarify:
- Gaps in acceptance criteria
- Unclear implementation approaches
- Whether breaking changes are complete
- Story ordering and dependencies
- Any open questions from the brainstorm

One topic per round, multiple questions per topic for efficiency.
Iterate until the user is satisfied with the structure.

### 4. Journey Check

Before review, evaluate whether this work creates or affects cross-feature user journeys.

**Ask two questions** (use `AskUserQuestion`):

1. **New journey**: "Does this feature complete a user journey that spans multiple features?
   For example, if we're adding shopping list generation from meal plans, the full journey
   is: create recipe → add to meal plan → generate shopping list → check off items.
   Should we add an E2E test for the full connected journey?"
   - Yes — add a cross-feature E2E test to the plan
   - No — this feature stands alone

2. **Affected existing journeys**: "Does this change affect any existing cross-feature
   workflows? For example, changing recipe data structures could affect meal plan display
   or shopping list generation."
   - Yes — identify which journeys and add verification to the plan
   - No existing journeys affected
   - Not sure — I'll investigate

If the user answers "Yes" to either, add a story or acceptance criteria to cover the
journey-level E2E test. If "Not sure" to #2, spawn a quick sub-agent to scan existing
E2E tests for related cross-feature workflows and report back.

Add a **Journey Impact** section to the plan output (after Open Questions):

```markdown
## Journey Impact
- **New journeys**: [none / description of new cross-feature journey to test]
- **Affected journeys**: [none / list of existing journeys impacted]
- **E2E coverage**: [what journey-level tests are added or updated]
```

### 5. Review Agents

Spawn 2-3 independent review sub-agents (Task tool, `subagent_type="general-purpose"`)
to critique the plan from different angles:

**Feasibility reviewer:**
```
Review this plan for feasibility:
[plan content]

Based on the project's current codebase (read CLAUDE.md and relevant source files),
identify:
- Missing dependencies or prerequisites
- Scope concerns (any single story too large for one TDD session?)
- Technical risks or unknowns
- Whether story ordering makes sense
```

**Completeness reviewer:**
```
Review this plan for completeness:
[plan content]

Identify:
- Acceptance criteria that are vague or untestable
- Missing edge cases or error scenarios
- Layers that should be involved but aren't listed
- Stories that should be split further
```

**Migration reviewer:**
```
Review this plan for migration risk:
[plan content]

Based on the current codebase (read relevant test files and source),
identify:
- Existing tests that will break
- Existing features that depend on changed behavior
- Data migration needs
- Cross-feature conflicts
```

### 6. Present Review Feedback

Summarize all reviewer findings to the user. For each finding, use `AskUserQuestion`:
- Present the concern
- Options: address now (update plan) / accept the risk / split into separate story

Iterate until the user approves.

### 7. Save

Save to: `.plans/issue-{issue-number}/plan.md`

Post a summary comment on the GitHub issue:

```bash
gh issue comment <number> --body "$(cat <<'EOF'
## Plan Complete

**Stories:** [count]
1. [Story name] — [one-line summary]
2. [Story name] — [one-line summary]

**Journey impact:** [none / new journey added / existing journey affected]

Full plan: `.plans/issue-<number>/plan.md`
EOF
)"
```

Tell the user: "Plan saved and posted to issue. Run `/tdd` to execute the first story,
or specify which story to start with."

## Principles

- **One story = one TDD round** — each story delivers a user-visible outcome
- **User perspective drives scope** — stories are sliced by what the user can do, not by technical layer
- **Plan is for the machine** — structured enough for TDD to parse
- **User decides** — reviewers surface concerns, user resolves them
- **Complete before starting** — open questions must be resolved before TDD
- **Breaking changes are explicit** — this feeds `/review` later
- **Journey awareness** — every plan considers cross-feature impact
