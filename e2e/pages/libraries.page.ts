import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class LibrariesPage extends BasePage {
  readonly createLibraryButton: Locator;
  readonly libraryCards: Locator;
  readonly createModal: Locator;
  readonly libraryNameInput: Locator;
  readonly libraryDescriptionInput: Locator;
  readonly isPublicCheckbox: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    super(page);
    this.createLibraryButton = page.locator('button:has-text("New Library")');
    this.libraryCards = page.locator('[data-testid="library-card"]');
    this.createModal = page.locator('form').filter({ hasText: 'Create New Library' });
    this.libraryNameInput = page.locator('#library-name');
    this.libraryDescriptionInput = page.locator('#library-description');
    this.isPublicCheckbox = page.locator('input[type="checkbox"]');
    this.submitButton = page.locator('button[type="submit"]:has-text("Create Library")');
    this.cancelButton = page.locator('button:has-text("Cancel")');
    this.emptyState = page.locator('text=No libraries yet');
  }

  async goto() {
    await super.goto('/libraries');
  }

  async openCreateModal() {
    await this.createLibraryButton.click();
    await this.createModal.waitFor({ state: 'visible' });
  }

  async createLibrary(name: string, description?: string, isPublic: boolean = false) {
    await this.openCreateModal();
    await this.fillField(this.libraryNameInput, name);
    if (description) {
      await this.fillField(this.libraryDescriptionInput, description);
    }
    if (isPublic) {
      await this.isPublicCheckbox.check();
    }
    await this.submitButton.click();
    await this.page.waitForTimeout(500); // Wait for creation
  }

  async getLibraryCount(): Promise<number> {
    return this.libraryCards.count();
  }

  async clickLibrary(name: string) {
    await this.page.locator(`[data-testid="library-card"]:has-text("${name}")`).click();
  }

  async deleteLibrary(name: string) {
    const card = this.page.locator(`[data-testid="library-card"]:has-text("${name}")`);
    const deleteButton = card.locator('button:has-text("Delete")');
    await deleteButton.click();

    // Handle confirmation dialog if present
    const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Yes")');
    if ((await confirmButton.count()) > 0) {
      await confirmButton.click();
    }
    await this.page.waitForTimeout(500);
  }

  async cancelCreate() {
    await this.cancelButton.click();
    await this.createModal.waitFor({ state: 'hidden' });
  }

  async isEmptyStateVisible(): Promise<boolean> {
    return this.emptyState.isVisible();
  }
}
