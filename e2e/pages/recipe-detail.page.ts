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
    this.editButton = page.locator('[data-testid="edit-button"], button[aria-label="Edit recipe"]');
    this.deleteButton = page.locator('button[aria-label="Delete recipe"]');
    this.backButton = page.locator('a:has-text("Back"), button:has-text("Back")');
  }

  async goto(recipeId: string) {
    await super.goto(`/recipes/${recipeId}`);
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

  async getPrepTime(): Promise<string> {
    const prepTimeElement = this.page.locator('[data-testid="prep-time"]');
    const text = await prepTimeElement.textContent();
    return text?.match(/\d+/)?.[0] || '0';
  }

  async getCookTime(): Promise<string> {
    const cookTimeElement = this.page.locator('[data-testid="cook-time"]');
    const text = await cookTimeElement.textContent();
    return text?.match(/\d+/)?.[0] || '0';
  }

  async getServings(): Promise<string> {
    const servingsElement = this.page.locator('[data-testid="servings"]');
    const text = await servingsElement.textContent();
    return text?.match(/\d+/)?.[0] || '0';
  }

  async getTotalTime(): Promise<string> {
    const totalTimeElement = this.page.locator('[data-testid="total-time"]');
    const text = await totalTimeElement.textContent();
    return text?.match(/\d+/)?.[0] || '0';
  }

  async getInstructions(): Promise<string[]> {
    const instructionElements = this.page.locator('[data-testid="instruction"]');
    const count = await instructionElements.count();
    const instructions: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await instructionElements.nth(i).textContent();
      if (text) {
        instructions.push(text.trim());
      }
    }

    return instructions;
  }

  async hasCreatedDate(): Promise<boolean> {
    const dateElement = this.page.locator('[data-testid="created-date"]');
    return (await dateElement.count()) > 0;
  }

  async hasAuthor(): Promise<boolean> {
    const authorElement = this.page.locator('[data-testid="author"]');
    return (await authorElement.count()) > 0;
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

  /**
   * Hide StartCookingBar to prevent it from intercepting clicks on bottom-positioned buttons.
   * Should be called before clicking delete or other fixed-bottom buttons.
   */
  async hideStartCookingBar() {
    await this.page.evaluate(() => {
      const bar = document.querySelector('[data-testid="start-cooking-bar"]');
      if (bar) (bar as HTMLElement).style.display = 'none';
    });
  }

  /**
   * Click the delete button. Automatically hides StartCookingBar to prevent interception.
   */
  async clickDeleteButton() {
    await this.hideStartCookingBar();
    await this.deleteButton.click();
  }

  async deleteRecipe() {
    this.page.on('dialog', dialog => dialog.accept());
    await this.clickDeleteButton();
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
