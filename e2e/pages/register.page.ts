import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class RegisterPage extends BasePage {
  readonly usernameInput: Locator;
  readonly emailInput: Locator;
  readonly fullNameInput: Locator;
  readonly passwordInput: Locator;
  readonly registerButton: Locator;
  readonly loginLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.locator('input[name="username"]');
    this.emailInput = page.locator('input[name="email"]');
    this.fullNameInput = page.locator('input[name="full_name"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.registerButton = page.locator('button[type="submit"]').filter({ hasText: 'Register' });
    this.loginLink = page.locator('text=Sign in');
    this.errorMessage = page.locator('[role="alert"]');
  }

  async goto() {
    await super.goto('/login');
    // Click the register toggle if on login page (button text is "Sign up")
    const registerToggle = this.page.locator('text=Sign up');
    if (await registerToggle.isVisible()) {
      await registerToggle.click();
      // Wait for email field to appear (only visible in registration mode)
      await this.emailInput.waitFor({ state: 'visible' });
    }
  }

  async register(username: string, email: string, password: string, fullName?: string) {
    await this.fillField(this.usernameInput, username);
    await this.fillField(this.emailInput, email);
    if (fullName && await this.fullNameInput.isVisible()) {
      await this.fillField(this.fullNameInput, fullName);
    }
    await this.fillField(this.passwordInput, password);
    await this.registerButton.click();

    // Wait for navigation to recipes page (successful registration auto-logs in)
    await this.page.waitForURL(/\/recipes/, { timeout: 10000 });
  }

  async hasError(): Promise<boolean> {
    return this.errorMessage.isVisible();
  }

  async switchToLogin() {
    await this.loginLink.click();
  }
}
