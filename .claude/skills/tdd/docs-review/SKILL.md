---
name: docs-review
description: Review documentation changes for accuracy and completeness. Fresh context review. Use when orchestrator requests docs review.
---

# Documentation Review

Review doc changes with **fresh context**. Verify accuracy and completeness.

## Input

From orchestrator:
- Modified file paths
- Approved proposals (what was supposed to change)

## Review Checklist

### Critical (must pass)

- [ ] **Accurate**: Information is technically correct
- [ ] **Complete**: All approved changes were made
- [ ] **Matches approval**: Changes match what was approved (no extras)
- [ ] **No broken links**: Internal links still work

### Important (should pass)

- [ ] **Consistent style**: Matches existing doc style
- [ ] **Clear language**: Easy to understand
- [ ] **Proper formatting**: Markdown renders correctly

### Warning (note but don't fail)

- [ ] **Could be clearer**: Language could be improved
- [ ] **Missing context**: Would benefit from more explanation

## Review Process

1. **Read approved proposals** - What was supposed to change?

2. **Read modified files** - What actually changed?

3. **Verify accuracy**:
   - Is the technical information correct?
   - Does it match the implementation?

4. **Check completeness**:
   - Were all approved changes made?
   - Were any unapproved changes added?

5. **Verify links**:
   ```bash
   # Check for broken internal links
   grep -r "\[.*\](.*\.md)" docs/ | head -20
   ```

## Output Format

```
STATUS: PASS|FAIL
FILES_REVIEWED:
  - path/to/file.md: [status]
CRITERIA_MET:
  - <list items that passed>
CRITERIA_FAILED:
  - <list items that failed with specifics>
FEEDBACK:
  <if FAIL, what needs to change>
```

## Common Review Failures

### Inaccurate information

```markdown
<!-- Wrong -->
Use `bd note` to add comments to beads.

<!-- Should be -->
Use `bd comments add` to add comments to beads.
```

### Missing approved change

Proposal said to add section X, but it's not in the file.

### Unapproved change

File has changes that weren't in the approved proposals.

### Broken link

```markdown
See [Testing Guide](./TESTING.md)  <!-- File doesn't exist -->
```

## Acceptance

When this review passes, documentation updates are complete and accurate.
