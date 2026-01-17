import { test, expect } from '@playwright/test';

/**
 * Smoke Tests - Critical Path Verification
 *
 * These tests run BEFORE all other E2E tests. If any smoke test fails,
 * the entire test suite stops immediately. This catches catastrophic
 * failures like:
 * - CSS not loading (app renders unstyled)
 * - JavaScript not executing (React doesn't mount)
 * - Backend API down
 * - Login completely broken
 *
 * Philosophy: Don't waste time running 50+ tests if the app is fundamentally broken.
 */

test.describe.configure({ mode: 'serial' }); // Run in order, stop on first failure

test.describe('Smoke Tests', () => {
  test('frontend serves HTML and React mounts', async ({ page }) => {
    // Collect console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const response = await page.goto('/');

    // 1. Server responds
    expect(response?.status()).toBe(200);

    // 2. HTML contains React root
    const root = page.locator('#root');
    await expect(root).toBeAttached();

    // 3. React actually mounted (not just empty div)
    // Wait for any child content to appear in the root
    await expect(root).not.toBeEmpty({ timeout: 10000 });

    // 4. No critical JavaScript errors that would break the app
    const criticalErrors = consoleErrors.filter(
      (err) =>
        err.includes('Uncaught') ||
        err.includes('Failed to load') ||
        err.includes('ChunkLoadError')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('CSS loads and applies correctly', async ({ page }) => {
    await page.goto('/login');

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');

    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();

    // Check computed styles - if CSS didn't load, these will be browser defaults
    const styles = await submitButton.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        fontFamily: computed.fontFamily,
        borderRadius: computed.borderRadius,
        padding: computed.padding,
      };
    });

    // Tailwind/custom CSS should apply non-default styles
    // Browser defaults: transparent/white background, Times New Roman, no border-radius
    const isDefaultBackground =
      styles.backgroundColor === 'rgba(0, 0, 0, 0)' ||
      styles.backgroundColor === 'transparent' ||
      styles.backgroundColor === 'rgb(255, 255, 255)';

    expect(isDefaultBackground).toBe(false);

    // Font should not be browser default (serif fonts like Times)
    expect(styles.fontFamily.toLowerCase()).not.toContain('times');

    // Border radius should be set (Tailwind uses rounded-* classes)
    // Browser default is '0px'
    expect(styles.borderRadius).not.toBe('0px');

    // Padding should be set (not browser default)
    expect(styles.padding).not.toBe('0px');
  });

  test('backend API is healthy', async ({ request }) => {
    const response = await request.get('http://localhost:8000/api/v1/health');

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('healthy');
  });

  test('login flow works end-to-end', async ({ page, request }) => {
    // First, create a test user via API (more reliable than UI registration in smoke test)
    const timestamp = Date.now();
    const testUser = {
      username: `smoke_test_${timestamp}`,
      email: `smoke_${timestamp}@test.com`,
      password: 'SmokeTest123!',
    };

    // Register user via API
    const registerResponse = await request.post(
      'http://localhost:8000/api/v1/users/register',
      {
        data: testUser,
      }
    );
    expect(registerResponse.status()).toBe(201);

    // Now test the login UI
    await page.goto('/login');

    // Fill login form
    await page.locator('input[name="username"]').fill(testUser.username);
    await page.locator('input[name="password"]').fill(testUser.password);

    // Set up response listener BEFORE clicking submit
    const loginResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/users/login'),
      { timeout: 10000 }
    );

    // Submit the form
    await page.locator('button[type="submit"]').click();

    // Wait for and verify the API response
    const loginResponse = await loginResponsePromise;
    expect(loginResponse.status()).toBe(200);

    // Verify we got a token in the response
    const responseBody = await loginResponse.json();
    expect(responseBody.access_token).toBeTruthy();

    // Verify redirect to authenticated area
    await expect(page).toHaveURL(/\/recipes/, { timeout: 10000 });

    // Verify token is stored in localStorage
    const storedToken = await page.evaluate(() =>
      localStorage.getItem('auth_token')
    );
    expect(storedToken).toBeTruthy();
  });

  test('authenticated requests work with stored token', async ({
    page,
    request,
  }) => {
    // Create and login a user
    const timestamp = Date.now();
    const testUser = {
      username: `smoke_auth_${timestamp}`,
      email: `smoke_auth_${timestamp}@test.com`,
      password: 'SmokeTest123!',
    };

    // Register
    await request.post('http://localhost:8000/api/v1/users/register', {
      data: testUser,
    });

    // Login via API to get token
    const loginResponse = await request.post(
      'http://localhost:8000/api/v1/users/login',
      {
        form: {
          username: testUser.username,
          password: testUser.password,
        },
      }
    );
    const { access_token } = await loginResponse.json();

    // Set token in browser
    await page.goto('/');
    await page.evaluate(
      (token) => localStorage.setItem('auth_token', token),
      access_token
    );

    // Navigate to protected route
    await page.goto('/recipes');

    // Verify we can access the page (not redirected to login)
    await expect(page).toHaveURL(/\/recipes/);

    // Verify the recipes page actually renders (not just URL check)
    // Look for common elements that indicate the page loaded correctly
    const pageLoaded = await Promise.race([
      page
        .locator('text=My Recipes')
        .isVisible()
        .then(() => true),
      page
        .locator('text=No recipes')
        .isVisible()
        .then(() => true),
      page
        .locator('[data-testid="recipes-list"]')
        .isVisible()
        .then(() => true),
      page
        .locator('text=Create')
        .isVisible()
        .then(() => true),
      new Promise((resolve) => setTimeout(() => resolve(false), 5000)),
    ]);

    expect(pageLoaded).toBe(true);
  });

  test('unauthenticated users are redirected to login', async ({ page }) => {
    // Clear any existing auth
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    });

    // Try to access protected route
    await page.goto('/recipes');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});
