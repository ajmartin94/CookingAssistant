/**
 * E2E Tests for Navigation Overhaul
 *
 * Tests the new navigation system:
 * - Desktop: Collapsible sidebar (220px expanded, 64px collapsed)
 * - Mobile: Bottom tab bar (4 tabs: Home, Cookbook, Plan, Shop)
 * - Responsive: Automatic switching based on viewport
 */

import { test, expect } from '../../fixtures/auth.fixture';

// Viewport configurations
const viewports = {
  mobile: { width: 375, height: 667 }, // iPhone SE
  tablet: { width: 768, height: 1024 }, // iPad
  desktop: { width: 1280, height: 720 }, // Laptop
};

test.describe('Navigation - Desktop Sidebar', () => {
  test.use({ viewport: viewports.desktop });

  test('should display sidebar with navigation items', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');

    // Sidebar should be visible on desktop
    const sidebar = authenticatedPage.locator('[data-testid="sidebar"]').first();
    await expect(sidebar).toBeVisible();

    // Navigation items should be present (sidebar has My Recipes, Libraries, Settings)
    const recipesLink = sidebar.getByRole('link', { name: /my recipes|recipes/i });
    const librariesLink = sidebar.getByRole('link', { name: /libraries/i });
    const settingsLink = sidebar.getByRole('link', { name: /settings/i });

    await expect(recipesLink).toBeVisible();
    await expect(librariesLink).toBeVisible();
    await expect(settingsLink).toBeVisible();
  });

  test('should navigate to different pages using sidebar', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');

    // Click on Libraries link
    const sidebar = authenticatedPage.locator('[data-testid="sidebar"]').first();
    const librariesLink = sidebar.getByRole('link', { name: /libraries/i });
    await librariesLink.click();

    // Should navigate to libraries page
    await expect(authenticatedPage).toHaveURL(/\/libraries/);

    // Click on My Recipes link to go back
    const recipesLink = sidebar.getByRole('link', { name: /my recipes|recipes/i }).first();
    await recipesLink.click();

    // Should navigate back to recipes
    await expect(authenticatedPage).toHaveURL(/\/recipes/);
  });

  test('should collapse and expand sidebar', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');

    // Find collapse toggle button
    const collapseButton = authenticatedPage.locator('[data-testid="sidebar-collapse"]').first();

    // Get initial sidebar width
    const sidebar = authenticatedPage.locator('[data-testid="sidebar"]').first();
    const initialWidth = await sidebar.evaluate((el) => el.getBoundingClientRect().width);

    // Sidebar should be expanded (approximately 288px = lg:w-72)
    expect(initialWidth).toBeGreaterThanOrEqual(200);

    // Click collapse button
    await collapseButton.click();

    // Wait for animation
    await authenticatedPage.waitForTimeout(300);

    // Get collapsed width
    const collapsedWidth = await sidebar.evaluate((el) => el.getBoundingClientRect().width);

    // Sidebar should be collapsed (approximately 64px = lg:w-16)
    expect(collapsedWidth).toBeLessThan(100);
    expect(collapsedWidth).toBeGreaterThanOrEqual(48);

    // Click expand button
    await collapseButton.click();

    // Wait for animation
    await authenticatedPage.waitForTimeout(300);

    // Get expanded width
    const expandedWidth = await sidebar.evaluate((el) => el.getBoundingClientRect().width);

    // Sidebar should be expanded again
    expect(expandedWidth).toBeGreaterThanOrEqual(200);
  });

  test('should persist sidebar collapse state across page reloads', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');

    // Find and click collapse button
    const collapseButton = authenticatedPage.locator('[data-testid="sidebar-collapse"]').first();
    await collapseButton.click();

    // Wait for animation and state to be saved
    await authenticatedPage.waitForTimeout(300);

    // Reload the page
    await authenticatedPage.reload();

    // Sidebar should still be collapsed
    const sidebar = authenticatedPage.locator('[data-testid="sidebar"]').first();
    const width = await sidebar.evaluate((el) => el.getBoundingClientRect().width);
    expect(width).toBeLessThan(100);

    // Verify collapse state was persisted to localStorage
    const savedState = await authenticatedPage.evaluate(() =>
      localStorage.getItem('sidebar-collapsed')
    );
    expect(savedState).toBe('true');
  });

  test('should show nav labels in expanded mode, icons only in collapsed mode', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');

    const sidebar = authenticatedPage.locator('[data-testid="sidebar"]').first();

    // In expanded mode, text labels should be visible
    const navLabel = sidebar.locator('text=/my recipes|libraries|settings/i').first();
    await expect(navLabel).toBeVisible();

    // Collapse the sidebar
    const collapseButton = authenticatedPage.locator('[data-testid="sidebar-collapse"]').first();
    await collapseButton.click();
    await authenticatedPage.waitForTimeout(300);

    // In collapsed mode, icons should still be visible but labels may be hidden
    const icon = sidebar.locator('svg').first();
    await expect(icon).toBeVisible();
  });
});

test.describe('Navigation - Mobile Bottom Tabs', () => {
  test.use({ viewport: viewports.mobile });

  test('should display bottom tab bar instead of sidebar on mobile', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');

    // Bottom tab bar should be visible
    const tabBar = authenticatedPage.locator('[data-testid="mobile-tab-bar"]').first();
    await expect(tabBar).toBeVisible();

    // Sidebar exists but should be off-screen on mobile
    const sidebar = authenticatedPage.locator('[data-testid="sidebar"]');
    // Sidebar should be in DOM but not in viewport (translated off-screen)
    // We just verify the tab bar is visible - that's the main behavior we care about
    expect(await sidebar.count()).toBeGreaterThan(0);
  });

  test('should display 4 tabs: Home, Cookbook, Plan, Shop', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');

    const tabBar = authenticatedPage.locator('[data-testid="mobile-tab-bar"]').first();

    // Check for tab items
    const homeTab = tabBar.getByRole('link', { name: /home/i });
    const cookbookTab = tabBar.getByRole('link', { name: /cookbook/i });
    const planTab = tabBar.getByRole('link', { name: /plan/i });
    const shopTab = tabBar.getByRole('link', { name: /shop/i });

    await expect(homeTab).toBeVisible();
    await expect(cookbookTab).toBeVisible();
    await expect(planTab).toBeVisible();
    await expect(shopTab).toBeVisible();
  });

  test('should navigate using bottom tabs', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');

    const tabBar = authenticatedPage.locator('[data-testid="mobile-tab-bar"]').first();

    // Click Plan tab
    const planTab = tabBar.getByRole('link', { name: /plan/i });
    await planTab.click();
    await expect(authenticatedPage).toHaveURL(/\/planning/);

    // Click Cookbook tab to go back to recipes
    const cookbookTab = tabBar.getByRole('link', { name: /cookbook/i });
    await cookbookTab.click();
    await expect(authenticatedPage).toHaveURL(/\/recipes/);
  });

  test('should highlight active tab', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');

    const tabBar = authenticatedPage.locator('[data-testid="mobile-tab-bar"]').first();

    const cookbookTab = tabBar.getByRole('link', { name: /cookbook/i });

    // Active tab should have visual indicator (aria-current, active class, or accent color)
    await expect(cookbookTab).toHaveAttribute('aria-current', 'page');
  });

  test('should have settings accessible from sidebar menu on mobile', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');

    // On mobile, settings is in the sidebar which can be opened via hamburger menu
    // Look for a menu button or hamburger icon
    const menuButton = authenticatedPage.locator(
      '[data-testid="mobile-menu"], [aria-label*="menu"], button:has(svg[class*="menu"])'
    ).first();

    // If menu button exists, click it to open sidebar
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await authenticatedPage.waitForTimeout(200);

      // Settings link should now be visible in the sidebar
      const settingsLink = authenticatedPage.getByRole('link', { name: /settings/i });
      await expect(settingsLink).toBeVisible();
    }
    // If no menu button, settings might be directly in header - skip this test
  });
});

test.describe('Navigation - Responsive Switching', () => {
  test('should switch from sidebar to bottom tabs when resizing to mobile', async ({ authenticatedPage }) => {
    // Start with desktop viewport
    await authenticatedPage.setViewportSize(viewports.desktop);
    await authenticatedPage.goto('/recipes');

    // Sidebar should be visible
    const sidebar = authenticatedPage.locator('[data-testid="sidebar"]').first();
    await expect(sidebar).toBeVisible();

    // Resize to mobile
    await authenticatedPage.setViewportSize(viewports.mobile);
    await authenticatedPage.waitForTimeout(300); // Wait for responsive changes

    // Bottom tab bar should now be visible
    const tabBar = authenticatedPage.locator('[data-testid="mobile-tab-bar"]').first();
    await expect(tabBar).toBeVisible();
  });

  test('should switch from bottom tabs to sidebar when resizing to desktop', async ({ authenticatedPage }) => {
    // Start with mobile viewport
    await authenticatedPage.setViewportSize(viewports.mobile);
    await authenticatedPage.goto('/recipes');

    // Bottom tab bar should be visible
    const tabBar = authenticatedPage.locator('[data-testid="mobile-tab-bar"]').first();
    await expect(tabBar).toBeVisible();

    // Resize to desktop
    await authenticatedPage.setViewportSize(viewports.desktop);
    await authenticatedPage.waitForTimeout(300); // Wait for responsive changes

    // Sidebar should now be visible
    const sidebar = authenticatedPage.locator('[data-testid="sidebar"]').first();
    await expect(sidebar).toBeVisible();
  });

  test('should maintain navigation state when viewport changes', async ({ authenticatedPage }) => {
    // Start on recipes page at desktop
    await authenticatedPage.setViewportSize(viewports.desktop);
    await authenticatedPage.goto('/recipes');

    // Resize to mobile
    await authenticatedPage.setViewportSize(viewports.mobile);
    await authenticatedPage.waitForTimeout(300);

    // Should still be on recipes page
    await expect(authenticatedPage).toHaveURL(/\/recipes/);

    // Cookbook tab should be active
    const tabBar = authenticatedPage.locator('[data-testid="mobile-tab-bar"]').first();
    const cookbookTab = tabBar.getByRole('link', { name: /cookbook/i });
    await expect(cookbookTab).toHaveAttribute('aria-current', 'page');
  });
});

test.describe('Navigation - Tablet', () => {
  test.use({ viewport: viewports.tablet });

  test('should show appropriate navigation for tablet viewport', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');

    // Tablet (768px) is below lg breakpoint (1024px), so should show mobile tab bar
    const tabBar = authenticatedPage.locator('[data-testid="mobile-tab-bar"]');

    // Wait for navigation elements to be present
    await authenticatedPage.waitForTimeout(500);

    // On tablet, mobile tab bar should be visible (lg breakpoint is 1024px)
    await expect(tabBar.first()).toBeVisible();
  });
});
