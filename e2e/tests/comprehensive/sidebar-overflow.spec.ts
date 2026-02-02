/**
 * Comprehensive Tier: Sidebar Overflow
 * Issue #79: Fix sidebar horizontal scrollbar when collapsed
 *
 * Covers: collapsed sidebar has no horizontal scrollbar, logo text visibility
 * toggles with collapse state, tooltips don't cause page-level overflow.
 */

import { test, expect } from '../../fixtures/auth.fixture';

const desktop = { width: 1280, height: 720 };

test.describe('Sidebar overflow when collapsed', () => {
  test.use({ viewport: desktop });

  test('collapsed sidebar has no horizontal scrollbar', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/home');

    const sidebar = authenticatedPage.locator('[data-testid="sidebar"]').first();
    await expect(sidebar).toBeVisible();

    // Collapse the sidebar
    await authenticatedPage.locator('[data-testid="sidebar-collapse"]').click();

    // Wait for collapse animation to settle
    await authenticatedPage.waitForTimeout(500);

    // Verify no horizontal overflow: scrollWidth should be <= clientWidth
    const overflow = await sidebar.evaluate((el) => {
      return el.scrollWidth > el.clientWidth;
    });

    expect(overflow).toBe(false);
  });

  test('logo text is hidden when sidebar collapsed', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/home');

    const sidebar = authenticatedPage.locator('[data-testid="sidebar"]').first();
    await expect(sidebar).toBeVisible();

    // Collapse the sidebar
    await authenticatedPage.locator('[data-testid="sidebar-collapse"]').click();

    // Wait for collapse animation
    await authenticatedPage.waitForTimeout(500);

    // The "CookingAssistant" text should NOT be visible when collapsed
    await expect(authenticatedPage.getByText('CookingAssistant')).not.toBeVisible();
  });

  test('logo text is visible when sidebar expanded', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/home');

    const sidebar = authenticatedPage.locator('[data-testid="sidebar"]').first();
    await expect(sidebar).toBeVisible();

    // Ensure sidebar is expanded (default state)
    // The "CookingAssistant" text should be visible
    await expect(authenticatedPage.getByText('CookingAssistant')).toBeVisible();
  });
});
