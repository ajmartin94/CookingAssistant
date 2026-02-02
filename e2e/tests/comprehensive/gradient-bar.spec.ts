/**
 * Comprehensive Tier: Gradient Bar Gap Fix
 *
 * Verifies the season gradient bar has no visible gap between
 * the sidebar right edge and the gradient bar left edge.
 *
 * Current bug: the gradient bar sits inside a margin-left container,
 * creating a gap between sidebar and gradient bar on desktop viewports.
 * The fix should ensure the gradient bar left edge is flush with (<=)
 * the sidebar right edge with zero gap.
 */

import { test, expect } from '../../fixtures/auth.fixture';

const desktop = { width: 1280, height: 720 };

test.describe('Comprehensive: Gradient Bar Layout', () => {
  test.use({ viewport: desktop });

  test('gradient bar spans full content width with sidebar expanded', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/home');

    const sidebar = authenticatedPage.locator('[data-testid="sidebar"]').first();
    await expect(sidebar).toBeVisible();

    const gradientBar = authenticatedPage.locator('[data-testid="season-gradient-bar"]');
    await expect(gradientBar).toBeVisible();

    const sidebarBox = await sidebar.boundingBox();
    const gradientBox = await gradientBar.boundingBox();

    expect(sidebarBox).not.toBeNull();
    expect(gradientBox).not.toBeNull();

    // The gradient bar should span the full viewport width (no gap on either side).
    // It should start at x=0 and extend to the viewport right edge,
    // visually running underneath the sidebar for a seamless look.
    expect(gradientBox!.x).toBe(0);
    expect(gradientBox!.width).toBeGreaterThanOrEqual(desktop.width - 1);
  });

  test('gradient bar spans full content width with sidebar collapsed', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/home');

    const sidebar = authenticatedPage.locator('[data-testid="sidebar"]').first();
    await expect(sidebar).toBeVisible();

    // Collapse the sidebar
    await authenticatedPage.locator('[data-testid="sidebar-collapse"]').click();

    const gradientBar = authenticatedPage.locator('[data-testid="season-gradient-bar"]');
    await expect(gradientBar).toBeVisible();

    const gradientBox = await gradientBar.boundingBox();
    expect(gradientBox).not.toBeNull();

    // After collapse, gradient bar should still span full viewport width.
    expect(gradientBox!.x).toBe(0);
    expect(gradientBox!.width).toBeGreaterThanOrEqual(desktop.width - 1);
  });
});
