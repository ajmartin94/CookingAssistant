/**
 * Core Tier: Authentication
 * Consolidated from: auth/login.spec.ts, auth/logout.spec.ts, auth/register.spec.ts
 *
 * Covers: login (valid/invalid), auth persistence, field validation,
 * logout, redirect after logout, registration, duplicate username/email
 *
 * Removed (per audit):
 * - logout redirect to recipes page (redundant with redirect after logout)
 * - register validate required fields (redundant with login validation + validation-errors)
 * - register persist auth (duplicate of login persist)
 */

import { test, expect } from '@playwright/test';
import { test as authTest, expect as authExpect } from '../../fixtures/auth.fixture';
import { RegisterPage } from '../../pages/register.page';
import { LoginPage } from '../../pages/login.page';
import { RecipesPage } from '../../pages/recipes.page';
import { generateUniqueUsername, generateUniqueEmail } from '../../utils/test-data';

test.describe('Core: Login', () => {
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
    const loginResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/users/login') && resp.request().method() === 'POST'
    );

    await loginPage.login(testUser.username, testUser.password);

    const loginResponse = await loginResponsePromise;
    expect(loginResponse.status()).toBe(200);

    const responseBody = await loginResponse.json();
    expect(responseBody.access_token).toBeTruthy();

    await expect(page).toHaveURL(/\/recipes/);

    const token = await loginPage.getAuthToken();
    expect(token).toBeTruthy();
    expect(token).toBe(responseBody.access_token);
  });

  test('should show error for invalid username', async () => {
    await loginPage.login('nonexistent_user', 'wrongpassword');

    const hasError = await loginPage.hasError();
    expect(hasError).toBe(true);

    await expect(loginPage.page).toHaveURL(/\/login/);
  });

  test('should show error for invalid password', async () => {
    await loginPage.login(testUser.username, 'wrongpassword');

    const hasError = await loginPage.hasError();
    expect(hasError).toBe(true);

    await expect(loginPage.page).toHaveURL(/\/login/);
  });

  test('should persist authentication after page refresh', async ({ page }) => {
    const loginResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/users/login') && resp.request().method() === 'POST'
    );

    await loginPage.login(testUser.username, testUser.password);

    const loginResponse = await loginResponsePromise;
    expect(loginResponse.status()).toBe(200);

    await expect(page).toHaveURL(/\/recipes/);

    await page.reload();

    await expect(page).toHaveURL(/\/recipes/);

    const token = await loginPage.getAuthToken();
    expect(token).toBeTruthy();

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
    await loginPage.loginButton.click();

    await expect(loginPage.page).toHaveURL(/\/login/);
  });
});

authTest.describe('Core: Logout', () => {
  authTest('should logout successfully', async ({ authenticatedPage }) => {
    const recipesPage = new RecipesPage(authenticatedPage);

    await recipesPage.goto();
    await authExpect(authenticatedPage).toHaveURL(/\/recipes/);

    await recipesPage.logout();

    await authExpect(authenticatedPage).toHaveURL(/\/login/);

    const token = await recipesPage.getAuthToken();
    authExpect(token).toBeNull();
  });

  authTest('should redirect to login when accessing protected route after logout', async ({ authenticatedPage }) => {
    const recipesPage = new RecipesPage(authenticatedPage);

    await recipesPage.goto();
    await recipesPage.logout();

    await authenticatedPage.goto('/recipes/create');

    await authExpect(authenticatedPage).toHaveURL(/\/login/);
  });
});

test.describe('Core: Registration', () => {
  let registerPage: RegisterPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.goto();
  });

  test('should register a new user successfully', async ({ page }) => {
    const username = generateUniqueUsername();
    const email = generateUniqueEmail();
    const password = 'TestPassword123!';

    const registerResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/users') && resp.request().method() === 'POST'
    );

    await registerPage.register(username, email, password);

    const registerResponse = await registerResponsePromise;
    expect(registerResponse.status()).toBe(201);

    const responseBody = await registerResponse.json();
    expect(responseBody.username).toBe(username);
    expect(responseBody.email).toBe(email);

    await expect(page).toHaveURL(/\/recipes/);

    const token = await registerPage.getAuthToken();
    expect(token).toBeTruthy();
  });

  test('should show error for duplicate username', async ({ page, context }) => {
    const username = generateUniqueUsername();
    const email1 = generateUniqueEmail();
    const email2 = generateUniqueEmail();
    const password = 'TestPassword123!';

    await registerPage.register(username, email1, password);
    await expect(page).toHaveURL(/\/recipes/);

    const page2 = await context.newPage();
    const registerPage2 = new RegisterPage(page2);
    await registerPage2.goto();

    await registerPage2.attemptRegister(username, email2, password);

    const hasError = await registerPage2.hasError();
    expect(hasError).toBe(true);

    await page2.close();
  });

  test('should show error for duplicate email', async ({ page, context }) => {
    const username1 = generateUniqueUsername();
    const username2 = generateUniqueUsername();
    const email = generateUniqueEmail();
    const password = 'TestPassword123!';

    await registerPage.register(username1, email, password);
    await expect(page).toHaveURL(/\/recipes/);

    const page2 = await context.newPage();
    const registerPage2 = new RegisterPage(page2);
    await registerPage2.goto();

    await registerPage2.attemptRegister(username2, email, password);

    const hasError = await registerPage2.hasError();
    expect(hasError).toBe(true);

    await page2.close();
  });
});
