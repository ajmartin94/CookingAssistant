# Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

## Issue Creation Checklist

Before creating an issue, gather this information:

### For Features
- [ ] Clear title describing the outcome
- [ ] `--type=feature`
- [ ] `--design`: Numbered implementation steps
- [ ] `--acceptance`: Testable definition of done
- [ ] `--priority`: P0-P4 based on urgency

### For Bugs
- [ ] Title includes "fix:" or describes the broken behavior
- [ ] `--type=bug`
- [ ] `--description`: Reproduction steps
- [ ] `--acceptance`: How to verify fix works

### For Tasks
- [ ] Clear title describing what needs doing
- [ ] `--type=task`
- [ ] `--description`: Scope of work

## Bead Closure Checklist

**EVERY bead closure MUST follow this sequence:**

### Pre-Closure Verification
- [ ] All acceptance criteria from the issue are met
- [ ] Tests written and passing (`pytest` / `npm test`)
- [ ] Linter clean (`mypy` / `npx tsc`)
- [ ] Build succeeds (`npm run build`)

### Closure Command
```bash
bd close <id> --reason="Completed: [summary]

What was done:
- [Key change 1]
- [Key change 2]

Tests: [X unit, Y integration] passing"
```

### Post-Closure MANDATORY Steps

**IMMEDIATELY after `bd close`:**

```bash
# 1. Stage all changes (including .beads/issues.jsonl)
git add .

# 2. Commit with conventional message
git commit -m "type(scope): description

Closes: <id>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

# 3. Verify the closure is committed
git log -1 --name-only | grep issues.jsonl
```

### Verification
- [ ] `git status` shows no uncommitted changes
- [ ] `git log -1` shows the closure commit
- [ ] `.beads/issues.jsonl` is in the commit

**CRITICAL:** Do NOT close multiple beads before committing.
Each closure = one commit.

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Close and commit each bead** - One commit per closure (see checklist above)
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
- Every `bd close` MUST have a corresponding commit
