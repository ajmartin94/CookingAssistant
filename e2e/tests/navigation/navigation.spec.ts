/**
 * E2E Tests for Navigation Overhaul (RED phase)
 *
 * Tests the TARGET navigation system per the plan:
 * - Desktop: Collapsible sidebar (220px expanded, ~64px collapsed)
 *   - Logo "CookingAssistant" links to /home
 *   - Nav items: Home, Cookbook, Meal Plan, Shopping (NO section groupings)
 *   - Settings at bottom
 *   - No: My Recipes, Libraries, Discover, Cook Mode
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

  test('should display sidebar with exactly 4 main nav items + Settings', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/home');

    const sidebar = authenticatedPage.locator('[data-testid="sidebar"]').first();
    await expect(sidebar).toBeVisible();

    // Should have these nav items
    await expect(sidebar.getByRole('link', { name: /^home$/i })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: /cookbook/i })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: /meal plan/i })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: /shopping/i })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: /settings/i })).toBeVisible();

    // Should NOT have old nav items
    await expect(sidebar.getByRole('link', { name: /my recipes/i })).not.toBeVisible();
    await expect(sidebar.getByRole('link', { name: /libraries/i })).not.toBeVisible();
    await expect(sidebar.getByRole('link', { name: /discover/i })).not.toBeVisible();
    await expect(sidebar.getByRole('link', { name: /cook mode/i })).not.toBeVisible();
  });

  test('should navigate to /home when clicking logo', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');

    const sidebar = authenticatedPage.locator('[data-testid="sidebar"]').first();

    // Click logo text "CookingAssistant"
    const logoLink = sidebar.getByText('CookingAssistant');
    await logoLink.click();

    await expect(authenticatedPage).toHaveURL(/\/home/);
  });

  test('should navigate to /home using Home sidebar item', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');

    const sidebar = authenticatedPage.locator('[data-testid="sidebar"]').first();
    await sidebar.getByRole('link', { name: /^home$/i }).click();

    await expect(authenticatedPage).toHaveURL(/\/home/);
  });

  test('should navigate using all sidebar items', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/home');
    const sidebar = authenticatedPage.locator('[data-testid="sidebar"]').first();

    // Cookbook -> /recipes
    await sidebar.getByRole('link', { name: /cookbook/i }).click();
    await expect(authenticatedPage).toHaveURL(/\/recipes/);

    // Meal Plan -> /planning
    await sidebar.getByRole('link', { name: /meal plan/i }).click();
    await expect(authenticatedPage).toHaveURL(/\/planning/);

    // Shopping -> /shopping
    await sidebar.getByRole('link', { name: /shopping/i }).click();
    await expect(authenticatedPage).toHaveURL(/\/shopping/);

    // Settings -> /settings
    await sidebar.getByRole('link', { name: /settings/i }).click();
    await expect(authenticatedPage).toHaveURL(/\/settings/);
  });

  test('should collapse and expand sidebar, verify state persists', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/home');

    const collapseButton = authenticatedPage.locator('[data-testid="sidebar-collapse"]').first();
    const sidebar = authenticatedPage.locator('[data-testid="sidebar"]').first();

    // Should be expanded (~220px)
    const initialWidth = await sidebar.evaluate((el) => el.getBoundingClientRect().width);
    expect(initialWidth).toBeGreaterThanOrEqual(200);
    expect(initialWidth).toBeLessThanOrEqual(240); // ~220px

    // Collapse
    await collapseButton.click();
    await authenticatedPage.waitForTimeout(300);

    const collapsedWidth = await sidebar.evaluate((el) => el.getBoundingClientRect().width);
    expect(collapsedWidth).toBeGreaterThanOrEqual(48);
    expect(collapsedWidth).toBeLessThanOrEqual(80); // ~64px

    // Expand
    await collapseButton.click();
    await authenticatedPage.waitForTimeout(300);

    const expandedWidth = await sidebar.evaluate((el) => el.getBoundingClientRect().width);
    expect(expandedWidth).toBeGreaterThanOrEqual(200);
    expect(expandedWidth).toBeLessThanOrEqual(240);

    // Collapse again and reload to verify persistence
    await collapseButton.click();
    await authenticatedPage.waitForTimeout(300);
    await authenticatedPage.reload();

    const reloadedWidth = await sidebar.evaluate((el) => el.getBoundingClientRect().width);
    expect(reloadedWidth).toBeLessThan(100);
  });
});

test.describe('Navigation - Mobile Bottom Tabs', () => {
  test.use({ viewport: viewports.mobile });

  test('should display bottom tab bar instead of sidebar on mobile', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/home');

    const tabBar = authenticatedPage.locator('[data-testid="mobile-tab-bar"]').first();
    await expect(tabBar).toBeVisible();
  });

  test('should display 4 tabs: Home, Cookbook, Plan, Shop', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/home');

    const tabBar = authenticatedPage.locator('[data-testid="mobile-tab-bar"]').first();

    await expect(tabBar.getByRole('link', { name: /home/i })).toBeVisible();
    await expect(tabBar.getByRole('link', { name: /cookbook/i })).toBeVisible();
    await expect(tabBar.getByRole('link', { name: /plan/i })).toBeVisible();
    await expect(tabBar.getByRole('link', { name: /shop/i })).toBeVisible();
  });

  test('should navigate using bottom tabs', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/home');

    const tabBar = authenticatedPage.locator('[data-testid="mobile-tab-bar"]').first();

    // Plan tab -> /planning
    await tabBar.getByRole('link', { name: /plan/i }).click();
    await expect(authenticatedPage).toHaveURL(/\/planning/);

    // Cookbook tab -> /recipes
    await tabBar.getByRole('link', { name: /cookbook/i }).click();
    await expect(authenticatedPage).toHaveURL(/\/recipes/);

    // Shop tab -> /shopping
    await tabBar.getByRole('link', { name: /shop/i }).click();
    await expect(authenticatedPage).toHaveURL(/\/shopping/);

    // Home tab -> /home
    await tabBar.getByRole('link', { name: /home/i }).click();
    await expect(authenticatedPage).toHaveURL(/\/home/);
  });

  test('should highlight active tab with aria-current', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');

    const tabBar = authenticatedPage.locator('[data-testid="mobile-tab-bar"]').first();
    const cookbookTab = tabBar.getByRole('link', { name: /cookbook/i });

    await expect(cookbookTab).toHaveAttribute('aria-current', 'page');
  });
});

test.describe('Navigation - Responsive Switching', () => {
  test('should switch from sidebar to bottom tabs when resizing to mobile', async ({ authenticatedPage }) => {
    await authenticatedPage.setViewportSize(viewports.desktop);
    await authenticatedPage.goto('/home');

    const sidebar = authenticatedPage.locator('[data-testid="sidebar"]').first();
    await expect(sidebar).toBeVisible();

    // Resize to mobile
    await authenticatedPage.setViewportSize(viewports.mobile);
    await authenticatedPage.waitForTimeout(300);

    const tabBar = authenticatedPage.locator('[data-testid="mobile-tab-bar"]').first();
    await expect(tabBar).toBeVisible();
  });

  test('should switch from bottom tabs to sidebar when resizing to desktop', async ({ authenticatedPage }) => {
    await authenticatedPage.setViewportSize(viewports.mobile);
    await authenticatedPage.goto('/home');

    const tabBar = authenticatedPage.locator('[data-testid="mobile-tab-bar"]').first();
    await expect(tabBar).toBeVisible();

    // Resize to desktop
    await authenticatedPage.setViewportSize(viewports.desktop);
    await authenticatedPage.waitForTimeout(300);

    const sidebar = authenticatedPage.locator('[data-testid="sidebar"]').first();
    await expect(sidebar).toBeVisible();
  });

  test('should maintain navigation state when viewport changes', async ({ authenticatedPage }) => {
    await authenticatedPage.setViewportSize(viewports.desktop);
    await authenticatedPage.goto('/recipes');

    // Resize to mobile
    await authenticatedPage.setViewportSize(viewports.mobile);
    await authenticatedPage.waitForTimeout(300);

    await expect(authenticatedPage).toHaveURL(/\/recipes/);

    const tabBar = authenticatedPage.locator('[data-testid="mobile-tab-bar"]').first();
    const cookbookTab = tabBar.getByRole('link', { name: /cookbook/i });
    await expect(cookbookTab).toHaveAttribute('aria-current', 'page');
  });
});

test.describe('Navigation - Tablet', () => {
  test.use({ viewport: viewports.tablet });

  test('should show mobile tab bar on tablet viewport', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/home');

    const tabBar = authenticatedPage.locator('[data-testid="mobile-tab-bar"]');
    await expect(tabBar.first()).toBeVisible();
  });
});
