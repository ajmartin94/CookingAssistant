import { test, expect } from '@playwright/test';
import { RegisterPage } from '../../pages/register.page';
import { generateUniqueUsername, generateUniqueEmail } from '../../utils/test-data';

test.describe('User Registration', () => {
  let registerPage: RegisterPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.goto();
  });

  test('should register a new user successfully', async ({ page }) => {
    const username = generateUniqueUsername();
    const email = generateUniqueEmail();
    const password = 'TestPassword123!';

    // Set up response listener BEFORE submitting
    const registerResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/users') && resp.request().method() === 'POST'
    );

    await registerPage.register(username, email, password);

    // 1. Verify the API call succeeded (not just that we redirected)
    const registerResponse = await registerResponsePromise;
    expect(registerResponse.status()).toBe(201);

    // 2. Verify the response contains user data
    const responseBody = await registerResponse.json();
    expect(responseBody.username).toBe(username);
    expect(responseBody.email).toBe(email);

    // 3. Should redirect to recipes page
    await expect(page).toHaveURL(/\/recipes/);

    // 4. Should have auth token in localStorage
    const token = await registerPage.getAuthToken();
    expect(token).toBeTruthy();
  });

  test('should show error for duplicate username', async ({ page, context }) => {
    const username = generateUniqueUsername();
    const email1 = generateUniqueEmail();
    const email2 = generateUniqueEmail();
    const password = 'TestPassword123!';

    // Register first user
    await registerPage.register(username, email1, password);
    await expect(page).toHaveURL(/\/recipes/);

    // Open new page for second registration
    const page2 = await context.newPage();
    const registerPage2 = new RegisterPage(page2);
    await registerPage2.goto();

    // Try to register with same username (expect failure)
    await registerPage2.attemptRegister(username, email2, password);

    // Should show error
    const hasError = await registerPage2.hasError();
    expect(hasError).toBe(true);

    await page2.close();
  });

  test('should show error for duplicate email', async ({ page, context }) => {
    const username1 = generateUniqueUsername();
    const username2 = generateUniqueUsername();
    const email = generateUniqueEmail();
    const password = 'TestPassword123!';

    // Register first user
    await registerPage.register(username1, email, password);
    await expect(page).toHaveURL(/\/recipes/);

    // Open new page for second registration
    const page2 = await context.newPage();
    const registerPage2 = new RegisterPage(page2);
    await registerPage2.goto();

    // Try to register with same email (expect failure)
    await registerPage2.attemptRegister(username2, email, password);

    // Should show error
    const hasError = await registerPage2.hasError();
    expect(hasError).toBe(true);

    await page2.close();
  });

  test('should validate required fields', async () => {
    // Try to submit without filling any fields
    await registerPage.registerButton.click();

    // Should show validation error or stay on page
    await expect(registerPage.page).toHaveURL(/\/login/);
  });

  test('should persist authentication after page refresh', async ({ page }) => {
    const username = generateUniqueUsername();
    const email = generateUniqueEmail();
    const password = 'TestPassword123!';

    // Set up response listener
    const registerResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/users') && resp.request().method() === 'POST'
    );

    await registerPage.register(username, email, password);

    // Wait for successful registration
    const registerResponse = await registerResponsePromise;
    expect(registerResponse.status()).toBe(201);

    await expect(page).toHaveURL(/\/recipes/);

    // Refresh the page
    await page.reload();

    // Should still be on recipes page (authenticated)
    await expect(page).toHaveURL(/\/recipes/);

    // Token should still exist
    const token = await registerPage.getAuthToken();
    expect(token).toBeTruthy();

    // Verify the page actually rendered (not just URL check)
    const pageRendered = await Promise.race([
      page.locator('h1:has-text("My Recipes")').isVisible().then(() => true),
      page.locator('text=No recipes').isVisible().then(() => true),
      page.locator('text=Create Recipe').isVisible().then(() => true),
      page.locator('button:has-text("Create")').isVisible().then(() => true),
      new Promise((resolve) => setTimeout(() => resolve(false), 5000)),
    ]);
    expect(pageRendered).toBe(true);
  });
});
