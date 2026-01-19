# AD-0008: Beads Issue Tracking + GitHub Actions CI/CD

## Status
Implemented

## Metadata
- **Author**: Claude (AI Assistant)
- **Date**: 2026-01-16 (retroactive documentation)
- **Original Decision Date**: 2024-2025 (evolved during development)
- **Trigger Type**: retroactive-documentation
- **Batch**: Retroactive-2026-01

## Retroactive Documentation Notice
This ADR documents a decision made during development and is being retroactively
recorded. The decision is already implemented in the codebase.

## Context

The Cooking Assistant project needed issue tracking that integrates well with
AI-assisted development workflows and version control. Traditional issue trackers
(GitHub Issues, Jira) don't provide the structured data and git-native approach
optimal for AI agent collaboration. Additionally, the project needed CI/CD
infrastructure for automated testing, linting, and deployment verification.

## Problem Statement

How should we track development work and automate CI/CD in a way that supports
both human developers and AI assistants working on the codebase?

## Decision

We will use Beads for git-native, AI-friendly issue tracking stored as JSONL files
in the repository, and GitHub Actions for CI/CD pipelines covering backend, frontend,
and E2E testing.

## Alternatives Considered

### Option A: Beads + GitHub Actions - SELECTED

**Description**: Beads issue tracker with git-tracked JSONL storage, plus GitHub
Actions workflows for automated testing and CI/CD.

**Pros**:
- Beads stores issues as structured data (JSONL) optimized for AI consumption
- Issues travel with the code in version control
- Rich fields for design notes, acceptance criteria, session notes
- No external service dependency for issue tracking
- GitHub Actions free for public repos, integrated with PR workflow
- Matrix testing across multiple Python/Node versions
- Artifact retention for debugging

**Cons**:
- Beads is less familiar than traditional issue trackers
- JSONL files can grow large over time
- GitHub Actions learning curve for complex workflows
- No GUI dashboard for beads (CLI-based)

**Recommendation**: Selected

### Option B: GitHub Issues

**Description**: GitHub's built-in issue tracking with labels and projects.

**Pros**:
- Well-integrated with GitHub
- Familiar to most developers
- Web UI for non-technical stakeholders
- Free and built-in

**Cons**:
- Not optimized for AI agent workflows
- Unstructured markdown doesn't parse well for automation
- Separate from code (requires API calls to access)
- Limited structured metadata

**Recommendation**: Not selected — doesn't provide AI-native structured data;
requires API access rather than file-based operations

### Option C: Jira

**Description**: Enterprise issue tracking with extensive customization.

**Pros**:
- Powerful workflow customization
- Extensive reporting
- Enterprise integrations

**Cons**:
- External service dependency
- Complex for small project
- Not AI-native
- Expensive for premium features

**Recommendation**: Not selected — overkill for project size; external dependency
conflicts with local-first philosophy

### Option D: GitLab CI/CD

**Description**: GitLab's integrated CI/CD instead of GitHub Actions.

**Pros**:
- Tightly integrated with GitLab
- Good container registry integration
- Self-hosted option

**Cons**:
- Would require moving from GitHub
- Less familiar ecosystem
- Additional migration effort

**Recommendation**: Not selected — project is on GitHub; Actions provide sufficient
CI/CD capabilities

### Status Quo: N/A (greenfield)

This was a greenfield project with no existing infrastructure.

## Consequences

**Positive**:
- AI assistants can read/write issues directly via file operations
- Issues version-controlled alongside code
- CI catches regressions automatically
- Multi-browser E2E testing via matrix
- Artifact retention helps debug CI failures

**Negative**:
- Beads requires CLI familiarity
- JSONL files require occasional compaction
- GitHub Actions minutes can accumulate on private repos

**Constraints**:
- All work must be tracked in beads before implementation
- CI must pass before merging to main
- Smoke tests must pass before E2E tests run
- Environment configuration via repository secrets

## Code Evidence

The following files demonstrate this decision:

- `.beads/` — Beads issue tracking directory
- `.github/workflows/backend-ci.yml` — Backend CI with pytest and linting
- `.github/workflows/frontend-ci.yml` — Frontend CI with vitest
- `.github/workflows/e2e-tests.yml` — E2E testing across browsers
- `CLAUDE.md` — Documents beads-first workflow

Example from `CLAUDE.md`:
```markdown
### 1. Beads-First
All work MUST be tracked in beads. Use the `/beads` skill for workflow guidance.

```bash
bd ready                              # Find available work
bd show <id>                          # Review details
bd update <id> --status=in_progress   # Claim it
```
```

Example from `.github/workflows/backend-ci.yml:59-62`:
```yaml
- name: Run tests with pytest
  working-directory: ./backend
  run: |
    pytest --cov=app --cov-report=xml --cov-report=term
```

Beads workflow from session hooks:
```bash
bd ready           # Find available work
bd show <id>       # Review issue details
bd update <id> --status=in_progress  # Claim it
```

GitHub Actions matrix from `backend-ci.yml:17-19`:
```yaml
strategy:
  matrix:
    python-version: ['3.10', '3.11', '3.12']
```

## Gate 1 Evaluation
- **Decision**: YES
- **Evaluator**: User (batch approval)
- **Date**: 2026-01-16
- **Rationale**: Batch retroactive approval - foundational infrastructure decision

## Gate 2 Approval
- **Decision**: APPROVE
- **Approver**: User (batch approval)
- **Date**: 2026-01-16
- **Notes**: Batch retroactive approval - decision validated through successful implementation

## Gate 3 Approval
- **Decision**: APPROVE
- **Approver**: User (batch approval)
- **Date**: 2026-01-16
- **Notes**: No propagation required - already implemented in codebase
