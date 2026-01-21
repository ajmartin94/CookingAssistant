---
name: docs-impl
description: Implement approved documentation changes. Use after docs-plan is approved by human. Makes the actual edits to documentation files.
---

# Documentation Implementation

Implement the documentation changes approved in docs-plan phase.

## Input

From orchestrator:
- Approved documentation proposals from docs-plan
- Files to modify

## Process

1. Read the approved proposals
2. For each approved change:
   - Read the target file
   - Make the specified edit
   - Verify the edit is correct
3. Report what was changed

## Guidelines

### Adding Content

```markdown
<!-- Adding a new section -->
## New Section Title

[Content as specified in the approved proposal]
```

### Updating Content

- Preserve existing structure where possible
- Update only what was approved
- Don't reorganize or refactor beyond scope

### Removing Content

- Remove only what was approved
- Leave surrounding content intact
- Don't leave orphaned references

## Output Format

```
STATUS: COMPLETE|FAILED
SUMMARY: <what changes were made>
FILES_MODIFIED:
  - path/to/file1.md: [change description]
  - path/to/file2.md: [change description]
VERIFICATION: [how to verify changes are correct]
```

## What This Phase Does NOT Do

- Add changes not approved in docs-plan
- Refactor or reorganize existing docs
- Create new documentation files (unless approved)
- Make "improvements" beyond approved scope

## Verification

After making changes:

1. Read each modified file to verify correctness
2. Check for broken links or references
3. Ensure markdown renders correctly

```bash
# Preview markdown (if tooling available)
# Or just read the file to verify
```

## Common File Patterns

### CLAUDE.md files

```markdown
<!-- Per AD-XXXX or Per discussion YYYY-MM-DD -->
## Section Title

Content here.
```

### docs/ files

Follow existing structure in the file. Match heading levels, formatting, etc.
