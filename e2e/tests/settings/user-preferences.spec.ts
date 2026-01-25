/**
 * Feature: User configures cooking preferences
 *
 * User Story: As a cook, I need to set my dietary restrictions and skill level,
 * so that the AI gives me relevant suggestions.
 */

import { test, expect } from '../../fixtures/auth.fixture';
import { APIHelper } from '../../utils/api';
import { SettingsPage } from '../../pages/settings.page';

test.describe('Feature: User configures cooking preferences', () => {
  test('user sets dietary restrictions, saves, and preferences persist after refresh (verified via GET /users/me)', async ({
    authenticatedPage,
    request,
  }) => {
    /**
     * Acceptance Criteria #1:
     * User navigates to settings page → sets dietary restrictions (vegetarian, gluten-free)
     * → saves → refreshes page → preferences are still selected (verified via API GET /users/me)
     */
    const api = new APIHelper(request);
    const settingsPage = new SettingsPage(authenticatedPage);
    const token = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );

    // Navigate to settings page via app navigation
    await authenticatedPage.getByRole('link', { name: /settings/i }).click();
    await authenticatedPage.waitForURL('/settings');

    // Set dietary restrictions: vegetarian and gluten-free (exactly as specified)
    await settingsPage.selectDietaryRestrictions(['vegetarian', 'gluten-free']);

    // Save and wait for API response
    const saveResponsePromise = authenticatedPage.waitForResponse(
      (resp) =>
        resp.url().includes('/api/v1/users/me/preferences') &&
        resp.request().method() === 'PATCH' &&
        resp.status() === 200
    );
    await settingsPage.save();
    await saveResponsePromise;

    // Verify success feedback in UI
    await expect(authenticatedPage.getByText(/saved|success/i)).toBeVisible();

    // Refresh the page to test persistence
    await authenticatedPage.reload();
    await authenticatedPage.waitForURL('/settings');

    // Verify preferences persist via API GET /users/me (as specified in acceptance criteria)
    const user = await api.getCurrentUser(token!);
    expect(user.dietary_restrictions).toEqual(
      expect.arrayContaining(['vegetarian', 'gluten-free'])
    );
    expect(user.dietary_restrictions).toHaveLength(2);

    // Verify UI reflects persisted values
    await expect(settingsPage.dietaryRestrictions.vegetarian).toBeChecked();
    await expect(settingsPage.dietaryRestrictions.glutenFree).toBeChecked();
    await expect(settingsPage.dietaryRestrictions.vegan).not.toBeChecked();
    await expect(settingsPage.dietaryRestrictions.nutFree).not.toBeChecked();
  });

  test('user sets skill level to beginner and it persists in user record (verified via API)', async ({
    authenticatedPage,
    request,
  }) => {
    /**
     * Acceptance Criteria #2:
     * User sets skill level to "beginner" → saves → user record in DB has skill_level="beginner"
     * (verified via API)
     */
    const api = new APIHelper(request);
    const settingsPage = new SettingsPage(authenticatedPage);
    const token = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );

    // Navigate to settings page
    await settingsPage.goto();

    // Set skill level to beginner (exactly as specified in acceptance criteria)
    await settingsPage.setSkillLevel('beginner');

    // Save and wait for API response
    const saveResponsePromise = authenticatedPage.waitForResponse(
      (resp) =>
        resp.url().includes('/api/v1/users/me/preferences') &&
        resp.request().method() === 'PATCH' &&
        resp.status() === 200
    );
    await settingsPage.save();
    await saveResponsePromise;

    // Verify success feedback in UI
    await expect(authenticatedPage.getByText(/saved|success/i)).toBeVisible();

    // Verify outcome via API: user record has skill_level="beginner"
    const user = await api.getCurrentUser(token!);
    expect(user.skill_level).toBe('beginner');
  });

  test('user updates only dietary restrictions and other fields remain unchanged (verified via API)', async ({
    authenticatedPage,
    request,
  }) => {
    /**
     * Acceptance Criteria #3:
     * User updates only dietary restrictions → other fields (skill_level, default_servings)
     * remain unchanged (verified via API)
     */
    const api = new APIHelper(request);
    const settingsPage = new SettingsPage(authenticatedPage);
    const token = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );

    // Navigate to settings page
    await settingsPage.goto();

    // First, set initial state: skill_level=advanced, default_servings=6, dietary=[]
    await settingsPage.setSkillLevel('advanced');
    await settingsPage.setDefaultServings(6);
    // Clear any existing dietary restrictions by unchecking all
    // (page loads with defaults, so we set known state first)

    // Save initial state
    const initialSavePromise = authenticatedPage.waitForResponse(
      (resp) =>
        resp.url().includes('/api/v1/users/me/preferences') &&
        resp.request().method() === 'PATCH' &&
        resp.status() === 200
    );
    await settingsPage.save();
    await initialSavePromise;

    // Capture BEFORE state via API
    const before = await api.getCurrentUser(token!);
    expect(before.skill_level).toBe('advanced');
    expect(before.default_servings).toBe(6);

    // Reload the page to start fresh
    await authenticatedPage.reload();
    await authenticatedPage.waitForURL('/settings');

    // Now update ONLY dietary restrictions (add keto and dairy-free)
    await settingsPage.selectDietaryRestrictions(['keto', 'dairy-free']);

    // Save partial update
    const partialSavePromise = authenticatedPage.waitForResponse(
      (resp) =>
        resp.url().includes('/api/v1/users/me/preferences') &&
        resp.request().method() === 'PATCH' &&
        resp.status() === 200
    );
    await settingsPage.save();
    await partialSavePromise;

    // Verify AFTER state via API: dietary_restrictions updated, other fields unchanged
    const after = await api.getCurrentUser(token!);
    expect(after.dietary_restrictions).toEqual(
      expect.arrayContaining(['keto', 'dairy-free'])
    );
    expect(after.skill_level).toBe('advanced'); // unchanged
    expect(after.default_servings).toBe(6); // unchanged

    // Verify UI reflects correct state
    await expect(settingsPage.dietaryRestrictions.keto).toBeChecked();
    await expect(settingsPage.dietaryRestrictions.dairyFree).toBeChecked();
    await expect(settingsPage.skillLevelSelect).toHaveValue('advanced');
    await expect(settingsPage.defaultServingsInput).toHaveValue('6');
  });
});
