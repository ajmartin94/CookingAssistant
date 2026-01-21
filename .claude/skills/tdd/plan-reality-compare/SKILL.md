---
name: plan-reality-compare
description: Compare original plan to what was actually built. Produce deviation report for human review. Use after docs phase completes.
---

# Plan vs Reality Comparison

Compare the original plan to what was actually implemented. Produce a deviation report.

## Input

From orchestrator:
- Original plan document path
- All completed bead IDs with notes
- Git diff of all changes

## Process

1. Read original plan
2. Read all bead notes (implementation history)
3. Get git diff for code changes
4. Compare plan to reality
5. Produce deviation report

## Gathering Information

### Read Original Plan

```bash
# Plan document location (from orchestrator)
cat docs/plans/YYYY-MM-DD-feature-name.md
```

### Read Bead History

```bash
# Get all completed beads for the molecule
bd list --status=closed --parent=<molecule-id>

# Read notes for each
bd show <bead-id>
```

### Get Code Changes

```bash
# All changes since branching
git diff main...HEAD --stat
git diff main...HEAD -- backend/
git diff main...HEAD -- frontend/
git diff main...HEAD -- e2e/
```

## Deviation Categories

### 1. Scope Changes

| Type | Description |
|------|-------------|
| **Added** | Features built that weren't in original plan |
| **Removed** | Planned features that weren't built |
| **Modified** | Features built differently than planned |

### 2. Technical Changes

| Type | Description |
|------|-------------|
| **Different approach** | Used different technology/pattern than planned |
| **Additional work** | Extra work required (discovered during impl) |
| **Simplified** | Simpler solution than planned |

### 3. Acceptable vs Needs Discussion

| Category | Examples |
|----------|----------|
| **Acceptable** | Minor simplifications, better patterns discovered |
| **Needs discussion** | Major scope changes, missing features, different APIs |

## Output Format

```markdown
# Plan vs Reality Report

## Summary
[1-2 sentences: overall alignment with plan]

## Deviations

### Scope Changes

#### Added (not in plan)
- [Feature X]: [why it was added]

#### Removed (in plan but not built)
- [Feature Y]: [why it wasn't built]

#### Modified (different than planned)
- [Feature Z]: Planned [X], built [Y]. Reason: [why]

### Technical Changes

#### Different Approach
- [Component A]: Planned [approach X], used [approach Y]. Reason: [why]

#### Additional Work Required
- [Task B]: Required additional [work] not anticipated in plan

### Assessment

| Deviation | Category | Recommendation |
|-----------|----------|----------------|
| Feature X added | Acceptable | Good enhancement |
| Feature Y removed | Needs discussion | May need follow-up work |
| Approach Z changed | Acceptable | Better solution found |

## Recommendations

1. [Accept deviation X because...]
2. [Create follow-up bead for Y because...]
3. [Document decision Z because...]

## Questions for Human

- [Any decisions that need human input]
```

## Human Review

Present the report to the human for review. They will:

1. Accept deviations
2. Flag items for rework
3. Create follow-up beads for incomplete work
4. Approve for final testing

## What This Phase Does NOT Do

- Make decisions about deviations (human does)
- Create follow-up beads (human requests)
- Judge whether deviations are good/bad (just report)
