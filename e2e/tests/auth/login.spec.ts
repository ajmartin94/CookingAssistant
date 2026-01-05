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
    await loginPage.login(testUser.username, testUser.password);

    // Should redirect to recipes page
    await expect(page).toHaveURL(/\/recipes/);

    // Should have auth token
    const token = await loginPage.getAuthToken();
    expect(token).toBeTruthy();
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
    await loginPage.login(testUser.username, testUser.password);
    await expect(page).toHaveURL(/\/recipes/);

    // Refresh the page
    await page.reload();

    // Should still be authenticated
    await expect(page).toHaveURL(/\/recipes/);

    const token = await loginPage.getAuthToken();
    expect(token).toBeTruthy();
  });

  test('should validate required fields', async () => {
    // Try to submit without filling any fields
    await loginPage.loginButton.click();

    // Should either show validation error or stay on login page
    await expect(loginPage.page).toHaveURL(/\/login/);
  });
});
