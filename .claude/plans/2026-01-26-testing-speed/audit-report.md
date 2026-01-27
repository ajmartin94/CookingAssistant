# E2E Test Audit Report

**Date:** 2026-01-26
**Branch:** testing-improvements
**Total files:** 25
**Total tests:** ~130+

---

## Summary

| Verdict | Count | Action |
|---------|-------|--------|
| Essential | 3 | Keep as-is |
| Consolidate | 14 | Merge into fewer files |
| Convert | 4 | Rewrite to test user outcomes, not implementation details |
| Delete | 4 | Redundant coverage |

---

## Audit Table

### Smoke Tests

| File | Test Name | User Experience Protected | Verdict | Target Tier | Notes |
|------|-----------|--------------------------|---------|-------------|-------|
| `smoke/app-health.spec.ts` | frontend serves HTML and React mounts | App completely broken, blank page | Essential | Smoke | Gate for all other tests |
| `smoke/app-health.spec.ts` | CSS loads and applies correctly | App renders unstyled/unusable | Essential | Smoke | |
| `smoke/app-health.spec.ts` | backend API is healthy | All data operations fail | Essential | Smoke | |
| `smoke/app-health.spec.ts` | login flow works end-to-end | Nobody can log in | Essential | Smoke | |
| `smoke/app-health.spec.ts` | authenticated requests work with stored token | Auth breaks after login | Essential | Smoke | |
| `smoke/app-health.spec.ts` | unauthenticated users are redirected to login | Private data exposed | Essential | Smoke | |

### Auth Tests

| File | Test Name | User Experience Protected | Verdict | Target Tier | Notes |
|------|-----------|--------------------------|---------|-------------|-------|
| `auth/login.spec.ts` | should login with valid credentials | User cannot sign in | Consolidate | Core | Merge login+logout+register into `core/auth.spec.ts` |
| `auth/login.spec.ts` | should show error for invalid username | User gets no feedback on bad login | Consolidate | Core | |
| `auth/login.spec.ts` | should show error for invalid password | User gets no feedback on bad login | Consolidate | Core | |
| `auth/login.spec.ts` | should persist authentication after page refresh | User gets logged out on refresh | Consolidate | Core | Duplicates smoke test + register persistence test |
| `auth/login.spec.ts` | should validate required fields | Empty form submits silently | Consolidate | Core | Overlaps with `validation-errors.spec.ts` login validation |
| `auth/logout.spec.ts` | should logout successfully | User cannot sign out | Consolidate | Core | Merge into `core/auth.spec.ts` |
| `auth/logout.spec.ts` | should redirect to login when accessing protected route after logout | Stale session accesses private data | Consolidate | Core | |
| `auth/logout.spec.ts` | should redirect to login when accessing recipes page after logout | Same as above | Delete | N/A | Redundant with previous test (same behavior, different URL) |
| `auth/register.spec.ts` | should register a new user successfully | New users cannot sign up | Consolidate | Core | Merge into `core/auth.spec.ts` |
| `auth/register.spec.ts` | should show error for duplicate username | User gets cryptic error on dupe username | Consolidate | Core | |
| `auth/register.spec.ts` | should show error for duplicate email | User gets cryptic error on dupe email | Consolidate | Core | |
| `auth/register.spec.ts` | should validate required fields | Empty form submits silently | Delete | N/A | Overlaps with `validation-errors.spec.ts` |
| `auth/register.spec.ts` | should persist authentication after page refresh | User gets logged out on refresh | Delete | N/A | Exact same scenario as `login.spec.ts` persistence test |

### Recipe CRUD Tests

| File | Test Name | User Experience Protected | Verdict | Target Tier | Notes |
|------|-----------|--------------------------|---------|-------------|-------|
| `recipes/create.spec.ts` | should create recipe with all fields | User cannot create recipes | Essential | Core | Core CRUD happy path |
| `recipes/create.spec.ts` | should validate required fields | Invalid recipes get saved | Consolidate | Comprehensive | Overlaps with `validation-errors.spec.ts` |
| `recipes/create.spec.ts` | should require at least one ingredient | Incomplete recipes get saved | Consolidate | Comprehensive | Overlaps with `validation-errors.spec.ts` |
| `recipes/create.spec.ts` | should require at least one instruction | Incomplete recipes get saved | Consolidate | Comprehensive | Overlaps with `validation-errors.spec.ts` |
| `recipes/create.spec.ts` | should persist recipe to database | Data loss - recipe not saved | Essential | Core | |
| `recipes/create.spec.ts` | should allow removing ingredients before submission | User stuck with wrong ingredients | Consolidate | Core | |
| `recipes/create.spec.ts` | should allow removing instructions before submission | User stuck with wrong instructions | Consolidate | Core | |
| `recipes/detail.spec.ts` | should display all recipe fields | User cannot see their recipe | Essential | Core | |
| `recipes/detail.spec.ts` | should display ingredients correctly | Ingredients not visible | Consolidate | Core | Could merge with "display all recipe fields" |
| `recipes/detail.spec.ts` | should display instructions in order | Instructions out of order | Consolidate | Core | Could merge with "display all recipe fields" |
| `recipes/detail.spec.ts` | should show edit and delete buttons for recipe owner | Owner cannot manage recipe | Consolidate | Core | |
| `recipes/detail.spec.ts` | should not show edit/delete buttons for non-owner | Other users can modify your recipe | Essential | Core | Authorization check |
| `recipes/detail.spec.ts` | should handle non-existent recipe (404) | Broken page on bad URL | Consolidate | Comprehensive | Overlaps with `network-errors.spec.ts` 404 test |
| `recipes/detail.spec.ts` | should navigate to edit page when clicking edit button | User cannot reach edit page | Consolidate | Core | |
| `recipes/detail.spec.ts` | should calculate total time correctly | Wrong time displayed | Consolidate | Comprehensive | Implementation detail |
| `recipes/detail.spec.ts` | should display recipe metadata | Metadata not visible | Consolidate | Core | Could merge with "display all fields" |
| `recipes/edit.spec.ts` | should update recipe title and description | User cannot edit recipes | Essential | Core | Core CRUD |
| `recipes/edit.spec.ts` | should update prep time, cook time, and servings | User cannot update times | Consolidate | Core | Merge into fewer edit tests |
| `recipes/edit.spec.ts` | should update cuisine and difficulty | User cannot update metadata | Consolidate | Core | |
| `recipes/edit.spec.ts` | should add new ingredients | User cannot add ingredients during edit | Consolidate | Core | |
| `recipes/edit.spec.ts` | should remove ingredients | User cannot remove ingredients during edit | Consolidate | Core | |
| `recipes/edit.spec.ts` | should modify existing ingredients | User cannot change ingredient amounts | Consolidate | Core | |
| `recipes/edit.spec.ts` | should add new instructions | User cannot add steps during edit | Consolidate | Core | |
| `recipes/edit.spec.ts` | should remove instructions | User cannot remove steps during edit | Consolidate | Core | |
| `recipes/edit.spec.ts` | should persist changes after page refresh | Edits lost on refresh | Consolidate | Core | |
| `recipes/edit.spec.ts` | should cancel edit without saving changes | Cancel button saves changes | Consolidate | Core | |
| `recipes/edit.spec.ts` | should validate required fields on edit | Invalid edits get saved | Consolidate | Comprehensive | Overlaps with `validation-errors.spec.ts` |
| `recipes/delete.spec.ts` | should delete recipe successfully | User cannot delete recipes | Essential | Core | Core CRUD |
| `recipes/delete.spec.ts` | should show confirmation dialog before deleting | Accidental deletion | Consolidate | Core | |
| `recipes/delete.spec.ts` | should cancel deletion when dismissing confirmation | No way to abort delete | Consolidate | Core | Could merge with confirmation test |
| `recipes/delete.spec.ts` | should remove recipe from database | Deleted recipe still accessible | Consolidate | Core | |
| `recipes/delete.spec.ts` | should not show delete button for non-owner | Other users can delete your recipe | Delete | N/A | Already covered by `detail.spec.ts` non-owner test |
| `recipes/delete.spec.ts` | should delete multiple recipes in sequence | Cannot delete more than one recipe | Consolidate | Comprehensive | Edge case |
| `recipes/delete.spec.ts` | should handle delete with ingredients and instructions | Complex recipes fail to delete | Consolidate | Comprehensive | Edge case |
| `recipes/delete.spec.ts` | should update recipe count after deletion | Stale list after delete | Consolidate | Core | |
| `recipes/list.spec.ts` | should display user recipes | Recipe list blank | Consolidate | Core | Overlaps heavily with `cookbook-page-redesign.spec.ts` |
| `recipes/list.spec.ts` | should search recipes by title | Search broken | Consolidate | Core | Duplicate of cookbook-page-redesign search test |
| `recipes/list.spec.ts` | should filter by cuisine type | Cuisine filter broken | Consolidate | Core | |
| `recipes/list.spec.ts` | should filter by difficulty level | Difficulty filter broken | Consolidate | Core | |
| `recipes/list.spec.ts` | should filter by dietary tags | Tag filter broken | Consolidate | Core | |
| `recipes/list.spec.ts` | should combine search and filters | Combined filtering broken | Consolidate | Comprehensive | |
| `recipes/list.spec.ts` | should clear filters | Cannot reset filters | Consolidate | Core | |
| `recipes/list.spec.ts` | should show empty state when no recipes | New user sees broken page | Consolidate | Core | Overlaps with cookbook-page-redesign empty state |
| `recipes/list.spec.ts` | should show empty state when search returns no results | No feedback on empty search | Consolidate | Core | Overlaps with cookbook-page-redesign |
| `recipes/list.spec.ts` | should navigate to recipe detail on click | Cannot open a recipe | Consolidate | Core | Overlaps with cookbook-page-redesign navigation |

### Redesign Tests

| File | Test Name | User Experience Protected | Verdict | Target Tier | Notes |
|------|-----------|--------------------------|---------|-------------|-------|
| `recipes/cookbook-page-redesign.spec.ts` | (28 tests) Grid layout, card content, search, sort, empty states, responsive, hover, collections, accessibility, pagination | Cookbook page visual/functional regression | Convert | Comprehensive | Heavily overlaps `recipes/list.spec.ts`. Tests implementation details (CSS grid column count, hover shadow changes, computed styles). Merge functional tests (search, sort, empty states) into `recipes/list.spec.ts`, move layout assertions to visual regression or delete. |
| `recipes/recipe-page-redesign.spec.ts` | (19 tests) Hero section, metadata bar, ingredients list, instructions/steps, timer buttons, edit nav, responsive layout, accessibility | Recipe detail page visual/functional regression | Convert | Comprehensive | Heavily overlaps `recipes/detail.spec.ts`. Tests implementation details (data-testid="metadata-bar", bounding box positions, CSS display values). Merge user-facing assertions into `detail.spec.ts`, delete layout pixel tests. |
| `home/home-redesign.spec.ts` | (9 tests) Chat input, suggestion chips, quick actions, greeting, context cards, responsive | Home page broken | Convert | Core | Tests implementation details (CSS grid display, data-testid containers). Keep quick action navigation tests, convert chat input test to user outcome. |

### Navigation Tests

| File | Test Name | User Experience Protected | Verdict | Target Tier | Notes |
|------|-----------|--------------------------|---------|-------------|-------|
| `navigation/navigation.spec.ts` | Desktop sidebar (5 tests) | Desktop navigation broken | Consolidate | Core | Keep sidebar visible + navigate tests. Collapse/expand and label visibility are comprehensive. |
| `navigation/navigation.spec.ts` | Mobile bottom tabs (5 tests) | Mobile navigation broken | Consolidate | Core | Keep tab bar visible + navigate tests. |
| `navigation/navigation.spec.ts` | Responsive switching (3 tests) | Layout breaks on resize | Consolidate | Comprehensive | |
| `navigation/navigation.spec.ts` | Tablet (1 test) | Tablet nav broken | Consolidate | Comprehensive | |

### Error Handling Tests

| File | Test Name | User Experience Protected | Verdict | Target Tier | Notes |
|------|-----------|--------------------------|---------|-------------|-------|
| `errors/network-errors.spec.ts` | should handle API errors gracefully on recipe creation | User sees blank/crash on network failure | Consolidate | Comprehensive | 9 tests total. Keep 3-4 representative error scenarios (network fail, 500, 401 redirect, 404). Delete retry login test (weak assertion), CORS test (duplicate of network fail), rate limiting (unlikely real scenario), invalid JSON (edge case). |
| `errors/network-errors.spec.ts` | should retry failed login attempts | Retry after failure | Delete | N/A | Weak test - assertion is `errorVisible \|\| attemptCount > 0` which always passes |
| `errors/validation-errors.spec.ts` | (15 tests) Registration, login, recipe creation, recipe edit validation | User gets no feedback on invalid input | Consolidate | Comprehensive | Many overlap with auth and recipe create tests. Keep recipe creation validation tests (they are more thorough here). Delete auth validation tests that duplicate `auth/*.spec.ts`. |

### Feature Tests

| File | Test Name | User Experience Protected | Verdict | Target Tier | Notes |
|------|-----------|--------------------------|---------|-------------|-------|
| `chat/chat-panel.spec.ts` | Feature 2: Create recipe via AI chat (4 tests) | AI recipe creation broken | Essential | Core | Core AI feature. Keep chat visibility, AI response timing, apply populates form, full create flow. |
| `chat/chat-panel.spec.ts` | Feature 3: Reject AI suggestion (4 tests) | Reject button broken, form corrupted | Consolidate | Core | Keep 2: reject preserves form + iterate after rejection. Merge the two "form unchanged" tests (pre-filled vs empty) into one. |
| `chat/chat-panel.spec.ts` | Feature 4: Edit existing recipe with AI (2 tests) | AI edit broken | Essential | Core | |
| `chat/chat-panel.spec.ts` | Feature 5: Chat history persistence (2 tests) | Chat history lost on refresh | Consolidate | Comprehensive | |
| `feedback/feedback.spec.ts` | (6 tests) Button visibility, modal interaction, submit flow | Users cannot submit feedback | Consolidate | Comprehensive | Low-criticality feature. Keep 2 tests: button visible + submit feedback successfully. |
| `settings/user-preferences.spec.ts` | (3 tests) Dietary restrictions, skill level, partial update | User preferences not saved | Essential | Core | Well-written tests with API verification. |
| `sharing/share-recipe.spec.ts` | (8 tests) Create share, access shared, revoke, permissions | Recipe sharing broken | Consolidate | Core | Mostly API-only tests (no UI interaction). Convert to backend integration tests or keep 3: create share link, access shared recipe without auth, revoke share blocks access. |
| `libraries/create.spec.ts` | (7 tests) Create library modal, name only, name+desc, public, cancel, validate, multiple, persist | Library creation broken | Consolidate | Core | Keep 2-3: create with name+description, persist after refresh. |
| `libraries/delete.spec.ts` | (5 tests) Delete, verify DB, delete one of many, empty state, delete multiple | Library deletion broken | Consolidate | Core | Keep 2: delete library + empty state after last deleted. |
| `libraries/list.spec.ts` | (4 tests) Empty state, display, count, navigate to detail | Library list broken | Consolidate | Core | Merge with create/delete into single `core/libraries.spec.ts`. |
| `libraries/recipes.spec.ts` | (6 tests) Add/remove recipe, multiple recipes, display in detail, empty state | Library-recipe association broken | Convert | Core | 3 of 6 tests are API-only (no UI). Convert those to backend integration tests. Keep display + empty state as E2E. |

### Responsive & Viewport Tests

| File | Test Name | User Experience Protected | Verdict | Target Tier | Notes |
|------|-----------|--------------------------|---------|-------------|-------|
| `responsive/viewports.spec.ts` | Mobile (4 tests) | Mobile layout broken | Consolidate | Comprehensive | Overlaps with cookbook-page-redesign mobile tests and recipe-page-redesign mobile tests. Merge all responsive tests into one file. |
| `responsive/viewports.spec.ts` | Tablet (2 tests) | Tablet layout broken | Consolidate | Comprehensive | |
| `responsive/viewports.spec.ts` | Desktop (3 tests) | Desktop layout broken | Consolidate | Comprehensive | |
| `responsive/viewports.spec.ts` | Login responsive (2 tests) | Login unusable on mobile | Consolidate | Comprehensive | |
| `responsive/viewports.spec.ts` | Recipe detail responsive (1 test) | Detail page broken on mobile | Consolidate | Comprehensive | |

### Workflow Tests

| File | Test Name | User Experience Protected | Verdict | Target Tier | Notes |
|------|-----------|--------------------------|---------|-------------|-------|
| `workflows/complete-recipe-journey.spec.ts` | Full user journey (register->create->view->edit->delete->logout) | Core user journey broken | Essential | Core | Single most valuable test. Covers the entire happy path. |
| `workflows/complete-recipe-journey.spec.ts` | Multiple recipes journey | Multi-recipe workflow broken | Consolidate | Core | Useful but long. Consider making it comprehensive tier. |
| `workflows/complete-recipe-journey.spec.ts` | Persist data across refreshes | Data lost on refresh | Consolidate | Core | Overlaps with individual persistence tests in auth and recipes. |

---

## Key Redundancy Findings

### 1. `recipes/list.spec.ts` vs `recipes/cookbook-page-redesign.spec.ts`
These two files test the **same page** (cookbook/recipes list). `list.spec.ts` tests functional behavior (search, filter, empty state). `cookbook-page-redesign.spec.ts` re-tests the same functional behavior AND adds layout/CSS assertions. **Action:** Merge functional tests into one file. Delete CSS implementation tests or convert to visual regression.

### 2. `recipes/detail.spec.ts` vs `recipes/recipe-page-redesign.spec.ts`
Same situation. Both test the recipe detail page. The redesign file adds layout assertions (bounding box positions, CSS grid display). **Action:** Merge into one file.

### 3. Auth persistence tested 3 times
- `auth/login.spec.ts` - persist auth after refresh
- `auth/register.spec.ts` - persist auth after refresh
- `smoke/app-health.spec.ts` - authenticated requests work

**Action:** Keep only the smoke test version. Remove from login and register.

### 4. Validation tested in 3 places
- `errors/validation-errors.spec.ts` - dedicated validation tests
- `recipes/create.spec.ts` - validate required fields, ingredients, instructions
- `auth/login.spec.ts` / `auth/register.spec.ts` - validate required fields

**Action:** Consolidate all validation into `errors/validation-errors.spec.ts` or into respective CRUD files. Remove duplicates.

### 5. Responsive tested in 4 places
- `responsive/viewports.spec.ts`
- `recipes/cookbook-page-redesign.spec.ts` (mobile, tablet, desktop, wide sections)
- `recipes/recipe-page-redesign.spec.ts` (desktop, mobile sections)
- `home/home-redesign.spec.ts` (desktop, mobile sections)
- `navigation/navigation.spec.ts` (responsive switching)

**Action:** Consolidate all responsive tests into `responsive/viewports.spec.ts`.

### 6. Non-owner authorization tested twice
- `recipes/detail.spec.ts` - should not show edit/delete buttons for non-owner
- `recipes/delete.spec.ts` - should not show delete button for non-owner

**Action:** Keep only the detail page version.

---

## Recommended Target Structure

```
e2e/tests/
├── smoke/
│   └── app-health.spec.ts          # Keep as-is (6 tests) - GATE
├── core/
│   ├── auth.spec.ts                # Merged from auth/login + logout + register (8 tests)
│   ├── recipe-crud.spec.ts         # Merged from create + detail + edit + delete + list (20 tests)
│   ├── chat.spec.ts                # From chat-panel.spec.ts core features (8 tests)
│   ├── libraries.spec.ts           # Merged from create + delete + list + recipes (8 tests)
│   ├── settings.spec.ts            # From user-preferences.spec.ts (3 tests)
│   ├── sharing.spec.ts             # From share-recipe.spec.ts (3 tests, rest to backend)
│   ├── home.spec.ts                # From home-redesign.spec.ts (4 tests)
│   └── navigation.spec.ts          # Trimmed navigation.spec.ts (6 tests)
├── comprehensive/
│   ├── error-handling.spec.ts      # Merged from network-errors + validation-errors (10 tests)
│   ├── responsive.spec.ts          # Merged from viewports + redesign responsive tests (8 tests)
│   ├── feedback.spec.ts            # Trimmed from feedback.spec.ts (2 tests)
│   └── chat-edge-cases.spec.ts     # Chat history, rejection edge cases (4 tests)
└── workflows/
    └── complete-journey.spec.ts    # Keep as-is (3 tests)
```

**Estimated reduction:** ~130 tests across 25 files -> ~85 tests across 15 files
**Estimated speed improvement:** 30-40% faster (fewer test setups, less browser overhead, reduced redundancy)
