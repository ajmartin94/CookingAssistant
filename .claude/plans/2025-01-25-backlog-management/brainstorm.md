# Backlog Management Brainstorm

## Problem / Motivation

Team of 2-5 needs a lightweight system to:
- **Capture ideas** before they're lost
- **Prioritize work** — decide what to build next
- **Collaborate** — share context across the team
- **Track progress** — simple done/not-done (TDD handles granular task tracking)

## Key Decisions

| Question | Decision |
|----------|----------|
| Where does backlog live? | GitHub Issues |
| How formal? | Lightweight — minimal required structure |
| Categorization? | By type (bug, enhancement, idea, chore) |
| How do ideas become work? | Manual promotion via `ready` label |
| When is something `ready`? | After `/brainstorm` completes |
| Branch naming includes issue #? | Optional |

## Chosen Approach: Minimal Labels + Manual Promotion

### Labels

| Label | Color | Description |
|-------|-------|-------------|
| `bug` | `#d73a4a` (red) | Something is broken |
| `enhancement` | `#a2eeef` (teal) | Improvement to existing functionality |
| `idea` | `#c5def5` (light blue) | Future possibility, needs scoping |
| `chore` | `#fef2c0` (yellow) | Refactoring, docs, deps, CI changes |
| `ready` | `#0e8a16` (green) | Scoped and ready to be picked up |

### Usage Rules

- Every issue gets exactly **one type label** (`bug`, `enhancement`, `idea`, or `chore`)
- `ready` is added **in addition** to the type label when scoped
- An issue can be `bug` + `ready` or `idea` without `ready`

## Workflow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Created   │────▶│  Discussed  │────▶│    Ready    │────▶│   Closed    │
│  (idea/bug/ │     │ (comments,  │     │ (add ready  │     │ (linked PR  │
│ enhancement/│     │  /brainstorm│     │   label)    │     │   merged)   │
│    chore)   │     │   if big)   │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### Lifecycle

1. **Anyone creates issues freely** — low friction, capture everything
2. **Discussion happens in comments** — context stays with the issue
3. **Run `/brainstorm` for bigger features** — output links to issue number
4. **Add `ready` label after brainstorm** — team agrees it's scoped
5. **PRs reference issues** — use `Closes #123` for auto-close

### Finding Work

```
is:issue is:open label:ready           # Ready to pick up
is:issue is:open label:bug             # All open bugs
is:issue is:open label:idea -label:ready   # Unscoped ideas
```

## Integration with Dev Workflow

```
GitHub Issue (idea)
       │
       ▼
   /brainstorm  ──▶  .claude/plans/YYYY-MM-DD-feature/brainstorm.md
       │                      (references issue #)
       ▼
   Issue gets `ready` label
       │
       ▼
   /plan → /tdd → /migrate → /code-review
       │
       ▼
   PR with "Closes #123"
       │
       ▼
   Issue auto-closes on merge
```

### Conventions

- **Brainstorm docs**: Include `GitHub Issue: #123` at the top
- **PR titles**: Conventional commits — `feat:`, `fix:`, `chore:`, etc.
- **Branches**: Optionally include issue number (e.g., `feature/123-recipe-chat`)
- **Scope**: Issues track WHAT to build; TDD process tracks HOW

## Reviewer Questions & Answers

The independent review surfaced these questions:

| Question | Answer |
|----------|--------|
| When does `ready` get added? | After `/brainstorm` completes |
| Branch naming convention? | Optional — include issue # when helpful |
| Docs/refactoring label? | Added `chore` label for these |
| Issue templates? | YAGNI — handle when needed |
| Stale issue policy? | YAGNI — handle when needed |
| Duplicate/cross-cutting issues? | YAGNI — handle when needed |

## Open Questions

None — design is complete for initial implementation.

## Next Steps

Run `/plan` to structure the implementation (creating labels, documenting in CONTRIBUTING.md, etc.)
