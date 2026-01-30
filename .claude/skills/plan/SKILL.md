---
name: plan
description: |
  Structure a brainstorm into TDD-ready user stories with acceptance criteria, layer
  breakdown, and independent review. Use this skill when: (1) a brainstorm.md exists and needs
  structuring for TDD, (2) the user says "plan this" or "make a plan", (3) preparing
  a feature for /tdd execution.
---

# Plan

Transform a brainstorm document into a structured plan that `/tdd` can execute.

## User Stories, Not Features

A brainstorm may contain multiple capabilities. The plan should break these into
**user stories** — each describing a complete user-visible outcome, sized for one
TDD round. Each story is independently executable by `/tdd`.

Stories are scoped from the user's perspective, not by technical layer or component.
A good story answers: "What can the user do after this is done that they couldn't before?"

If a brainstorm is too large for one TDD session, split it into stories that can
be executed sequentially. Note dependencies between stories where order matters.

## Prerequisites

Verify `.plans/issue-{issue-number}/brainstorm.md` exists. If it doesn't, stop and
tell the user: "No brainstorm found. Run `/brainstorm` first to design the feature."

## Process

### 1. Read the Brainstorm

Read `.plans/issue-{issue-number}/brainstorm.md` to understand what
was designed.

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

### 4. Review Agents

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

### 5. Present Review Feedback

Summarize all reviewer findings to the user. For each finding, use `AskUserQuestion`:
- Present the concern
- Options: address now (update plan) / accept the risk / split into separate story

Iterate until the user approves.

### 6. Save

Save to: `.plans/issue-{issue-number}/plan.md`

Tell the user: "Plan saved. Run `/tdd` to execute the first story, or specify
which story to start with."

## Principles

- **One story = one TDD round** — each story delivers a user-visible outcome
- **User perspective drives scope** — stories are sliced by what the user can do, not by technical layer
- **Plan is for the machine** — structured enough for TDD to parse
- **User decides** — reviewers surface concerns, user resolves them
- **Complete before starting** — open questions must be resolved before TDD
- **Breaking changes are explicit** — this feeds `/migrate` later
