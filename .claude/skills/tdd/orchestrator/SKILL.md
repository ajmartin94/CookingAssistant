---
name: tdd-orchestrator
description: Master workflow controller for outside-in TDD. Use when executing a poured molecule workflow. Manages phase transitions, spawns subagents for impl/review, writes audit trail to beads.
---

# TDD Orchestrator

Manage TDD workflow execution. You spawn subagents for work; you don't write code yourself.

## Prerequisites
- Molecule poured via `bd pour outside-in-tdd --var story="..." --var e2e_outcome="..."`
- Tasks visible via `bd ready`

## Workflow Loop

```
1. bd ready → get available tasks
2. For each task:
   a. Parse task ID prefix to determine type: e2e-red, backend-green, etc.
   b. Determine phase: impl or review (based on bead notes)
   c. Spawn appropriate subagent
   d. Capture output, write to bead notes
   e. If impl: run verification, then spawn review
   f. If review passes: mark phase complete
   g. If review fails: retry impl (max 3 attempts)
   h. If max attempts: mark bead blocked
3. Repeat until bd ready returns empty
```

## Phase Detection

Read bead notes via `bd show <id>`. Parse for last phase marker:

| Last marker | Next action |
|-------------|-------------|
| (none) | Start impl |
| `PHASE:*-IMPL:COMPLETE` | Run verification, then review |
| `PHASE:*-REVIEW:FAIL` | Retry impl (check attempt count) |
| `PHASE:*-REVIEW:PASS` | Task complete, close bead |

## Spawning Subagents

Map task type to skill:

| Task prefix | Impl skill | Review skill |
|-------------|------------|--------------|
| `e2e-red` | `tdd/e2e-red-impl` | `tdd/e2e-red-review` |
| `e2e-green` | `tdd/e2e-green-impl` | `tdd/e2e-green-review` |
| `backend-red` | `tdd/backend-red-impl` | `tdd/backend-red-review` |
| `backend-green` | `tdd/backend-green-impl` | `tdd/backend-green-review` |
| `frontend-red` | `tdd/frontend-red-impl` | `tdd/frontend-red-review` |
| `frontend-green` | `tdd/frontend-green-impl` | `tdd/frontend-green-review` |

Spawn via Task tool:
```
Task(
  subagent_type="general-purpose",
  prompt="Load skill tdd/{type}-{phase}. Task: {bead title}. Acceptance: {from bead}",
  description="{type}-{phase} for {story}"
)
```

## Writing Bead Notes

After each subagent completes:

```bash
bd comments add <bead-id> "[timestamp] PHASE:{TYPE}-{PHASE}:{STATUS}
{subagent output summary}
FILES: {files changed}
OUTCOME: {what this verifies}"
```

## Verification

| Phase | Verification |
|-------|--------------|
| RED (any) | Run tests → must FAIL |
| GREEN (any) | Run tests → must PASS |

```bash
# Backend
cd backend && pytest path/to/tests

# Frontend
cd frontend && npm test -- --run path/to/tests

# E2E
cd e2e && npx playwright test path/to/tests
```

## Retry Logic

On review failure:
1. Check attempt count in bead notes (count `IMPL:START` markers)
2. If < 3: spawn impl again with review feedback
3. If >= 3: `bd update <id> --status=blocked` with note explaining failure

## Completion

When `bd ready` returns empty:
1. Check for blocked tasks: `bd blocked`
2. If any blocked: report to user, stop
3. If none blocked: announce "All tasks complete. Ready for docs review."
