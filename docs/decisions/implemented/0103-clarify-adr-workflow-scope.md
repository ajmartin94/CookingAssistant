# AD-0103: Clarify ADR Workflow Scope

## Status
Implemented

## Metadata
- **Author**: Claude (with user)
- **Date**: 2026-01-18
- **Evidence Reference**: [2026-01-18-adr-scope-and-claude-md-structure.md](../evidence/2026-01-18-adr-scope-and-claude-md-structure.md)
- **Trigger Type**: question

## Context

The Architecture Decision Workflow was established to ensure documentation changes are intentional, traceable, and human-auditable. The workflow uses "Architecture Decision" (AD) terminology throughout, suggesting it applies primarily to architectural decisions.

However, the actual intent is broader: **all documentation changes** should flow through this process for traceability, including simple factual updates like correcting an outdated directory listing. The current naming creates hesitation when applying the workflow to non-architectural changes.

This came to light when updating the CLAUDE.md repository structure section—a simple factual correction that doesn't involve architectural decisions but still benefits from the traceability the workflow provides.

## Problem Statement

The "Architecture Decision" naming implies the workflow only applies to architectural decisions, but the intended scope is all documentation changes. How should we clarify this scope while preserving the existing workflow structure and AD numbering?

## Decision

We will add explicit scope clarification to the workflow document and skill, making clear that "Architecture Decisions" (ADs) encompass all documentation changes—not just architectural ones—because the workflow's value is traceability, not architectural gatekeeping. We will keep the AD naming convention for continuity with existing decisions (AD-0001 through AD-0102).

## Alternatives Considered

### Option A: Add Scope Clarification (Keep AD Naming)

**Description**: Add a "Scope" section to the workflow document and skill explaining that "AD" covers all documentation changes. The rationale: the workflow's value is the process (evidence → decision → propagation), not the "architectural" qualifier.

**Pros**:
- No renaming of existing 11 ADs
- No file/directory renaming
- Minimal change to existing documentation
- Preserves familiarity for those already using the process

**Cons**:
- "Architecture Decision" name remains slightly misleading
- New users may still hesitate on non-architectural changes

**Recommendation**: Selected

### Option B: Rename to "Documentation Decision" (DD)

**Description**: Rename "Architecture Decision" to "Documentation Decision" throughout. Change AD-XXXX to DD-XXXX. Rename directories and files.

**Pros**:
- Name accurately reflects scope
- No ambiguity about what changes qualify

**Cons**:
- Requires renaming 11 existing decisions
- Requires updating all `<!-- Per AD-XXXX -->` comments in codebase
- Breaks git history continuity
- "Documentation Decision" is less commonly recognized than "ADR"

**Recommendation**: Not selected — migration cost outweighs naming precision

### Option C: Status Quo

**Description**: Keep current naming and documentation unchanged. Rely on the skill description and verbal guidance to clarify scope.

**Pros**:
- No changes required
- No risk of introducing errors

**Cons**:
- Ambiguity persists
- Users continue to hesitate on non-architectural changes
- Intent remains implicit rather than explicit

**Recommendation**: Not selected — explicit documentation of intent is valuable

## Consequences

**Easier**:
- Applying the workflow to simple factual updates without hesitation
- Onboarding new contributors who see the explicit scope statement
- Consistent documentation change tracking regardless of change type

**Harder**:
- Nothing significant

**New constraints**:
- The clarification must be added to both the workflow doc and the skill to maintain consistency

## Affected Documentation

| File | Section | Change Required |
|------|---------|-----------------|
| `docs/ARCHITECTURE_DECISION_WORKFLOW.md` | Overview (after line 5) | Add "Scope" subsection clarifying AD covers all docs changes |
| `.claude/skills/updating-docs/SKILL.md` | Core Principle (after line 11) | Add scope clarification paragraph |
| `CLAUDE.md` | Repository Structure (lines 55-63) | Update to include `e2e/` and `.github/` directories |

## Gate 2 Approval
- **Decision**: APPROVE
- **Approver**: User
- **Date**: 2026-01-18

## Propagation

### Checklist

| File | Status | Change Summary |
|------|--------|----------------|
| `docs/ARCHITECTURE_DECISION_WORKFLOW.md` | ✅ Complete | Added "Scope" subsection after Overview explaining AD covers all docs changes |
| `.claude/skills/updating-docs/SKILL.md` | ✅ Complete | Added scope clarification paragraph after Core Principle |
| `CLAUDE.md` | ✅ Complete | Updated repo structure to include `e2e/` and `.github/` directories |

### Propagation Metadata
- **Implementer**: Claude
- **Date**: 2026-01-18

## Gate 3 Approval
- **Decision**: APPROVE
- **Approver**: User
- **Date**: 2026-01-18
