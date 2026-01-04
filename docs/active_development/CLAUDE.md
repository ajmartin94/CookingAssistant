# CLAUDE.md - Active Development Phase Guide

**Last Updated:** 2026-01-03
**Current Phase:** Phase 1 Complete - Comprehensive Testing Implementation

This guide covers working on active development phases and their documentation. For general documentation practices, see [../CLAUDE.md](../CLAUDE.md).

---

## 📋 Quick Reference

### Current Active Development
- **What:** Comprehensive testing suite implementation
- **Phase:** 1 (Core Testing Infrastructure)
- **Plan:** [implementation_plan.md](./implementation_plan.md)
- **Status:** Core infrastructure complete, unit tests in progress

### Directory Structure
```
docs/active_development/
├── CLAUDE.md                   # This file
├── implementation_plan.md       # Detailed task breakdown
└── [other phase files]
```

---

## 🎯 How to Use This Directory

### For Phase Developers

**At Start of Day:**
1. Open [implementation_plan.md](./implementation_plan.md)
2. Find "Current Status" section
3. Check which task is "In Progress"
4. Open that section in the plan
5. Follow the "Implementation Steps"

**During Development:**
1. Reference the implementation plan for step-by-step guidance
2. As you complete tasks, mark them with ✅ in the plan
3. Document blockers or decisions in the "Notes" section
4. Commit changes with reference to task number (e.g., "test: implement auth service tests (Phase 1.2)")

**At End of Day:**
1. Update task status in implementation_plan.md
2. Document any progress notes
3. Commit: `git add docs/active_development/ && git commit -m "docs: update phase 1 progress"`

### For Phase Reviewers

1. Check "Current Status" section weekly
2. Verify task percentages match actual progress
3. Review "Blockers" section for issues
4. Check code coverage against targets
5. Provide feedback on implementation approach

---

## 📊 Current Phase: Testing Implementation

### Phase Overview

**Goal:** Implement comprehensive test coverage (80%+) across all layers: backend unit/integration/E2E, frontend component/API/E2E

**Deliverables:**
- Test infrastructure (fixtures, utilities, mocking)
- Backend unit tests (53+ tests)
- Backend integration tests (~70 tests)
- Backend E2E tests (~10 tests)
- Frontend component tests (~115 tests)
- Frontend API tests (~50 tests)
- Frontend E2E tests (~5 tests)

**Target Coverage:**
- Overall: 80%+
- Critical paths: 90%+
- Services: 85%+
- Components: 75%+

### Task Breakdown

**Phase 1.1: Testing Infrastructure** ✅ COMPLETE
- [x] Backend conftest.py with fixtures
- [x] Backend factories and helpers
- [x] Frontend Vitest configuration
- [x] Frontend MSW setup
- [x] Frontend test utilities

**Phase 1.2: Backend Unit Tests** ✅ COMPLETE
- [x] Auth service tests (24 tests)
- [x] Recipe service tests (29 tests)
- Coverage: 100% auth_service, 100% recipe_service

**Phase 1.3: Backend Integration Tests** ⏳ IN PROGRESS
- [ ] User API integration tests (~15 tests)
- [ ] Recipe API integration tests (~25 tests)
- [ ] Library API integration tests (~15 tests)
- [ ] Share API integration tests (~15 tests)
- Coverage target: 85%+

**Phase 1.4: Backend E2E Tests** ⏸️ PENDING
- [ ] User journey tests (~10 tests)
- Coverage target: 90%+

**Phase 1.5: Frontend Component Tests** ⏸️ PENDING
- [ ] AuthContext tests (~15 tests)
- [ ] RecipeForm tests (~25 tests)
- [ ] Page component tests (~40 tests)
- [ ] RecipeCard tests (~10 tests)
- [ ] LoginPage tests (~15 tests)
- Coverage target: 75%+

**Phase 1.6: Frontend API Tests** ⏸️ PENDING
- [ ] authApi tests (~10 tests)
- [ ] recipeApi tests (~15 tests)
- [ ] libraryApi tests (~10 tests)
- Coverage target: 85%+

**Phase 1.7: Frontend E2E Tests** ⏸️ PENDING
- [ ] User flow tests (~5 tests)
- Coverage target: 80%+

**Phase 1.8: Documentation & CI/CD** ⏸️ PENDING
- [ ] Update CI/CD workflows
- [ ] Coverage report setup
- [ ] README test documentation

### Progress Metrics

| Component | Tests | Coverage | Status |
|-----------|-------|----------|--------|
| Auth Service | 24 | 100% | ✅ Complete |
| Recipe Service | 29 | 100% | ✅ Complete |
| Backend Unit | 53 | 100% | ✅ Complete |
| User API | 0/15 | TBD | ⏳ In Progress |
| Recipe API | 0/25 | TBD | ⏸️ Pending |
| Total Backend | 53+ | 73% | 🔄 In Progress |
| Frontend | 0 | 0% | ⏸️ Pending |
| **Overall** | **53+** | **TBD** | 🔄 **In Progress** |

---

## 🚀 Getting Started with Current Phase

### Prerequisites

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
pytest                    # Verify setup

# Frontend
cd frontend
npm install --legacy-peer-deps
npm test                  # Verify setup
```

### Next Task: Backend User API Integration Tests

**File:** `backend/tests/integration/test_users_api.py`

**Tests to Implement:**
```python
# Registration tests (4)
- test_register_success
- test_register_duplicate_email
- test_register_invalid_email
- test_register_password_too_short

# Login tests (3)
- test_login_success
- test_login_wrong_password
- test_login_invalid_user

# Get current user tests (3)
- test_get_current_user_authenticated
- test_get_current_user_no_token
- test_get_current_user_invalid_token

# Update profile tests (4)
- test_update_profile_success
- test_update_email_duplicate
- test_update_password
- test_update_unauthenticated
```

**Implementation Pattern:**
```python
# Use fixtures from conftest.py
@pytest.mark.asyncio
async def test_register_success(client):
    """Test successful user registration"""
    response = await client.post(
        "/api/v1/users/register",
        json={
            "username": "newuser",
            "email": "new@example.com",
            "password": "securepass123",
            "full_name": "New User"
        }
    )

    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "newuser"
    assert data["email"] == "new@example.com"
```

---

## 📝 Implementation Notes

### Recent Decisions

1. **JWT Token Expiration Testing**
   - Simplified tests to verify timestamp existence rather than exact time
   - Avoids timezone issues with datetime comparisons

2. **Test Data Factories**
   - Using Faker for realistic data generation
   - Factories in `backend/tests/utils/factories.py`
   - Makes tests more robust and maintainable

3. **Frontend Test Architecture**
   - MSW for API mocking (more reliable than simple mocks)
   - Custom render with all providers
   - Focus on user-centric testing with RTL

### Known Blockers

None currently - all infrastructure in place

### Performance Considerations

- In-memory SQLite for tests (very fast)
- Tests can run in parallel with pytest-xdist if needed
- Frontend tests run quickly with Vitest (instant feedback)

---

## 📚 Files to Reference

### Backend Structure
- Main conftest.py: `backend/tests/conftest.py`
- Completed unit tests: `backend/tests/unit/test_auth_service.py`, `test_recipe_service.py`
- Routes to test: `backend/app/api/v1/`
- Services to call: `backend/app/services/`

### Frontend Structure
- Test setup: `frontend/src/test/setup.ts`
- MSW mocks: `frontend/src/test/mocks/handlers.ts`
- Custom render: `frontend/src/test/test-utils.tsx`
- Components to test: `frontend/src/components/`

### Documentation
- **[implementation_plan.md](./implementation_plan.md)** - Detailed breakdown with checklists
- **[../master_implementation_plan.md](../master_implementation_plan.md)** - Overall project phases
- **[../../backend/CLAUDE.md](../../backend/CLAUDE.md)** - Backend testing patterns
- **[../../frontend/CLAUDE.md](../../frontend/CLAUDE.md)** - Frontend testing patterns

---

## ✅ Phase Completion Checklist

Before considering Phase 1 complete:

- [ ] All 53+ backend tests passing
- [ ] All ~120 frontend tests passing
- [ ] Overall coverage 80%+
- [ ] Critical paths 90%+
- [ ] CI/CD workflows updated
- [ ] No broken tests in main branch
- [ ] Documentation updated
- [ ] All tasks marked complete in implementation_plan.md
- [ ] Lessons learned documented
- [ ] Ready for archival

---

## 🔗 Quick Links

### Documentation
- [Phase Implementation Plan](./implementation_plan.md)
- [Master Project Plan](../master_implementation_plan.md)
- [Documentation Guide](../CLAUDE.md)

### Code Examples
- [Backend conftest.py](../../backend/tests/conftest.py)
- [Auth service tests](../../backend/tests/unit/test_auth_service.py)
- [Recipe service tests](../../backend/tests/unit/test_recipe_service.py)
- [Frontend test setup](../../frontend/src/test/setup.ts)
- [MSW handlers](../../frontend/src/test/mocks/handlers.ts)

### Development
- [Backend CLAUDE.md](../../backend/CLAUDE.md)
- [Frontend CLAUDE.md](../../frontend/CLAUDE.md)
- [Root CLAUDE.md](../../CLAUDE.md)

---

## 💡 Tips for Success

### Maximize Productivity

1. **Batch similar tests** - Write all registration tests, then all login tests
2. **Copy templates** - Use existing tests as templates for new ones
3. **Test locally first** - Don't push until all tests pass locally
4. **Read error messages carefully** - They usually point to the exact issue
5. **Commit frequently** - Don't wait until all tests are done

### Common Testing Pitfalls

❌ **Don't:**
- Test implementation details (internal state)
- Create heavy fixtures (slow tests down)
- Skip error cases (only test happy path)
- Duplicate test setups (use fixtures instead)
- Make tests dependent on each other

✅ **Do:**
- Test behavior and outcomes
- Use lightweight, reusable fixtures
- Test happy path AND error cases
- Share fixtures through conftest.py
- Keep tests independent and isolated

### Debugging Tips

```bash
# Run single test file
pytest backend/tests/unit/test_auth_service.py -v

# Run specific test
pytest backend/tests/unit/test_auth_service.py::test_password_hash_is_different_from_plain_password -v

# Show print statements
pytest -s

# Stop at first failure
pytest -x

# Run with coverage
pytest --cov=app backend/tests/unit/

# Frontend debugging
npm test -- --reporter=verbose
npm run test:ui  # Interactive test UI
```

---

## 📞 Need Help?

1. **Question about patterns?** → See [../../backend/CLAUDE.md](../../backend/CLAUDE.md) or [../../frontend/CLAUDE.md](../../frontend/CLAUDE.md)
2. **Unsure about next task?** → Check "Current Status" in [implementation_plan.md](./implementation_plan.md)
3. **Test failing?** → Review similar passing test and compare structure
4. **Documentation unclear?** → Check related CLAUDE.md file or code examples

Remember: Tests are documentation! Well-written tests show how the code should work.
