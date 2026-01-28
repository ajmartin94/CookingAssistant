/**
 * Core Tier: Settings
 * Consolidated from: settings/user-preferences.spec.ts
 *
 * All 3 tests kept as-is (well-written per audit).
 */

import { test, expect } from '../../fixtures/auth.fixture';
import { APIHelper } from '../../utils/api';
import { SettingsPage } from '../../pages/settings.page';

test.describe('Core: User Preferences', () => {
  test('user sets dietary restrictions, saves, and preferences persist after refresh (verified via GET /users/me)', async ({
    authenticatedPage,
    request,
  }) => {
    const api = new APIHelper(request);
    const settingsPage = new SettingsPage(authenticatedPage);
    const token = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );

    await authenticatedPage.getByRole('link', { name: /settings/i }).click();
    await authenticatedPage.waitForURL('/settings');

    await settingsPage.selectDietaryRestrictions(['vegetarian', 'gluten-free']);

    const saveResponsePromise = authenticatedPage.waitForResponse(
      (resp) =>
        resp.url().includes('/api/v1/users/me/preferences') &&
        resp.request().method() === 'PATCH' &&
        resp.status() === 200
    );
    await settingsPage.save();
    await saveResponsePromise;

    await expect(authenticatedPage.getByText(/saved|success/i)).toBeVisible();

    await authenticatedPage.reload();
    await authenticatedPage.waitForURL('/settings');

    const user = await api.getCurrentUser(token!);
    expect(user.dietary_restrictions).toEqual(
      expect.arrayContaining(['vegetarian', 'gluten-free'])
    );
    expect(user.dietary_restrictions).toHaveLength(2);

    await expect(settingsPage.dietaryRestrictions.vegetarian).toBeChecked();
    await expect(settingsPage.dietaryRestrictions.glutenFree).toBeChecked();
    await expect(settingsPage.dietaryRestrictions.vegan).not.toBeChecked();
    await expect(settingsPage.dietaryRestrictions.nutFree).not.toBeChecked();
  });

  test('user sets skill level to beginner and it persists in user record (verified via API)', async ({
    authenticatedPage,
    request,
  }) => {
    const api = new APIHelper(request);
    const settingsPage = new SettingsPage(authenticatedPage);
    const token = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );

    await settingsPage.goto();

    await settingsPage.setSkillLevel('beginner');

    const saveResponsePromise = authenticatedPage.waitForResponse(
      (resp) =>
        resp.url().includes('/api/v1/users/me/preferences') &&
        resp.request().method() === 'PATCH' &&
        resp.status() === 200
    );
    await settingsPage.save();
    await saveResponsePromise;

    await expect(authenticatedPage.getByText(/saved|success/i)).toBeVisible();

    const user = await api.getCurrentUser(token!);
    expect(user.skill_level).toBe('beginner');
  });

  test('user updates only dietary restrictions and other fields remain unchanged (verified via API)', async ({
    authenticatedPage,
    request,
  }) => {
    const api = new APIHelper(request);
    const settingsPage = new SettingsPage(authenticatedPage);
    const token = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );

    await settingsPage.goto();

    await settingsPage.setSkillLevel('advanced');
    await settingsPage.setDefaultServings(6);

    const initialSavePromise = authenticatedPage.waitForResponse(
      (resp) =>
        resp.url().includes('/api/v1/users/me/preferences') &&
        resp.request().method() === 'PATCH' &&
        resp.status() === 200
    );
    await settingsPage.save();
    await initialSavePromise;

    const before = await api.getCurrentUser(token!);
    expect(before.skill_level).toBe('advanced');
    expect(before.default_servings).toBe(6);

    await authenticatedPage.reload();
    await authenticatedPage.waitForURL('/settings');

    await settingsPage.selectDietaryRestrictions(['keto', 'dairy-free']);

    const partialSavePromise = authenticatedPage.waitForResponse(
      (resp) =>
        resp.url().includes('/api/v1/users/me/preferences') &&
        resp.request().method() === 'PATCH' &&
        resp.status() === 200
    );
    await settingsPage.save();
    await partialSavePromise;

    const after = await api.getCurrentUser(token!);
    expect(after.dietary_restrictions).toEqual(
      expect.arrayContaining(['keto', 'dairy-free'])
    );
    expect(after.skill_level).toBe('advanced');
    expect(after.default_servings).toBe(6);

    await expect(settingsPage.dietaryRestrictions.keto).toBeChecked();
    await expect(settingsPage.dietaryRestrictions.dairyFree).toBeChecked();
    await expect(settingsPage.skillLevelSelect).toHaveValue('advanced');
    await expect(settingsPage.defaultServingsInput).toHaveValue('6');
  });
});
