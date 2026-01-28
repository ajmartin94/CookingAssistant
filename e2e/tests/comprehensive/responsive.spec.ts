/**
 * Comprehensive Tier: Responsive Layout
 * Consolidated from: responsive/viewports.spec.ts, home-redesign.spec.ts,
 * navigation/navigation.spec.ts, cookbook-page-redesign.spec.ts, recipe-page-redesign.spec.ts
 *
 * Covers user-outcome responsive tests:
 * - Mobile: login form usable, recipes accessible, recipe detail readable
 * - Tablet: navigation works
 * - Desktop: navigation visible, login centered
 * - Responsive switching: sidebar to tabs and back
 * - Home page adapts layout
 * - Recipe detail stacks on mobile
 *
 * Removed (per audit):
 * - CSS grid column count assertions (implementation detail)
 * - Computed style checks (implementation detail)
 * - Bounding box pixel comparisons (fragile)
 * - Touch-friendly button size checks (implementation detail)
 * - Font size assertions (implementation detail)
 * - Hover state shadow/transform checks (implementation detail)
 */

import { test, expect } from '../../fixtures/auth.fixture';
import { test as publicTest, expect as publicExpect } from '@playwright/test';
import { RecipesPage } from '../../pages/recipes.page';
import { APIHelper } from '../../utils/api';
import { generateRecipeData } from '../../utils/test-data';

const viewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 720 },
};

test.describe('Comprehensive: Mobile Responsive', () => {
  test.use({ viewport: viewports.mobile });

  test('user can access login form on mobile', async ({ page }) => {
    await page.goto('/login');

    const usernameInput = page.locator('input[name="username"], input[type="text"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]');

    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('user can view recipes page without horizontal scroll on mobile', async ({ authenticatedPage }) => {
    const recipesPage = new RecipesPage(authenticatedPage);
    await recipesPage.goto();

    const body = authenticatedPage.locator('body');
    const scrollWidth = await body.evaluate((el) => el.scrollWidth);
    const clientWidth = await body.evaluate((el) => el.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test('user can read recipe detail on mobile', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

    const recipe = await api.createRecipe(token!, generateRecipeData({
      title: 'Mobile Detail Test',
      description: 'A test recipe for mobile view',
    }));

    await authenticatedPage.goto(`/recipes/${recipe.id}`);

    await expect(authenticatedPage.getByText('Mobile Detail Test')).toBeVisible();
    await expect(authenticatedPage.getByRole('heading', { name: /ingredients/i })).toBeVisible();
    await expect(authenticatedPage.getByRole('heading', { name: /instructions/i })).toBeVisible();
  });

  test('user sees bottom tab bar on mobile', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/home');

    const tabBar = authenticatedPage.locator('[data-testid="mobile-tab-bar"]').first();
    await expect(tabBar).toBeVisible();
  });
});

test.describe('Comprehensive: Tablet Responsive', () => {
  test.use({ viewport: viewports.tablet });

  test('user sees mobile tab bar on tablet', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/home');

    const tabBar = authenticatedPage.locator('[data-testid="mobile-tab-bar"]');
    await expect(tabBar.first()).toBeVisible();
  });
});

test.describe('Comprehensive: Desktop Responsive', () => {
  test.use({ viewport: viewports.desktop });

  test('user sees sidebar navigation on desktop', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/home');

    const sidebar = authenticatedPage.locator('[data-testid="sidebar"]').first();
    await expect(sidebar).toBeVisible();

    // Key nav items visible
    await expect(sidebar.getByRole('link', { name: /^home$/i })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: /cookbook/i })).toBeVisible();
  });

  test('login form is centered on desktop', async ({ page }) => {
    await page.goto('/login');

    const form = page.locator('form').first();
    const formBox = await form.evaluate((el) => el.getBoundingClientRect());

    const centerOffset = Math.abs(
      formBox.left + formBox.width / 2 - viewports.desktop.width / 2
    );
    expect(centerOffset).toBeLessThan(viewports.desktop.width * 0.2);
  });
});

test.describe('Comprehensive: Responsive Switching', () => {
  test('navigation switches from sidebar to tabs when viewport shrinks', async ({ authenticatedPage }) => {
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

  test('navigation switches from tabs to sidebar when viewport grows', async ({ authenticatedPage }) => {
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
});
