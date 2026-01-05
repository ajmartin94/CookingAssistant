import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class RecipeDetailPage extends BasePage {
  readonly recipeTitle: Locator;
  readonly recipeDescription: Locator;
  readonly ingredientsList: Locator;
  readonly instructionsList: Locator;
  readonly editButton: Locator;
  readonly deleteButton: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    super(page);
    this.recipeTitle = page.locator('h1');
    this.recipeDescription = page.locator('[data-testid="recipe-description"]').or(page.locator('p').first());
    this.ingredientsList = page.locator('[data-testid="ingredients-list"]');
    this.instructionsList = page.locator('[data-testid="instructions-list"]');
    this.editButton = page.locator('a:has-text("Edit"), button:has-text("Edit")');
    this.deleteButton = page.locator('button:has-text("Delete")');
    this.backButton = page.locator('a:has-text("Back"), button:has-text("Back")');
  }

  async gotoRecipe(recipeId: string) {
    await super.goto(`/recipes/${recipeId}`);
  }

  async getRecipeTitle(): Promise<string | null> {
    return this.recipeTitle.textContent();
  }

  async getRecipeDescription(): Promise<string | null> {
    return this.recipeDescription.textContent();
  }

  async hasIngredient(name: string): Promise<boolean> {
    const content = await this.page.textContent('body');
    return content?.includes(name) || false;
  }

  async hasInstruction(text: string): Promise<boolean> {
    const content = await this.page.textContent('body');
    return content?.includes(text) || false;
  }

  async editRecipe() {
    await this.editButton.click();
    await this.page.waitForURL(/\/recipes\/[a-f0-9-]+\/edit/);
  }

  async deleteRecipe() {
    this.page.on('dialog', dialog => dialog.accept());
    await this.deleteButton.click();
    await this.page.waitForURL(/\/recipes$/);
  }

  async goBack() {
    await this.backButton.click();
  }

  async isEditButtonVisible(): Promise<boolean> {
    return this.editButton.isVisible();
  }

  async isDeleteButtonVisible(): Promise<boolean> {
    return this.deleteButton.isVisible();
  }
}
