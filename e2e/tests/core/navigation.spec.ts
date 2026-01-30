/**
 * Core Tier: Navigation
 * Consolidated from: navigation/navigation.spec.ts
 *
 * Covers: desktop sidebar visibility and navigation, mobile bottom tabs
 * visibility and navigation, logo navigation, active tab indicator
 *
 * Removed (per audit):
 * - Responsive switching tests (sidebar->tabs, tabs->sidebar) -> comprehensive tier
 * - Tablet viewport test -> comprehensive tier
 * - Sidebar collapse/expand with persistence -> comprehensive tier
 * - Maintain navigation state on viewport change -> comprehensive tier
 */

import { test, expect } from '../../fixtures/auth.fixture';

const viewports = {
  mobile: { width: 375, height: 667 },
  desktop: { width: 1280, height: 720 },
};

test.describe('Core: Desktop Navigation', () => {
  test.use({ viewport: viewports.desktop });

  test('user sees sidebar with main nav items', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/home');

    const sidebar = authenticatedPage.locator('[data-testid="sidebar"]').first();
    await expect(sidebar).toBeVisible();

    await expect(sidebar.getByRole('link', { name: /^home$/i })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: /cookbook/i })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: /meal plan/i })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: /shopping/i })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: /settings/i })).toBeVisible();
  });

  test('user navigates to all pages via sidebar', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/home');
    const sidebar = authenticatedPage.locator('[data-testid="sidebar"]').first();

    await sidebar.getByRole('link', { name: /cookbook/i }).click();
    await expect(authenticatedPage).toHaveURL(/\/recipes/);

    await sidebar.getByRole('link', { name: /meal plan/i }).click();
    await expect(authenticatedPage).toHaveURL(/\/planning/);

    await sidebar.getByRole('link', { name: /shopping/i }).click();
    await expect(authenticatedPage).toHaveURL(/\/shopping/);

    await sidebar.getByRole('link', { name: /^home$/i }).click();
    await expect(authenticatedPage).toHaveURL(/\/home/);
  });

  test('user navigates home by clicking logo', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');

    await authenticatedPage.getByText('CookingAssistant').click();

    await expect(authenticatedPage).toHaveURL(/\/home/);
  });
});

test.describe('Core: Mobile Navigation', () => {
  test.use({ viewport: viewports.mobile });

  test('user sees bottom tab bar on mobile', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/home');

    const tabBar = authenticatedPage.locator('[data-testid="mobile-tab-bar"]').first();
    await expect(tabBar).toBeVisible();

    await expect(tabBar.getByRole('link', { name: /home/i })).toBeVisible();
    await expect(tabBar.getByRole('link', { name: /cookbook/i })).toBeVisible();
    await expect(tabBar.getByRole('link', { name: /plan/i })).toBeVisible();
    await expect(tabBar.getByRole('link', { name: /shop/i })).toBeVisible();
  });

  test('user navigates via bottom tabs', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/home');

    const tabBar = authenticatedPage.locator('[data-testid="mobile-tab-bar"]').first();

    await tabBar.getByRole('link', { name: /cookbook/i }).click();
    await expect(authenticatedPage).toHaveURL(/\/recipes/);

    await tabBar.getByRole('link', { name: /plan/i }).click();
    await expect(authenticatedPage).toHaveURL(/\/planning/);

    await tabBar.getByRole('link', { name: /shop/i }).click();
    await expect(authenticatedPage).toHaveURL(/\/shopping/);

    await tabBar.getByRole('link', { name: /home/i }).click();
    await expect(authenticatedPage).toHaveURL(/\/home/);
  });

  test('active tab is highlighted with aria-current', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');

    const tabBar = authenticatedPage.locator('[data-testid="mobile-tab-bar"]').first();
    const cookbookTab = tabBar.getByRole('link', { name: /cookbook/i });

    await expect(cookbookTab).toHaveAttribute('aria-current', 'page');
  });
});
