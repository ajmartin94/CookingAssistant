/**
 * Core Tier: Home Page
 * Consolidated from: home/home-redesign.spec.ts
 *
 * Covers: chat input visibility and interaction, suggestion chips,
 * quick action navigation (cookbook, plan, shopping)
 *
 * Removed (per audit):
 * - Responsive layout tests (desktop 2-column grid, mobile stacked) -> comprehensive tier
 * - Implementation-detail tests (CSS grid display, data-testid containers)
 * - Time-of-day greeting (low-value, non-deterministic by time)
 * - Context cards (implementation detail)
 */

import { test, expect } from '../../fixtures/auth.fixture';

test.describe('Core: Home Page', () => {
  test('user can see chat input and type a message', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/home');

    const chatInput = authenticatedPage.getByRole('textbox', { name: /what|cook|recipe/i });
    await expect(chatInput).toBeVisible();

    await chatInput.fill('Make me a pasta recipe');
    await expect(chatInput).toHaveValue('Make me a pasta recipe');
  });

  test('user can see and click suggestion chips', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/home');

    const chips = authenticatedPage.locator('[data-testid="suggestion-chip"]');
    await expect(chips.first()).toBeVisible();
    expect(await chips.count()).toBeGreaterThanOrEqual(3);

    // Clicking a chip should provide feedback
    await chips.first().click();
    const toast = authenticatedPage.locator('[data-testid="toast"]');
    await expect(toast).toBeVisible({ timeout: 5000 });
  });

  test('user navigates to cookbook via quick action', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/home');

    const cookbookAction = authenticatedPage.locator('[data-testid="quick-actions"]').getByRole('link', { name: /cookbook/i });
    await cookbookAction.click();

    await expect(authenticatedPage).toHaveURL(/\/recipes/);
  });

  test('user navigates to meal plan and shopping via quick actions', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/home');

    const quickActions = authenticatedPage.locator('[data-testid="quick-actions"]');

    // Meal Plan -> /planning
    await quickActions.getByRole('link', { name: /meal plan/i }).click();
    await expect(authenticatedPage).toHaveURL(/\/planning/);

    // Go back and navigate to shopping
    await authenticatedPage.goto('/home');
    await quickActions.getByRole('link', { name: /shopping/i }).click();
    await expect(authenticatedPage).toHaveURL(/\/shopping/);
  });
});
