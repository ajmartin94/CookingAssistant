import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly registerLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.locator('input[name="username"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.locator('button[type="submit"]').filter({ hasText: 'Login' });
    this.registerLink = page.locator('text=Register');
    this.errorMessage = page.locator('[role="alert"]');
  }

  async goto() {
    await super.goto('/login');
  }

  async login(username: string, password: string) {
    await this.fillField(this.usernameInput, username);
    await this.fillField(this.passwordInput, password);
    await this.loginButton.click();
  }

  async hasError(): Promise<boolean> {
    // Wait for loading to complete first
    await this.page.waitForSelector('button[type="submit"]:not(:disabled)', { timeout: 5000 }).catch(() => {});
    return this.errorMessage.isVisible();
  }

  async switchToRegister() {
    await this.registerLink.click();
  }
}
