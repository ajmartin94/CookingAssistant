# State of the Union: ADR Workflow Scope and CLAUDE.md Structure

## Metadata
- **Date**: 2026-01-18
- **Author**: Claude (with user)
- **Trigger Type**: question

## Trigger Event

### What Happened
User requested updating the repository structure section in CLAUDE.md because it's out of date. When asked whether to make the edit directly or follow the ADR workflow, user clarified:

> "Go through ADR for clear, consistent docs change management (not all docs changes are 'architecture' but all docs changes use the ADR process for clarity and traceability)"

This revealed two issues:
1. The CLAUDE.md repo structure is factually out of date
2. The ADR workflow/skill framing emphasizes "architectural decisions" but the actual intended scope is **all documentation changes** for traceability

### Reference
- Conversation in Claude Code session, 2026-01-18
- Current CLAUDE.md lines 52-63

## Evidence

### Current Documentation State

**CLAUDE.md Repository Structure section (lines 55-63):**
```
CookingAssistant/
├── backend/          # FastAPI (see backend/CLAUDE.md)
├── frontend/         # React/TypeScript (see frontend/CLAUDE.md)
├── docs/             # Documentation
│   └── decisions/    # Architecture Decision Records
├── .beads/           # Issue tracking
└── .claude/          # Skills and hooks
```

**Actual repository structure (as of 2026-01-18):**
```
CookingAssistant/
├── backend/          # FastAPI
├── frontend/         # React/TypeScript
├── e2e/              # End-to-end tests (Playwright) ← MISSING
├── docs/             # Documentation
│   └── decisions/    # Architecture Decision Records
├── .github/          # CI workflows ← MISSING
├── .beads/           # Issue tracking
└── .claude/          # Skills and hooks
```

**ADR Workflow terminology (from ARCHITECTURE_DECISION_WORKFLOW.md):**
- Title: "Architecture Decision Workflow"
- Overview: "...process for identifying, deciding, and propagating architectural decisions..."
- Output: "AD Document" (Architecture Decision)

**Skill description (from .claude/skills/updating-docs/SKILL.md):**
- Name: `updating-docs`
- Description mentions: "Guide documentation updates through the Architecture Decision Workflow"
- But also says: "You must use this skill when... (4) Asked to update documentation"

### Observations

1. **Missing directories**: The repo structure diagram is missing `e2e/` (end-to-end tests) and `.github/` (CI workflows), both significant additions to the project.

2. **Scope mismatch**: The workflow and skill imply all docs changes should use this process, but the "Architecture Decision" naming suggests only architectural decisions need it. This creates hesitation when making simple factual updates (like fixing an outdated directory listing).

3. **No "factual update" trigger type**: The workflow lists trigger types: `code-change | incident | learning | tech-debt | question | other`. Simple factual corrections don't fit neatly into "architecture decision" framing.

4. **User clarification**: User explicitly stated the intent is for ALL docs changes to use ADR for traceability, not just architectural decisions.

## Potentially Affected Documentation

- [ ] `docs/ARCHITECTURE_DECISION_WORKFLOW.md` - May need scope clarification
- [ ] `.claude/skills/updating-docs/SKILL.md` - May need terminology adjustment
- [ ] `CLAUDE.md` - Needs repo structure update (the immediate trigger)

## Gate 1 Evaluation
- **Decision**: YES
- **Evaluator**: User
- **Date**: 2026-01-18
- **AD Number**: AD-0103
- **Rationale**: Evidence shows both factual outdatedness (repo structure) and scope ambiguity (ADR workflow naming) that warrant formal documentation changes.
