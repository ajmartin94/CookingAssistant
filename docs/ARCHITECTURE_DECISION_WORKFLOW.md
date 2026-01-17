# Architecture Decision Workflow

## Overview

This document defines the process for identifying, deciding, and propagating architectural decisions through documentation. The workflow ensures that documentation changes are intentional, traceable, and human-auditable.

### Design Principles

1. **Steps produce outputs; Gates make decisions** — Clear separation between work and approval
2. **Three gates, consistent outcomes** — Every gate can result in YES/NO or APPROVE/REVISE/REJECT
3. **Human-first, agent-ready** — Process is explicit enough for automation but designed for human learning
4. **Traceability built-in** — Every documentation change links back to a decision

---

## Process Flow

```
STEP 1: Gather Evidence → OUTPUT → GATE 1: Docs Change Needed?
                                            │
                                   ┌────────┴────────┐
                                   ↓                 ↓
                                  NO                YES
                               (archive)             │
                                                     ↓
STEP 2: Draft AD → OUTPUT → GATE 2: Approve Decision
                                            │
                           ┌────────────────┼────────────────┐
                           ↓                ↓                ↓
                        REJECT           REVISE          APPROVE
                       (stop)         (redo step 2)         │
                                                            ↓
STEP 3: Propagate → OUTPUT → GATE 3: Approve Propagation
                                            │
                           ┌────────────────┼────────────────┐
                           ↓                ↓                ↓
                        REJECT           REVISE          APPROVE
                       (stop)         (redo step 3)         │
                                                            ↓
                                                        COMPLETE
```

---

## Step 1: Gather Evidence

### Purpose

Capture the facts and context from a trigger event so that someone can evaluate whether documentation needs to change. This step does NOT propose a solution—it documents what happened.

### Trigger Events

- Code review reveals undocumented convention or contradicts documented convention
- Incident exposes flawed assumption in documented architecture
- Conference, article, or learning suggests current approach may be suboptimal
- Tech debt discussion surfaces pain points with current documented practices
- New team member questions existing documented practice
- PR introduces changes that may conflict with documented standards

### Executor

Any team member (human or agent)

### Work

1. Identify what triggered this evaluation
2. Gather relevant evidence:
   - If code change: summarize what changed and where
   - If incident: summarize what happened and what was learned
   - If learning: summarize the new information and its source
   - If question: capture the question and current documented answer (if any)
3. Note which documentation *might* be affected (no analysis required, just observation)

### Output

**State of the Union Document** — Evidence package for Gate 1 evaluation

### Output Format

```markdown
# State of the Union: [Brief Title]

## Metadata
- **Date**: YYYY-MM-DD
- **Author**: [Name]
- **Trigger Type**: [code-change | incident | learning | tech-debt | question | other]

## Trigger Event

### What Happened
[Describe the event that triggered this. Be factual, not prescriptive.]

### Reference
[Link to PR, issue, incident report, article, conversation, etc.]

## Evidence

[This section is flexible based on trigger type. Include whatever is relevant:]

### Code Changes (if applicable)
- Files modified: [list]
- Summary of changes: [brief description]

### Current Documentation State (if applicable)
- Relevant docs: [list files]
- What they currently say: [quote or summarize]

### Observations
[Any factual observations about potential mismatch, gap, or conflict.
Do NOT include recommendations or proposed solutions here.]

## Potentially Affected Documentation
[List any docs that MIGHT be affected. This is preliminary—full analysis happens in Step 2 if Gate 1 passes.]

- [ ] [path/to/doc1.md]
- [ ] [path/to/doc2.md]
```

### Output Location

`docs/decisions/evidence/YYYY-MM-DD-short-title.md`

---

## Gate 1: Docs Change Needed?

### Purpose

Triage the evidence to determine whether a documentation change process should be initiated. This is not approval of a proposal—it's answering a binary question.

### Evaluator

Tech lead, senior developer, or designated triage owner

### Input

State of the Union Document from Step 1

### Evaluation Question

**"Based on this evidence, do we need to update documentation?"**

Consider:
- Does the evidence show a gap between code and docs?
- Does the evidence show outdated information in docs?
- Does the evidence suggest our documented approach should change?
- Is there enough here to warrant formal analysis?

### Outcomes

| Outcome | Meaning | Action |
|---------|---------|--------|
| **NO** | No documentation change needed | Move to `docs/decisions/evidence/archived/`, add brief note explaining why, process stops |
| **YES** | Documentation change is needed | Assign AD number, create draft file in `docs/decisions/drafts/`, proceed to Step 2 |

### Gate 1 Artifact

Evaluator adds to the State of the Union document:

```markdown
## Gate 1 Evaluation
- **Decision**: [YES | NO]
- **Evaluator**: [Name]
- **Date**: YYYY-MM-DD
- **AD Number**: [Assigned if YES, e.g., AD-0024]
- **Rationale**: [Why yes or why no—one to two sentences]
```

---

## Step 2: Draft AD

### Purpose

Produce a complete architectural decision document with full analysis, clear decision, and identified impact.

### Executor

Assigned author (human or agent)

### Input

- State of the Union Document with Gate 1 YES decision
- Assigned AD number

### Work

1. Review the evidence from Step 1
2. Research the problem space thoroughly
3. Identify and evaluate alternatives (minimum three):
   - Proposed new approach
   - Status quo (do nothing)
   - At least one other alternative
4. Document tradeoffs for each alternative
5. Make a clear recommendation
6. Scan repository for ALL documentation that would be affected
7. List specific files and sections requiring updates

### Output

**Draft AD Document** — Complete decision record ready for approval

### Output Format

```markdown
# AD-XXXX: [Title]

## Status
Draft

## Metadata
- **Author**: [Name]
- **Date**: YYYY-MM-DD
- **Evidence Reference**: [Link to State of the Union document]
- **Trigger Type**: [From evidence doc]

## Context

[Expanded from evidence. What situation are we in? What forces are at play?
Provide full background in 3-5 sentences.]

## Problem Statement

[What specific problem are we solving? What question are we answering?]

## Decision

[Clear, unambiguous statement of what we will do. One paragraph maximum.
Write as if already decided: "We will..." not "We should..."]

## Alternatives Considered

### Option A: [Recommended Approach Name]

**Description**: [What this means concretely]

**Pros**:
- [Pro 1]
- [Pro 2]

**Cons**:
- [Con 1]
- [Con 2]

**Recommendation**: Selected

### Option B: [Alternative Name]

**Description**: [What this means concretely]

**Pros**:
- [Pro 1]

**Cons**:
- [Con 1]

**Recommendation**: Not selected — [reason]

### Option C: Status Quo

**Description**: Continue current approach unchanged

**Pros**:
- No migration effort
- No risk of introducing bugs

**Cons**:
- [Current pain points persist]

**Recommendation**: Not selected — [reason]

## Consequences

[What becomes easier? What becomes harder? What new constraints exist?
What are we trading off?]

## Affected Documentation

| File | Section | Change Required |
|------|---------|-----------------|
| [path/to/file.md] | [Section name or "Entire file"] | [Brief description of change needed] |
| [path/to/file2.md] | [Section name] | [Brief description] |
```

### Output Location

`docs/decisions/drafts/XXXX-title.md`

---

## Gate 2: Approve Decision

### Purpose

Validate the architectural decision itself and confirm the impact analysis is complete.

### Approver

Architecture owner, senior staff, or designated decision-maker for this domain

### Input

Draft AD Document from Step 2

### Evaluation Criteria

- Is the problem clearly stated?
- Are alternatives genuinely evaluated (not strawmen)?
- Is the decision clear and unambiguous?
- Is the affected documentation list complete?
- Do we agree with this decision?

### Outcomes

| Outcome | Meaning | Action |
|---------|---------|--------|
| **REJECT** | Decision is wrong or we should not proceed | Move to `docs/decisions/rejected/`, add rejection reason, process stops |
| **REVISE** | Analysis incomplete or decision unclear | Return to Step 2 executor with specific feedback, repeat Step 2 |
| **APPROVE** | Decision accepted | Move to `docs/decisions/accepted/`, proceed to Step 3 |

### Gate 2 Artifact

Approver adds to the AD document:

```markdown
## Gate 2 Approval
- **Decision**: [REJECT | REVISE | APPROVE]
- **Approver**: [Name]
- **Date**: YYYY-MM-DD
- **Notes**: [Required if REVISE or REJECT; optional if APPROVE]
```

If approved, update status:

```markdown
## Status
Accepted
```

---

## Step 3: Propagate

### Purpose

Update all affected documentation to reflect the accepted decision, with full traceability.

### Executor

Assigned implementer (human or agent)

### Input

Accepted AD Document with Affected Documentation table

### Work

For each file in the Affected Documentation table:

1. Open the file
2. Locate the specified section
3. Make the change that reflects the AD decision
4. Add traceability comment: `<!-- Per AD-XXXX -->`
5. Record what was changed

After all files are updated:

1. Prepare commits with message format: `docs(<scope>): apply AD-XXXX - <description>`
2. Complete the propagation checklist

### Output

**Propagation Report** — Record of all changes made, appended to the AD document

### Output Format

Append to the AD document:

```markdown
## Propagation

### Checklist

| File | Status | Change Summary |
|------|--------|----------------|
| [path/to/file.md] | ✅ Complete | [What was changed] |
| [path/to/file2.md] | ✅ Complete | [What was changed] |

### Commits

- `abc1234` - docs(testing): apply AD-XXXX - [description]
- `def5678` - docs(agents): apply AD-XXXX - [description]

### Propagation Metadata
- **Implementer**: [Name]
- **Date**: YYYY-MM-DD
```

### Output Location

- Documentation changes: in-place in affected files
- Propagation report: appended to AD in `docs/decisions/accepted/`

---

## Gate 3: Approve Propagation

### Purpose

Verify that documentation changes correctly and completely reflect the accepted decision.

### Approver

AD author, tech lead, or designated reviewer

### Input

- Propagation Report from Step 3
- Diff of all changed documentation files (PR or commit range)

### Evaluation Criteria

- Does each change accurately reflect the AD decision?
- Are all affected files updated (checklist complete)?
- Are traceability comments (`<!-- Per AD-XXXX -->`) in place?
- Are commits properly formatted?

### Outcomes

| Outcome | Meaning | Action |
|---------|---------|--------|
| **REJECT** | Changes are fundamentally wrong | Revert changes, return AD to accepted status, escalate or abandon |
| **REVISE** | Changes need correction | Return to Step 3 executor with specific feedback, repeat Step 3 |
| **APPROVE** | Propagation complete | Move AD to `docs/decisions/implemented/`, process complete |

### Gate 3 Artifact

Approver adds to the AD document:

```markdown
## Gate 3 Approval
- **Decision**: [REJECT | REVISE | APPROVE]
- **Approver**: [Name]
- **Date**: YYYY-MM-DD
- **Notes**: [Required if REVISE or REJECT; optional if APPROVE]
```

If approved, update status:

```markdown
## Status
Implemented
```

### Final Location

`docs/decisions/implemented/XXXX-title.md`

---

## Directory Structure

```
docs/decisions/
├── evidence/            # Step 1 outputs awaiting Gate 1
│   └── archived/        # Gate 1 NO decisions (kept for reference)
├── drafts/              # Step 2 outputs awaiting Gate 2
├── accepted/            # Gate 2 APPROVE, awaiting Step 3 / Gate 3
├── implemented/         # Gate 3 APPROVE, complete
└── rejected/            # Gate 2 REJECT decisions (kept for reference)
```

---

## Summary

| Step | Purpose | Output | Gate | Question |
|------|---------|--------|------|----------|
| 1. Gather Evidence | Document what happened | State of the Union | Gate 1 | Do we need a docs change? |
| 2. Draft AD | Analyze and decide | Draft AD | Gate 2 | Do we approve this decision? |
| 3. Propagate | Update documentation | Propagation Report | Gate 3 | Are changes correct and complete? |

---

## Gate Outcomes Reference

### Gate 1

| Outcome | Action |
|---------|--------|
| NO | Archive evidence, stop |
| YES | Assign AD number, proceed |

### Gates 2 and 3

| Outcome | Action |
|---------|--------|
| REJECT | Stop process, archive with reason |
| REVISE | Return to step executor with feedback |
| APPROVE | Proceed to next step (or complete if Gate 3) |
