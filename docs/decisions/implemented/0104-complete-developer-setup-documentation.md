# AD-0104: Complete Developer Setup Documentation

## Status
Implemented

## Metadata
- **Author**: Claude (with user)
- **Date**: 2026-01-19
- **Evidence Reference**: [docs/decisions/evidence/2026-01-19-developer-setup-gaps.md](../evidence/2026-01-19-developer-setup-gaps.md)
- **Trigger Type**: question

## Context

During onboarding to a fresh development environment, the `bd ready` command failed because beads CLI was not installed. Investigation revealed that multiple tools required for the documented development workflow are not covered in setup instructions. The project's "Beads-First" development principle requires the `bd` command, but installation instructions only exist in `.beads/README.md`, which is not referenced from main documentation. Similarly, E2E tests require root-level npm dependencies that are not mentioned in setup docs.

## Problem Statement

New developers cannot complete the documented development workflow because setup instructions are incomplete. Specifically:
1. Beads CLI (`bd`) is referenced but installation is not documented
2. Root `npm install` for E2E/Playwright dependencies is not documented
3. There is no way to verify the environment is correctly configured

## Decision

We will update README.md and docs/CONTRIBUTING.md to include complete setup instructions for all tools required by the documented workflow, including beads CLI installation, root npm dependencies for E2E tests, and an environment verification checklist.

## Alternatives Considered

### Option A: Update Existing Docs with Complete Setup Instructions

**Description**: Add beads installation, root npm install, and verification steps to README.md and CONTRIBUTING.md. Keep setup in existing files where developers already look.

**Pros**:
- No new files to maintain
- Developers find everything in expected locations
- Minimal documentation restructuring

**Cons**:
- README.md Development Setup section grows longer
- Some duplication between README and CONTRIBUTING

**Recommendation**: Selected

### Option B: Create Dedicated SETUP.md File

**Description**: Create a new `docs/SETUP.md` with comprehensive setup instructions, link from README and CONTRIBUTING.

**Pros**:
- Single source of truth for setup
- README stays concise
- Room for detailed troubleshooting

**Cons**:
- Yet another file developers must find
- Requires updating links in multiple places
- More maintenance overhead

**Recommendation**: Not selected — adds indirection when existing docs can be updated directly

### Option C: Status Quo

**Description**: Leave documentation as-is. Developers discover missing tools through errors.

**Pros**:
- No documentation effort
- .beads/README.md already has beads install instructions (if found)

**Cons**:
- Violates "Beads-First" principle by making it hard to use beads
- Poor developer experience
- Wastes time debugging missing tools
- Current pain point that triggered this ADR

**Recommendation**: Not selected — contradicts project principles and causes friction

## Consequences

**What becomes easier**:
- New developer onboarding
- Environment setup on new machines
- Verifying environment is correctly configured

**What becomes harder**:
- Nothing significant

**New constraints**:
- Must keep setup docs updated when adding new required tools

## Affected Documentation

| File | Section | Change Required |
|------|---------|-----------------|
| `README.md` | Prerequisites (new) | Add beads CLI to prerequisites |
| `README.md` | Development Setup | Add beads install command, root npm install for E2E |
| `docs/CONTRIBUTING.md` | Prerequisites | Add beads CLI requirement |
| `docs/CONTRIBUTING.md` | Local Development Setup | Add beads install, root npm install steps |
| `docs/CONTRIBUTING.md` | Issue Tracking | Already references bd, ensure install is covered above |

## Gate 2 Evaluation
- **Decision**: APPROVE
- **Evaluator**: User
- **Date**: 2026-01-19

## Propagation Report

### Changes Made

**README.md**:
- Added `<!-- Per AD-0104 -->` traceability comment
- Added "Prerequisites" section listing Python, Node.js, Git, and Beads CLI
- Added "Install Beads CLI" section with curl install command and verification step
- Added "E2E Test Setup (Playwright)" section with root npm install and browser install steps

**docs/CONTRIBUTING.md**:
- Added `<!-- Per AD-0104 -->` traceability comment
- Added Beads CLI to Prerequisites list
- Added "Install Beads CLI" section with install command
- Added "E2E Test Setup" section with root npm install and browser install steps

## Gate 3 Evaluation
- **Decision**: APPROVE
- **Evaluator**: User
- **Date**: 2026-01-19
