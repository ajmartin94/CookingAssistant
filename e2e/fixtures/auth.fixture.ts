import { test as base, Page } from '@playwright/test';
import { RegisterPage } from '../pages/register.page';
import { generateUniqueUsername, generateUniqueEmail } from '../utils/test-data';

type AuthFixtures = {
  authenticatedPage: Page;
  testUser: {
    username: string;
    email: string;
    password: string;
  };
};

export const test = base.extend<AuthFixtures>({
  testUser: async ({}, use) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    await use({
      username: `testuser_${timestamp}_${random}`,
      email: `test_${timestamp}_${random}@example.com`,
      password: 'TestPassword123!',
    });
  },

  authenticatedPage: async ({ page, testUser }, use) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.register(testUser.username, testUser.email, testUser.password);

    // Wait for redirect to recipes page
    await page.waitForURL(/\/recipes/, { timeout: 10000 });

    // Verify authentication token exists
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    if (!token) {
      throw new Error('Authentication failed - no token found after registration');
    }

    await use(page);
  },
});

export { expect } from '@playwright/test';
