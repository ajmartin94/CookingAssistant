import { test, expect } from '../../fixtures/auth.fixture';
import { APIHelper } from '../../utils/api';
import { SettingsPage } from '../../pages/settings.page';

test.describe('Feature: User Preferences', () => {
  test('user sets all preferences, saves, and values persist after refresh', async ({
    authenticatedPage,
    request,
  }) => {
    const api = new APIHelper(request);
    const settingsPage = new SettingsPage(authenticatedPage);
    const token = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );

    // Navigate to settings via app navigation
    await authenticatedPage.getByRole('link', { name: /settings/i }).click();
    await authenticatedPage.waitForURL('/settings');

    // Set dietary restrictions (multi-select)
    await settingsPage.selectDietaryRestrictions(['vegetarian', 'gluten-free', 'nut-free']);

    // Set skill level
    await settingsPage.setSkillLevel('intermediate');

    // Set default servings
    await settingsPage.setDefaultServings(4);

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

    // Verify outcome via API
    const preferences = await api.getUserPreferences(token!);
    expect(preferences.dietary_restrictions).toEqual(
      expect.arrayContaining(['vegetarian', 'gluten-free', 'nut-free'])
    );
    expect(preferences.dietary_restrictions).toHaveLength(3);
    expect(preferences.skill_level).toBe('intermediate');
    expect(preferences.default_servings).toBe(4);

    // Refresh the page to verify persistence
    await authenticatedPage.reload();
    await authenticatedPage.waitForURL('/settings');

    // Verify UI reflects persisted values
    await expect(settingsPage.dietaryRestrictions.vegetarian).toBeChecked();
    await expect(settingsPage.dietaryRestrictions.glutenFree).toBeChecked();
    await expect(settingsPage.dietaryRestrictions.nutFree).toBeChecked();
    await expect(settingsPage.dietaryRestrictions.vegan).not.toBeChecked();
    await expect(settingsPage.dietaryRestrictions.dairyFree).not.toBeChecked();
    await expect(settingsPage.skillLevelSelect).toHaveValue('intermediate');
    await expect(settingsPage.defaultServingsInput).toHaveValue('4');
  });

  test('user updates only skill level and other preferences remain unchanged', async ({
    authenticatedPage,
    request,
  }) => {
    const api = new APIHelper(request);
    const settingsPage = new SettingsPage(authenticatedPage);
    const token = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );

    // Navigate to settings page
    await settingsPage.goto();

    // Set initial preferences: dietary restrictions + servings
    await settingsPage.selectDietaryRestrictions(['vegan', 'soy-free']);
    await settingsPage.setSkillLevel('beginner');
    await settingsPage.setDefaultServings(2);

    // Save initial preferences
    const initialSavePromise = authenticatedPage.waitForResponse(
      (resp) =>
        resp.url().includes('/api/v1/users/me/preferences') &&
        resp.request().method() === 'PATCH' &&
        resp.status() === 200
    );
    await settingsPage.save();
    await initialSavePromise;

    // Capture BEFORE state via API
    const before = await api.getUserPreferences(token!);
    expect(before.dietary_restrictions).toEqual(
      expect.arrayContaining(['vegan', 'soy-free'])
    );
    expect(before.skill_level).toBe('beginner');
    expect(before.default_servings).toBe(2);

    // Reload the page to start fresh
    await authenticatedPage.reload();
    await authenticatedPage.waitForURL('/settings');

    // Only change skill level (leave dietary restrictions and servings alone)
    await settingsPage.setSkillLevel('advanced');

    // Save partial update
    const partialSavePromise = authenticatedPage.waitForResponse(
      (resp) =>
        resp.url().includes('/api/v1/users/me/preferences') &&
        resp.request().method() === 'PATCH' &&
        resp.status() === 200
    );
    await settingsPage.save();
    await partialSavePromise;

    // Verify AFTER state via API: only skill_level changed
    const after = await api.getUserPreferences(token!);
    expect(after.skill_level).toBe('advanced');
    expect(after.dietary_restrictions).toEqual(
      expect.arrayContaining(['vegan', 'soy-free'])
    );
    expect(after.dietary_restrictions).toHaveLength(2);
    expect(after.default_servings).toBe(2);

    // Verify UI reflects the correct state
    await expect(settingsPage.dietaryRestrictions.vegan).toBeChecked();
    await expect(settingsPage.dietaryRestrictions.soyFree).toBeChecked();
    await expect(settingsPage.skillLevelSelect).toHaveValue('advanced');
    await expect(settingsPage.defaultServingsInput).toHaveValue('2');
  });
});
