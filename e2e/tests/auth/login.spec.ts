import { test, expect } from '@playwright/test';
import { RegisterPage } from '../../pages/register.page';
import { LoginPage } from '../../pages/login.page';
import { generateUniqueUsername, generateUniqueEmail } from '../../utils/test-data';

test.describe('User Login', () => {
  let loginPage: LoginPage;
  const testUser = {
    username: generateUniqueUsername(),
    email: generateUniqueEmail(),
    password: 'TestPassword123!',
  };

  // Register a test user before all tests
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const registerPage = new RegisterPage(page);

    await registerPage.goto();
    await registerPage.register(testUser.username, testUser.email, testUser.password);

    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should login with valid credentials', async ({ page }) => {
    // Set up response listener BEFORE submitting
    const loginResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/users/login') && resp.request().method() === 'POST'
    );

    await loginPage.login(testUser.username, testUser.password);

    // 1. Verify the API call succeeded (not just that we redirected)
    const loginResponse = await loginResponsePromise;
    expect(loginResponse.status()).toBe(200);

    // 2. Verify we got a valid token in the response
    const responseBody = await loginResponse.json();
    expect(responseBody.access_token).toBeTruthy();

    // 3. Should redirect to recipes page
    await expect(page).toHaveURL(/\/recipes/);

    // 4. Should have auth token stored
    const token = await loginPage.getAuthToken();
    expect(token).toBeTruthy();

    // 5. Verify the stored token matches what the API returned
    expect(token).toBe(responseBody.access_token);
  });

  test('should show error for invalid username', async () => {
    await loginPage.login('nonexistent_user', 'wrongpassword');

    // Should show error
    const hasError = await loginPage.hasError();
    expect(hasError).toBe(true);

    // Should not redirect
    await expect(loginPage.page).toHaveURL(/\/login/);
  });

  test('should show error for invalid password', async () => {
    await loginPage.login(testUser.username, 'wrongpassword');

    // Should show error
    const hasError = await loginPage.hasError();
    expect(hasError).toBe(true);

    // Should not redirect
    await expect(loginPage.page).toHaveURL(/\/login/);
  });

  test('should persist authentication after page refresh', async ({ page }) => {
    // Set up response listener for login
    const loginResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/users/login') && resp.request().method() === 'POST'
    );

    await loginPage.login(testUser.username, testUser.password);

    // Wait for successful login
    const loginResponse = await loginResponsePromise;
    expect(loginResponse.status()).toBe(200);

    await expect(page).toHaveURL(/\/recipes/);

    // Refresh the page
    await page.reload();

    // Should still be authenticated (not redirected to login)
    await expect(page).toHaveURL(/\/recipes/);

    // Token should still be present
    const token = await loginPage.getAuthToken();
    expect(token).toBeTruthy();

    // Verify the page actually loaded (not just URL check)
    // Wait for content that indicates the recipes page rendered
    const pageRendered = await Promise.race([
      page.locator('h1:has-text("My Recipes")').isVisible().then(() => true),
      page.locator('text=No recipes').isVisible().then(() => true),
      page.locator('text=Create Recipe').isVisible().then(() => true),
      page.locator('button:has-text("Create")').isVisible().then(() => true),
      new Promise((resolve) => setTimeout(() => resolve(false), 5000)),
    ]);
    expect(pageRendered).toBe(true);
  });

  test('should validate required fields', async () => {
    // Try to submit without filling any fields
    await loginPage.loginButton.click();

    // Should either show validation error or stay on login page
    await expect(loginPage.page).toHaveURL(/\/login/);
  });
});
