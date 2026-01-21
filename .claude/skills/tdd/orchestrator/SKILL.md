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
1. bd ready → get all available tasks (no blockers)
2. For each ready task, determine current phase (from bead notes)
3. Spawn subagents IN PARALLEL for all ready tasks
   - Use multiple Task tool calls in a single message
   - Max 3 concurrent tasks to avoid overwhelming
4. Wait for all subagents to complete
5. For each completed task:
   a. Capture output, write to bead notes
   b. If impl complete: run verification
   c. If verification passes: spawn review (can batch reviews too)
   d. If review passes: close bead
   e. If review fails: queue for retry (up to 3 attempts)
   f. If max attempts: mark bead blocked
6. Repeat from step 1 until bd ready returns empty
```

### Parallel Execution Pattern

When `bd ready` returns multiple tasks, spawn them all at once:

```
# Single message with multiple Task tool calls:
Task(subagent_type="general-purpose", prompt="...", description="e2e-red for Story A")
Task(subagent_type="general-purpose", prompt="...", description="backend-red for Story A")
Task(subagent_type="general-purpose", prompt="...", description="frontend-red for Story B")
```

This maximizes throughput. Dependencies are enforced by beads - only unblocked tasks appear in `bd ready`.

### Batching Strategy

| Scenario | Approach |
|----------|----------|
| 1-3 ready tasks | Run all in parallel |
| 4+ ready tasks | Run first 3, then next batch |
| Mixed impl/review | Can run together (different beads) |
| Same bead impl+review | Sequential (review needs impl output) |

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

## Handling Parallel Results

When multiple subagents complete:

```
1. Collect all results
2. For each result:
   - Parse STATUS from output
   - Write to bead notes immediately (don't batch)
   - Determine next action (verify, review, retry, close)
3. Group next actions by type:
   - Verifications can run in parallel (bash commands)
   - Reviews can spawn in parallel (new batch)
   - Retries queue for next iteration
4. Execute grouped actions
5. Run bd ready for next batch
```

### Failure Isolation

If one task fails, others continue:
- Mark failed task for retry or blocked
- Don't abort the entire batch
- Report failures at end of iteration

## Completion

When `bd ready` returns empty:
1. Check for blocked tasks: `bd blocked`
2. If any blocked: report to user, list blocked beads with failure reasons
3. If none blocked: announce "All tasks complete. Ready for docs review."
4. Trigger `docs-plan` skill for documentation phase

## Multi-Story Workflows

When multiple stories are poured:

```bash
# Pour multiple molecules
bd mol pour outside-in-tdd --var story="Story A" --var e2e_outcome="..."
bd mol pour outside-in-tdd --var story="Story B" --var e2e_outcome="..."

# bd ready will return tasks from BOTH stories
# Orchestrator runs them in parallel where dependencies allow
```

Cross-story dependencies (if needed):
```bash
# Story B's e2e-red depends on Story A's e2e-green
bd dep add <story-b-e2e-red-id> <story-a-e2e-green-id>
```
