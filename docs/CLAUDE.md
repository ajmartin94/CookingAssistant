# CLAUDE.md - Documentation Development Guide

**Last Updated:** 2026-01-03
**Focus:** Documentation Management, Planning, and Archival

This guide covers documentation standards, management of implementation plans, and archival procedures. For general project guidance, see [../CLAUDE.md](../CLAUDE.md).

---

## 📋 Table of Contents

1. [Documentation Strategy](#documentation-strategy)
2. [Active Development Management](#active-development-management)
3. [Master Implementation Plan](#master-implementation-plan)
4. [Archival Procedures](#archival-procedures)
5. [Documentation Standards](#documentation-standards)
6. [Common Documentation Tasks](#common-documentation-tasks)

---

## 📚 Documentation Strategy

The documentation system uses a multi-tier approach:

### Documentation Tiers

```
docs/
├── master_implementation_plan.md    # Overall project roadmap & phases
├── active_development/              # Current work being tracked
│   ├── CLAUDE.md                   # This guide (active dev practices)
│   ├── implementation_plan.md       # Current phase implementation details
│   └── ...                          # Other active plans
├── archive/                         # Completed or deprecated plans
│   ├── phase-1-core-recipe-library/ # Completed feature documentation
│   ├── phase-2-ai-recipe-builder/   # Completed feature documentation
│   └── ...
└── CLAUDE.md                        # This file (docs management)
```

### Documentation Purposes

- **master_implementation_plan.md**: High-level project roadmap, overall architecture decisions, phased rollout plan
- **active_development/implementation_plan.md**: Detailed implementation strategy for current phase, task breakdown, status tracking
- **archive/**: Historical implementation approaches, completed features, design decisions for reference

---

## 🔄 Active Development Management

### What Goes in active_development/?

The `active_development/` directory contains detailed documentation for the **current development phase**:

1. **implementation_plan.md**
   - Comprehensive breakdown of current phase
   - Task checklists with status
   - Detailed implementation steps
   - Progress tracking
   - File organization maps
   - Success metrics

2. **CLAUDE.md** (optional)
   - Phase-specific development conventions
   - Special patterns or approaches for this phase
   - Known gotchas or considerations
   - Phase-specific tooling setup

3. **Other supporting files**
   - Architecture diagrams (if complex)
   - Data flow documentation
   - API endpoint specifications
   - Schema definitions
   - Configuration examples

### Creating a New Active Development Plan

When starting a new development phase:

1. **Create phase directory** (optional): `docs/active_development/phase-<n>-<name>/`

2. **Create implementation_plan.md** with structure:
   ```markdown
   # Phase N: <Phase Name> Implementation Plan

   **Last Updated:** YYYY-MM-DD
   **Status:** In Progress
   **Target Completion:** YYYY-MM-DD

   ## Overview
   - What is this phase about?
   - What are the main goals?
   - What gets delivered?

   ## Implementation Phases
   ### Phase N.1: <Sub-phase Name>
   - [ ] Task 1
   - [ ] Task 2
   - ...

   ## File Structure
   ```
   backend/
   frontend/
   docs/
   ```

   ## Current Status
   - Completed: X/Y tasks
   - In Progress: Task Name
   - Pending: Task Name, Task Name

   ## Success Metrics
   - Coverage: X%
   - Tests: Y passing
   - Performance: Z ms

   ## References
   - Link to master plan
   - Links to related documentation
   ```

3. **Update master_implementation_plan.md** to reference new active development plan

4. **Track progress regularly** - Update status section as work progresses

### Maintaining Active Plans

**Weekly Updates:**
- Update "Current Status" section
- Mark completed tasks with checkmarks
- Add notes on blockers or discoveries
- Update estimated completion if needed

**Before Moving to Next Phase:**
- Ensure all tasks are marked complete
- Document final outcomes
- Note lessons learned
- Prepare for archival

---

## 📋 Master Implementation Plan

### master_implementation_plan.md Purpose

This is the **high-level project roadmap** containing:
- Overall project goals and vision
- Phased development breakdown
- Architectural decisions
- Technology choices and rationale
- Long-term roadmap (all phases)
- Key success metrics for entire project

### Master Plan Structure

```markdown
# Cooking Assistant - Master Implementation Plan

**Last Updated:** YYYY-MM-DD
**Project Status:** [Planning | Phase 1 | Phase 2 | ...]

## Executive Summary
- Project vision
- Key objectives
- Target users
- Success definition

## Project Phases

### Phase 1: Core Recipe Library
**Status:** Complete/In Progress/Planned
**Duration:** 4 weeks
**Deliverables:** Core CRUD, user auth, recipe management
**Active Plan:** [Link to active_development/implementation_plan.md]

### Phase 2: AI Recipe Builder
**Status:** Planned
**Duration:** 4 weeks
**Deliverables:** AI recipe generation, meal planning

... more phases ...

## Technical Architecture
- Backend stack
- Frontend stack
- Database design
- Integration points

## Success Metrics
- Code coverage targets
- Performance targets
- User experience goals

## Risk Assessment
- Known risks
- Mitigation strategies

## References
- Links to detailed phase plans
- Links to technical specifications
```

### Updating Master Plan

**When to Update:**
- After completing a phase
- When architectural decisions are made
- When roadmap priorities change
- When new phases are added

**How to Update:**
1. Update "Last Updated" date
2. Update current phase status
3. Add link to active_development plan
4. Document any new technical decisions
5. Ensure consistency with active plans

---

## 📦 Archival Procedures

### When to Archive

Archive a phase when:
- All tasks are completed and tested
- Code is merged to main branch
- Documentation is finalized
- Lessons learned are documented
- Handoff to maintenance is complete

### How to Archive

1. **Create archive subdirectory:**
   ```bash
   mkdir -p docs/archive/phase-<n>-<name>
   ```

2. **Move or copy the plan:**
   ```bash
   cp docs/active_development/implementation_plan.md \
      docs/archive/phase-<n>-<name>/implementation_plan.md
   ```

3. **Add archive metadata** - Add README with:
   ```markdown
   # Phase N: <Name> - Archived

   **Completion Date:** YYYY-MM-DD
   **Status:** Complete

   ## Summary
   - What was completed
   - Key outcomes
   - Lessons learned
   - Metrics achieved

   ## Implementation Details
   See implementation_plan.md for detailed breakdown.

   ## Lessons Learned
   - Key insight 1
   - Key insight 2
   - Recommendation for future similar work

   ## Commits
   - Link to commit range that implemented this phase
   - e.g., `git log --oneline <sha1>..<sha2>`
   ```

4. **Clear active_development/** (for the phase being archived)

5. **Update master_implementation_plan.md**
   - Update phase status to "Complete"
   - Update link to archived documentation
   - Add completion date

6. **Document in git commit:**
   ```bash
   git add docs/archive/phase-<n>-<name>/
   git commit -m "archive: move phase <n> documentation to archive"
   ```

### Archive Structure Example

```
docs/archive/
├── phase-1-core-recipe-library/
│   ├── README.md                      # Archive metadata
│   ├── implementation_plan.md          # Original plan
│   └── completed-tasks.md             # Final status snapshot
├── phase-2-ai-recipe-builder/
│   ├── README.md
│   ├── implementation_plan.md
│   └── architecture-decisions.md
└── ...
```

---

## 📝 Documentation Standards

### Markdown Standards

- **Use ATX headers** (`#`, `##`, `###`)
- **Max line length**: 100 characters (for readability)
- **Use lists** for structure clarity
- **Use code blocks** for examples with language tags
- **Use tables** for comparisons and structured data
- **Use emojis** sparingly for visual structure only

### File Naming

- **Implementation plans**: `implementation_plan.md`
- **Phase archives**: `phase-<number>-<name>/`
- **Supporting docs**: `<descriptive-name>.md`
- **Temporary notes**: `.tmp_<purpose>.md` (don't commit)

### Version Control

**What to Commit:**
- ✅ Approved implementation plans
- ✅ Completed phase archives
- ✅ Design decisions and rationale
- ✅ Architecture documentation
- ✅ This CLAUDE.md guide

**What NOT to Commit:**
- ❌ Temporary notes or drafts
- ❌ Personal implementation scratch files
- ❌ Sensitive information
- ❌ Large binary files (use links instead)

### Update Frequency

**After Each Major Milestone:**
- Update "Last Updated" date
- Mark completed tasks
- Add notes on key decisions
- Update metrics/progress

**Before Completing a Phase:**
- Final comprehensive review
- Cross-check against original goals
- Document lessons learned
- Prepare for archival

---

## 🛠️ Common Documentation Tasks

### Task 1: Create New Implementation Plan for Phase

```bash
# 1. Create directory structure
mkdir -p docs/active_development/phase-<n>-<description>

# 2. Create the implementation plan file
touch docs/active_development/phase-<n>-<description>/implementation_plan.md

# 3. Use template from "Creating a New Active Development Plan" section above

# 4. Update master_implementation_plan.md with link

# 5. Commit
git add docs/active_development/
git commit -m "docs: create phase <n> implementation plan"
```

### Task 2: Update Phase Progress

**During Development:**
```bash
# 1. Edit the active implementation_plan.md
#    - Check off completed tasks
#    - Add notes on current work
#    - Update status section
#    - Document any blockers

# 2. Commit progress updates
git add docs/active_development/implementation_plan.md
git commit -m "docs: update phase <n> progress - <what changed>"
```

### Task 3: Archive Completed Phase

```bash
# 1. Ensure all tasks are complete and code is merged

# 2. Create archive directory
mkdir -p docs/archive/phase-<n>-<name>

# 3. Move files to archive
cp docs/active_development/implementation_plan.md \
   docs/archive/phase-<n>-<name>/

# 4. Create README with completion details
# See "How to Archive" section for template

# 5. Update master plan
# - Mark phase as Complete
# - Update link to archive location
# - Add completion date

# 6. Commit
git add docs/archive/ docs/master_implementation_plan.md
git commit -m "archive: move phase <n> to archive - completed"

# 7. Clear active_development (if no other active phases)
# rm -rf docs/active_development/<phase-dir>
```

### Task 4: Link to Implementation Plan in Code

When implementing features, reference the plan:

```python
# backend/app/services/recipe_service.py
"""
Recipe service - implements Phase 1: Core Recipe Library

See: docs/active_development/implementation_plan.md
Tasks: Create Recipe (1.3), Update Recipe (1.4), Delete Recipe (1.5)
"""
```

```typescript
// frontend/src/services/recipeApi.ts
/**
 * Recipe API Client - implements Phase 1: Core Recipe Library
 *
 * See: docs/active_development/implementation_plan.md
 * Tasks: Recipe List (1.2), Get Recipe (1.3), Create Recipe (1.4)
 */
```

---

## 📊 Documentation Metrics

### Plan Completeness

A good implementation plan includes:
- ✅ Clear objectives and success criteria
- ✅ Detailed task breakdown with estimates
- ✅ File structure documentation
- ✅ Progress tracking section
- ✅ Testing requirements
- ✅ References to related documentation

### Archive Completeness

A well-archived phase includes:
- ✅ Original implementation plan
- ✅ Final status/outcomes
- ✅ Lessons learned
- ✅ Links to actual code commits
- ✅ Performance/coverage metrics achieved
- ✅ Recommendations for similar future work

---

## 🔍 Best Practices

### DO's ✅

- **Keep plans current** - Update regularly, not just at phase end
- **Use checklists** - Make progress visible and tangible
- **Link to code** - Reference actual files implementing the plan
- **Document decisions** - Record why choices were made
- **Archive thoughtfully** - Save lessons for future reference
- **Be specific** - "User authentication" vs "JWT-based OAuth2 login for mobile app"
- **Update dates** - Track when documentation was last reviewed
- **Cross-reference** - Link between related plans and code

### DON'Ts ❌

- **Don't let plans go stale** - Review and update weekly minimum
- **Don't mix phases** - Keep each phase's work distinct
- **Don't hide blockers** - Document challenges and how they were resolved
- **Don't archive incomplete work** - Finish before moving to archive
- **Don't delete old plans** - Keep them for historical reference
- **Don't be vague** - "Performance improvements" should be quantified
- **Don't forget lessons** - Document what worked and what didn't
- **Don't leave broken links** - Maintain accurate cross-references

---

## 📚 Documentation Maintenance Schedule

### Daily
- Review active_development plan for today's work
- Update task status as you work

### Weekly
- Update overall progress metrics
- Document any blockers or discoveries
- Check for broken links or outdated information

### At Phase Completion
- Final comprehensive review of plan
- Document lessons learned and metrics
- Archive phase documentation
- Update master plan

### Monthly
- Review all documentation for accuracy
- Update "Last Updated" dates
- Consolidate related documentation
- Plan next phase documentation

---

## 📖 Related Documentation

- **[../CLAUDE.md](../CLAUDE.md)** - General project guidance
- **[../backend/CLAUDE.md](../backend/CLAUDE.md)** - Backend development
- **[../frontend/CLAUDE.md](../frontend/CLAUDE.md)** - Frontend development
- **[../README.md](../README.md)** - Project overview
- **[./master_implementation_plan.md](./master_implementation_plan.md)** - Overall roadmap
- **[./active_development/](./active_development/)** - Current phase plans

---

## 💡 Questions or Issues?

When managing documentation:
1. Check the structure in "Documentation Strategy" section
2. Review examples in "Common Documentation Tasks"
3. Refer to templates provided
4. Keep it simple and consistent
5. Update as you go, don't wait until the end

Remember: Good documentation is maintained documentation!
