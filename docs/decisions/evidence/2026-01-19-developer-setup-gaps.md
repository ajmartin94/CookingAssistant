# State of the Union: Developer Setup Gaps

## Metadata
- **Date**: 2026-01-19
- **Author**: Claude (with user)
- **Trigger Type**: question

## Trigger Event

### What Happened
During session startup on a fresh computing environment, attempted to run `bd ready` to check available beads work. The command failed with "command not found". Investigation revealed multiple gaps in the documented developer setup process.

### Reference
Session conversation - new environment onboarding attempt

## Evidence

### Current Documentation State

**README.md** - Development Setup section (lines 61-98):
- Documents backend setup (venv, pip install, run server)
- Documents frontend setup (npm install, run dev)
- Documents test running
- Mentions beads in Issue Tracking section with `bd` commands but **does not explain how to install beads**

**docs/CONTRIBUTING.md** - Local Development Setup section (lines 44-78):
- Lists prerequisites: Python 3.10+, Node.js 20+, Git
- Documents backend/frontend setup
- Documents pre-commit as optional
- References beads at the end: "We use Beads for issue tracking" with `bd` commands but **no installation instructions**

**.beads/README.md** - Contains installation instructions:
```bash
curl -sSL https://raw.githubusercontent.com/steveyegge/beads/main/scripts/install.sh | bash
```
This file exists but is not referenced from main setup docs.

### Observations

1. **Beads CLI not installed**: `bd` command not found in PATH. The `.beads/` directory exists with data, but the CLI tool is not installed.

2. **Beads installation undocumented**: README.md and CONTRIBUTING.md reference `bd` commands but never explain how to install beads. Installation instructions exist only in `.beads/README.md`.

3. **Root npm dependencies missing**: The root `package.json` has Playwright dependencies for E2E tests, but setup docs don't mention running `npm install` at the project root.

4. **Pre-commit not installed**: While documented as "optional", it's mentioned in workflow but `which pre-commit` returns not found.

5. **Environment verification**: No documented way to verify the development environment is correctly set up.

### Environment Status Found

| Component | Status | Documented? |
|-----------|--------|-------------|
| Python 3.12 | ✅ Installed | ✅ Yes |
| Node.js 24 | ✅ Installed | ✅ Yes |
| Backend venv | ✅ Exists | ✅ Yes |
| Frontend node_modules | ✅ Exists | ✅ Yes |
| Root node_modules (E2E) | ❌ Missing | ❌ No |
| Playwright browsers | ✅ Installed | Partial |
| pre-commit | ❌ Not installed | ⚠️ Optional |
| **beads (`bd`)** | ❌ Not installed | ❌ No |

## Potentially Affected Documentation

- [ ] `README.md` - Development Setup section
- [ ] `docs/CONTRIBUTING.md` - Local Development Setup section
- [ ] `CLAUDE.md` - Beads-First section references `bd` commands

## Gate 1 Evaluation
- **Decision**: YES
- **Evaluator**: User
- **Date**: 2026-01-19
- **AD Number**: AD-0104
- **Rationale**: Documentation references tools (beads, root npm) that new developers cannot use without undocumented installation steps. This blocks contributor onboarding.
