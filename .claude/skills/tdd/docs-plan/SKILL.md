---
name: docs-plan
description: Aggregate learnings from completed tasks and propose documentation updates. Use after all TDD tasks complete. Outputs proposed doc changes for human approval.
---

# Documentation Planning

After all TDD tasks complete, analyze what was learned and propose doc updates.

## Input

From orchestrator:
- List of completed task bead IDs
- Original plan document

## Process

1. Read all completed bead notes
2. Identify knowledge that should be documented
3. Propose specific documentation changes
4. Present to user for approval

## What to Look For

### Code Patterns Discovered

- New patterns established during implementation
- Deviations from existing documented patterns
- Workarounds that became standard

### API Changes

- New endpoints added
- Request/response format changes
- Error handling patterns

### Testing Patterns

- New test patterns established
- Helpers created
- Fixtures added

### Architecture Decisions

- Why certain approaches were chosen
- Trade-offs made during implementation
- Things that should be done differently next time

## Output Format

```markdown
# Proposed Documentation Updates

## Summary
[1-2 sentences on what was learned]

## Proposed Changes

### 1. [File: docs/path/to/file.md]
**Section**: [section name]
**Change type**: Add | Update | Remove
**Reason**: [why this change is needed]
**Proposed content**:
```
[the actual content to add/change]
```

### 2. [File: backend/CLAUDE.md]
...

## Questions for Human
- [Any clarifications needed]
- [Decisions that need human input]
```

## Files to Consider

| File | Consider For |
|------|--------------|
| `docs/TESTING.md` | New testing patterns, helpers |
| `backend/CLAUDE.md` | Backend conventions discovered |
| `frontend/CLAUDE.md` | Frontend conventions discovered |
| `docs/API.md` | API changes |
| `CLAUDE.md` | Project-wide patterns |

## Interaction

This phase involves back-and-forth with the user:

1. Present initial proposals
2. User may ask questions or request changes
3. Refine proposals based on feedback
4. User approves final list

Only proceed to docs-impl after explicit user approval.

## What NOT to Propose

- Documentation for obvious/standard patterns
- Overly detailed implementation notes
- Temporary workarounds (unless they became permanent)
- Changes that duplicate existing docs
