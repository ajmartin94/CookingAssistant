# Testing Speed Optimization Brainstorm

**Issue:** #34 - Testing speed
**Date:** 2026-01-26
**Branch:** testing-improvements

---

## Problem / Motivation

The E2E test suite has grown to 25 files (6,560 lines) running across 3 browsers, taking ~15 minutes while providing low value:

- **Tests miss real bugs:** UI/UX issues and workflow breaks slip through
- **Tests check wrong things:** Implementation details (e.g., `display: grid`) instead of user outcomes
- **Redundancy:** Multiple tests verify the same functionality (redesign tests overlap CRUD tests)
- **Multi-browser overhead:** Same tests run 3x for minimal cross-browser benefit

The pain is felt both locally (slow dev feedback loop) and in CI (slow PR feedback).

---

## Key Decisions

### 1. Approach: Ruthless Audit + Tiered Strategy

**Hybrid approach chosen:** First audit to eliminate waste, then implement tiered execution.

**Aggression level:** Ruthless - delete anything that doesn't protect a clear user outcome. OK to lose some coverage if it's not protecting real user experiences.

### 2. Audit Framework

Every test must answer: **"What user experience breaks if this test is deleted?"**

| Verdict | Criteria | Action |
|---------|----------|--------|
| **Essential** | Clear answer: "User can't [action]" or "User sees [broken thing]" | Keep |
| **Consolidate** | Tests same thing as another essential test | Merge as assertion |
| **Convert** | Tests implementation instead of outcome | Rewrite to test outcome |
| **Delete** | Vague answer or no clear user impact | Remove |

### 3. Tier Assignment: By User Impact

| Tier | User Impact | Examples |
|------|-------------|----------|
| **Smoke** | Can't use app at all | App won't load, can't log in, navigation broken |
| **Fast** | Core CRUD broken | Can't create/edit/delete recipes, libraries |
| **Full** | Edge cases, polish | Error messages, validation edge cases, responsive |

### 4. Browser Matrix: Chromium Only

**All tiers run Chromium only.** Multi-browser testing eliminated entirely.

Rationale: Cross-browser bugs are rare relative to the cost. The time saved (~2/3 reduction) outweighs the risk.

### 5. Viewport/Responsive Tests: Full Tier Only

Responsive tests are edge cases, not critical path. They run only in the Full tier.

### 6. Database Isolation: Fresh Per Tier

Each tier run starts with a clean database. No state sharing between tiers to prevent test pollution.

### 7. CI Trigger: All Tiers on Every PR

All tiers (Smoke, Fast, Full) run on every PR. Comprehensive coverage before merge.

---

## Chosen Design

### Test Organization

```
e2e/tests/
├── smoke/              # Tier 1: app fundamentally works
│   └── app-health.spec.ts
├── core/               # Tier 2: user journeys work
│   ├── auth.spec.ts
│   ├── recipes.spec.ts
│   ├── libraries.spec.ts
│   └── workflows.spec.ts
└── comprehensive/      # Tier 3: edge cases, polish
    ├── errors.spec.ts
    ├── validation.spec.ts
    └── responsive.spec.ts
```

### Playwright Configuration

```typescript
// playwright.config.ts
projects: [
  { name: 'smoke', testDir: './e2e/tests/smoke' },
  { name: 'fast', testDir: './e2e/tests/core', dependencies: ['smoke'] },
  { name: 'full', testDir: './e2e/tests', dependencies: ['smoke'] },
]
```

All projects use `devices['Desktop Chrome']` only.

### npm Scripts

```json
{
  "test:e2e:smoke": "playwright test --project=smoke",
  "test:e2e:fast": "playwright test --project=smoke --project=fast",
  "test:e2e:full": "playwright test --project=full",
  "test:e2e": "playwright test --project=smoke --project=fast"
}
```

Default `test:e2e` runs Smoke + Fast for quick local iteration.

### CI Workflow

- **On PR:** Run all tiers (smoke, fast, full) with Chromium only
- **On merge to main:** Same as PR (all tiers, Chromium only)

---

## Implementation Phases

### Phase 1: Audit

1. Review all 25 E2E test files
2. For each test, document: name, user experience protected, verdict (Essential/Consolidate/Convert/Delete)
3. Produce audit report as markdown table
4. Get approval before proceeding to restructure

### Phase 2: Restructure

1. Delete tests marked for deletion
2. Consolidate overlapping tests into journey-based tests
3. Convert implementation tests to outcome tests
4. Reorganize into tier folders (smoke/, core/, comprehensive/)
5. Update page objects if methods become unused

### Phase 3: Configure

1. Update `playwright.config.ts` with tier projects (Chromium only)
2. Add npm scripts for each tier
3. Update CI workflow `.github/workflows/e2e-tests.yml`
4. Update documentation: `docs/TESTING.md`, `e2e/CLAUDE.md`

---

## Expected Outcome

| Metric | Before | After |
|--------|--------|-------|
| Test files | 25 | 10-15 |
| Browsers | 3 | 1 |
| Local dev time | ~15 min | ~3-5 min |
| Tests protect user outcomes | Partial | All |

---

## Reviewer Questions & Answers

**Q: How are specific tests categorized into tiers?**
A: By user impact - Smoke (can't use app), Fast (core CRUD broken), Full (edge cases).

**Q: What happens to viewport/responsive tests?**
A: Full tier only - they're edge cases, not critical path.

**Q: Should tiers share database state?**
A: No - fresh DB per tier run for isolation.

**Q: What browser matrix for Full tier?**
A: Chromium only - multi-browser matrix eliminated entirely.

**Q: When does Full tier run?**
A: Every PR - comprehensive coverage before merge.

---

## Open Questions

None - all blocking questions resolved.

---

## Next Steps

Run `/plan` to structure this for TDD execution.
