# Agent-Driven TDD Workflow

> **Status:** Draft - Pending Review
> **Created:** 2026-01-21
> **Goal:** Establish an automated software development process that reduces rework cycles and documentation drift through disciplined TDD with agent review gates.

---

## Executive Summary

This design defines an agent-driven development workflow built on:

1. **Outside-in TDD** - E2E tests define acceptance criteria first; backend/frontend implement to satisfy them
2. **Implementation + Review gates** - Each phase has a fresh-context reviewer to catch quality issues early
3. **Beads as single source of truth** - All state, audit trail, and dependencies live in beads
4. **Orchestrator + Subagent architecture** - Parent agent manages flow; subagents do domain work

The system uses beads molecules (formulas) to template the workflow structure, ensuring consistent task breakdown and dependency management.

---

## Problem Statement

Current pain points:
- **Rework cycles** - Review catches real issues, but too late in the process
- **Integration surprises** - Individual pieces work but don't integrate
- **Documentation drift** - Knowledge learned during implementation doesn't make it back to docs
- **Tests verify process, not outcomes** - Tests pass but features don't actually work

Root cause: No systematic gates that verify *outcomes* at each phase, and no audit trail to trace failures back to their source.

---

## Solution Overview

### The Complete Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  PLAN                                                           │
│  Human creates or refines plan document                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  PLAN → TASKS (plan-to-tasks skill)                             │
│  - Parse plan into user stories                                 │
│  - Pour one molecule per story (outside-in-tdd formula)         │
│  - Beads created with dependencies, acceptance criteria         │
│  - Human reviews bead structure before proceeding               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  EXECUTE TASKS (orchestrator)                                   │
│  Loop: bd ready → run ready tasks in parallel → repeat          │
│  Each task: impl → review (loop until pass or max attempts)     │
│  Failed reviews auto-retry with feedback; blocked after max     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  DOCS REVIEW                                                    │
│  - Aggregate learnings from all tasks                           │
│  - docs-plan: propose changes (back-and-forth with user)        │
│  - Human approval                                               │
│  - docs-impl → docs-review loop                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  PLAN VS REALITY                                                │
│  - Compare original plan to what was built                      │
│  - Produce deviation report                                     │
│  - Human reviews, decides accept/rework                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  FINAL APPROVAL                                                 │
│  - Manual testing by human                                      │
│  - Approve → PR to main                                         │
└─────────────────────────────────────────────────────────────────┘
```

### Outside-In TDD Structure

Each user story follows this pattern:

```
E2E RED (user journey defined, test fails)
    ↓
Backend RED → GREEN (API built, tests pass)
    ↓  (parallel where independent)
Frontend RED → GREEN (UI built, tests pass)
    ↓
E2E GREEN (journey now passes) ← acceptance gate
```

The E2E test defines what "done" looks like from the user's perspective. Backend and frontend work toward making it pass. Integration surprises are caught because E2E is the acceptance criteria.

---

## Architecture

### Hybrid: Orchestrator + Subagents

```
┌─────────────────────────────────────────────────────┐
│  ORCHESTRATOR (parent Claude Code session)          │
│  - Manages flow, doesn't write code                 │
│  - Uses beads as single source of truth             │
│  - Spawns subagents for each phase                  │
│  - Captures outputs, writes to bead notes           │
│  - Enforces gates: won't proceed if review fails    │
└─────────────────────────────────────────────────────┘
            │                           │
            ↓                           ↓
┌─────────────────────┐     ┌─────────────────────┐
│  IMPL SUBAGENT      │     │  REVIEW SUBAGENT    │
│  (has impl skill)   │     │  (fresh context)    │
│  - Writes code      │     │  (has review skill) │
│  - Returns summary  │     │  - Reviews artifact │
└─────────────────────┘     │  - Returns verdict  │
                            └─────────────────────┘
```

**Why fresh context for review:** The reviewer can't see the implementer's reasoning or shortcuts—only the artifact. This catches issues that would slip through self-review.

### Orchestrator Loop

```
1. bd ready → get tasks with no blockers
2. For each ready task (parallel if multiple):
   a. Parse bead notes to determine current phase
   b. Spawn appropriate subagent (e.g., backend-red-impl)
   c. Capture output, write to bead notes
   d. Run verification (tests fail for RED, tests pass for GREEN)
   e. Spawn review subagent (fresh context)
   f. If review passes → advance phase
   g. If review fails → retry impl with feedback (up to max)
   h. If max attempts → mark bead blocked
3. When task completes all phases → mark complete
4. Repeat until bd ready returns empty
5. Trigger docs-plan phase
6. Trigger plan-reality-compare phase
```

### Bead Note Format

Structured for parseability and auditability:

```
[2026-01-21T14:32:00] PHASE:RED-IMPL:START
[2026-01-21T14:35:12] PHASE:RED-IMPL:COMPLETE
  Tests written: test_create_recipe.py
  Outcomes verified: recipe count increases, recipe exists in DB
[2026-01-21T14:35:15] PHASE:RED-VERIFY:PASS - 3 tests fail as expected
[2026-01-21T14:35:20] PHASE:RED-REVIEW:START
[2026-01-21T14:38:45] PHASE:RED-REVIEW:PASS
  Criteria met: outcome verification, no mocking own backend
[2026-01-21T14:38:50] PHASE:GREEN-IMPL:START
...
```

**Resumability:** If the session crashes, a new orchestrator reads bead notes, sees last completed phase, and picks up from there.

### Failure Handling

- **Review fails:** Orchestrator spawns implementation subagent again with review feedback
- **Loop:** Until review passes or max attempts reached
- **Max attempts exceeded:** Mark bead as blocked, add note explaining failure, continue other independent tasks
- **Blocked tasks:** Surface for human intervention; other work continues

---

## Beads Molecules

### Formula: outside-in-tdd

The formula templates one user story's workflow:

```json
{
  "name": "outside-in-tdd",
  "description": "Outside-in TDD workflow for a user story",
  "variables": {
    "story": { "required": true, "description": "User story name" },
    "e2e_outcome": { "required": true, "description": "What E2E test verifies" }
  },
  "steps": [
    {
      "id": "e2e-red",
      "title": "[e2e-red] {{story}} - E2E test design",
      "type": "task",
      "acceptance": "E2E test verifies: {{e2e_outcome}}"
    },
    {
      "id": "backend-red",
      "title": "[backend-red] {{story}} - Backend test design",
      "depends_on": ["e2e-red"]
    },
    {
      "id": "backend-green",
      "title": "[backend-green] {{story}} - Backend implementation",
      "depends_on": ["backend-red"]
    },
    {
      "id": "frontend-red",
      "title": "[frontend-red] {{story}} - Frontend test design",
      "depends_on": ["e2e-red"]
    },
    {
      "id": "frontend-green",
      "title": "[frontend-green] {{story}} - Frontend implementation",
      "depends_on": ["frontend-red"]
    },
    {
      "id": "e2e-green",
      "title": "[e2e-green] {{story}} - E2E verification",
      "depends_on": ["backend-green", "frontend-green"],
      "acceptance": "E2E test passes"
    }
  ]
}
```

### Usage

```bash
bd pour outside-in-tdd \
  --var story="User creates recipe via chat" \
  --var e2e_outcome="Recipe exists in DB after approval"
```

Creates 6 beads with proper dependencies. Orchestrator just runs `bd ready`.

### Dependency Flow

```
bd ready sequence:
1. e2e-red ready (no deps)
2. After e2e-red: backend-red AND frontend-red ready (parallel)
3. After backend-red: backend-green ready
4. After frontend-red: frontend-green ready
5. After backend-green AND frontend-green: e2e-green ready
```

---

## Skill Inventory

### Directory Structure

```
.claude/skills/
├── orchestrator.md                    # Master workflow controller

├── tdd/
│   ├── backend-red-impl.md
│   ├── backend-red-review.md
│   ├── backend-green-impl.md
│   ├── backend-green-review.md
│   ├── frontend-red-impl.md
│   ├── frontend-red-review.md
│   ├── frontend-green-impl.md
│   ├── frontend-green-review.md
│   ├── e2e-red-impl.md
│   ├── e2e-red-review.md
│   ├── e2e-green-impl.md
│   ├── e2e-green-review.md
│   │
│   └── references/
│       ├── outcome-verification.md    # Shared: what makes a good outcome test
│       ├── pytest-patterns.md         # Backend-specific patterns
│       ├── playwright-patterns.md     # E2E-specific patterns
│       ├── vitest-patterns.md         # Frontend-specific patterns
│       └── review-criteria.md         # Shared review checklist

├── docs/
│   ├── docs-plan.md
│   ├── docs-impl.md
│   └── docs-review.md

├── plan-to-tasks.md
└── plan-reality-compare.md
```

### Skill Summary

| Skill | Purpose |
|-------|---------|
| `orchestrator` | Master workflow controller. Spawns subagents, manages state via beads. |
| `plan-to-tasks` | Convert plan → user stories → pour molecules |
| `backend-red-impl` | Design pytest tests verifying outcomes |
| `backend-red-review` | Verify backend tests check outcomes, not just status codes |
| `backend-green-impl` | Implement backend code to pass tests |
| `backend-green-review` | Verify code quality, tests actually pass |
| `frontend-red-impl` | Design vitest/RTL tests verifying user behavior |
| `frontend-red-review` | Verify frontend tests check rendered output |
| `frontend-green-impl` | Implement frontend components/logic |
| `frontend-green-review` | Verify code quality, accessibility, tests pass |
| `e2e-red-impl` | Design Playwright tests verifying user journeys |
| `e2e-red-review` | Verify E2E tests check DB/API state, not just UI |
| `e2e-green-impl` | Implement features to pass E2E tests |
| `e2e-green-review` | Verify integration works, no flaky tests |
| `docs-plan` | Aggregate learnings, propose doc changes |
| `docs-impl` | Make approved doc changes |
| `docs-review` | Verify doc changes are accurate and complete |
| `plan-reality-compare` | Compare original plan to implementation, produce deviation report |

**Total: 18 skills**

### Skill Template

```markdown
---
name: e2e-red-impl
description: Design E2E tests verifying user outcomes. Use when orchestrator
  assigns an e2e-red task. Outputs Playwright tests that verify DB/API state.
---

# E2E Test Design

## Input
- Bead ID and acceptance criteria (from orchestrator)
- Relevant file paths

## Process
1. Read acceptance criteria
2. Design Playwright tests verifying OUTCOMES (see references/outcome-verification.md)
3. Follow patterns in references/playwright-patterns.md
4. Run tests - confirm they FAIL

## Output
```
STATUS: COMPLETE|FAILED
SUMMARY: <what was done>
FILES: <files created/modified>
OUTCOME: <what this verifies>
```
```

### Review Skill Template

```markdown
---
name: e2e-red-review
description: Review E2E tests for outcome verification. Fresh context review
  of test quality. Use when orchestrator requests e2e-red review.
---

# E2E Test Review

## Input
- Test files to review (from orchestrator)
- Acceptance criteria from bead

## Process
Review against criteria in references/review-criteria.md:
1. Does each test verify an OUTCOME (DB state, API response)?
2. Would the test FAIL if the feature was broken?
3. Is the test mocking our own backend? (FAIL if yes)
4. Does the test name describe a user goal?

## Output
```
STATUS: PASS|FAIL
CRITERIA_MET: <list>
CRITERIA_FAILED: <list with specifics>
FEEDBACK: <if FAIL, what needs to change>
```
```

---

## Docs Workflow

After all tasks complete:

```
DOCS PLAN
  - Aggregate learnings from all task bead notes
  - Propose specific doc changes
  - Back-and-forth with user to refine
      ↓
HUMAN APPROVAL
      ↓
DOCS IMPL → DOCS REVIEW (loop until pass)
```

This replaces the heavier ADR process with a lighter plan → impl → review loop specific to the feature being built.

---

## Plan vs Reality Review

After docs complete:

1. `plan-reality-compare` skill reads:
   - Original plan document
   - All bead notes from execution
   - Actual code changes (git diff)

2. Produces deviation report:
   - What was planned vs. what was built
   - Categorized: acceptable divergence vs. needs discussion

3. Human reviews report:
   - Accept deviations
   - Flag items for rework
   - Approve for final testing

---

## Implementation Phases

### Phase 1: Foundation
- [ ] Create `outside-in-tdd.formula.json`
- [ ] Create `orchestrator.md` skill (sequential execution first)
- [ ] Create shared references: `outcome-verification.md`, `review-criteria.md`
- [ ] Test: Pour one molecule, run orchestrator manually, verify bead notes

### Phase 2: One Domain End-to-End
- [ ] Create E2E skills (4): `e2e-red-impl`, `e2e-red-review`, `e2e-green-impl`, `e2e-green-review`
- [ ] Create `references/playwright-patterns.md`
- [ ] Test: Run a real user story through E2E-only flow
- [ ] Validate: Bead notes parseable, review gates work, retry logic works

### Phase 3: Full TDD Loop
- [ ] Add backend skills (4) + `references/pytest-patterns.md`
- [ ] Add frontend skills (4) + `references/vitest-patterns.md`
- [ ] Update formula to include all steps
- [ ] Test: Full outside-in loop on a real feature

### Phase 4: Docs + Final Review
- [ ] Create docs skills: `docs-plan`, `docs-impl`, `docs-review`
- [ ] Create `plan-reality-compare.md`
- [ ] Create `plan-to-tasks.md`
- [ ] Test: Full workflow including docs and deviation review

### Phase 5: Parallel Execution
- [ ] Update orchestrator to run `bd ready` tasks in parallel
- [ ] Test with multi-story plan
- [ ] Tune max attempts, failure handling

### Phase 6: Automation Comfort
- [ ] Run workflows with increasing autonomy
- [ ] Audit bead notes to verify quality
- [ ] Adjust skills based on failure patterns

---

## Success Criteria

1. **Reduced rework** - Issues caught at review gates, not after integration
2. **Auditable trail** - Every decision traceable in bead notes
3. **Tests verify outcomes** - No more "tests pass but feature broken"
4. **Docs stay current** - Learnings captured at end of each feature
5. **Resumable** - Workflow can crash and resume from bead state

---

## Open Questions

1. **Max retry attempts** - How many retries before blocking? (Suggest: 3)
2. **Parallel task limit** - How many concurrent subagents? (Suggest: start with 2-3)
3. **Formula variants** - Do we need different formulas for different feature sizes?
4. **Cross-story dependencies** - How to handle when Story B depends on Story A?

---

## Related Documents

- [Testing Strategy Reform](./2026-01-21-testing-strategy-reform.md) - Context on testing problems this addresses
- [Architecture Decision Workflow](../ARCHITECTURE_DECISION_WORKFLOW.md) - Existing docs process (being simplified)
