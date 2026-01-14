import { Page, Locator } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  async goto(path: string) {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async getTitle(): Promise<string> {
    return this.page.title();
  }

  async fillField(locator: Locator, value: string) {
    await locator.fill(value);
  }

  async getErrorMessage(): Promise<string | null> {
    const errorLocator = this.page.locator('[role="alert"]').first();
    const isVisible = await errorLocator.isVisible().catch(() => false);
    return isVisible ? errorLocator.textContent() : null;
  }

  async getAuthToken(): Promise<string | null> {
    return this.page.evaluate(() => localStorage.getItem('token'));
  }

  async setAuthToken(token: string) {
    await this.page.evaluate((t) => localStorage.setItem('token', t), token);
  }

  async clearAuth() {
    await this.page.evaluate(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    });
  }
}
