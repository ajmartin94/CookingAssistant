import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class CreateRecipePage extends BasePage {
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly prepTimeInput: Locator;
  readonly cookTimeInput: Locator;
  readonly servingsInput: Locator;
  readonly cuisineSelect: Locator;
  readonly difficultySelect: Locator;
  readonly addIngredientButton: Locator;
  readonly addInstructionButton: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.titleInput = page.locator('input[name="title"]');
    this.descriptionInput = page.locator('textarea[name="description"]');
    this.prepTimeInput = page.locator('input[name="prep_time_minutes"]');
    this.cookTimeInput = page.locator('input[name="cook_time_minutes"]');
    this.servingsInput = page.locator('input[name="servings"]');
    this.cuisineSelect = page.locator('select[name="cuisine_type"]');
    this.difficultySelect = page.locator('select[name="difficulty_level"]');
    this.addIngredientButton = page.locator('button:has-text("Add Ingredient")');
    this.addInstructionButton = page.locator('button:has-text("Add Instruction")');
    this.saveButton = page.locator('button[type="submit"]:has-text("Create")');
    this.cancelButton = page.locator('button:has-text("Cancel")');
  }

  async goto() {
    await super.goto('/recipes/create');
  }

  async fillRecipeDetails(title: string, description: string) {
    await this.fillField(this.titleInput, title);
    await this.fillField(this.descriptionInput, description);
  }

  async setTimes(prepMinutes: number, cookMinutes: number) {
    await this.fillField(this.prepTimeInput, prepMinutes.toString());
    await this.fillField(this.cookTimeInput, cookMinutes.toString());
  }

  async setServings(servings: number) {
    await this.fillField(this.servingsInput, servings.toString());
  }

  async setCuisine(cuisine: string) {
    await this.cuisineSelect.selectOption(cuisine);
  }

  async setDifficulty(difficulty: string) {
    await this.difficultySelect.selectOption(difficulty);
  }

  async addIngredient(name: string, amount: string, unit: string) {
    await this.addIngredientButton.click();
    const ingredientRows = this.page.locator('.ingredient-row, [data-testid="ingredient-row"]');
    const lastRow = ingredientRows.last();

    await lastRow.locator('input[placeholder*="name"], input[name*="name"]').fill(name);
    await lastRow.locator('input[placeholder*="amount"], input[name*="amount"]').fill(amount);
    await lastRow.locator('input[placeholder*="unit"], input[name*="unit"]').fill(unit);
  }

  async addInstruction(text: string) {
    await this.addInstructionButton.click();
    const instructionRows = this.page.locator('.instruction-row, [data-testid="instruction-row"]');
    const lastRow = instructionRows.last();

    await lastRow.locator('textarea, input[type="text"]').fill(text);
  }

  async saveRecipe() {
    await this.saveButton.click();
    await this.page.waitForURL(/\/recipes\/[a-f0-9-]+/);
  }

  async cancel() {
    await this.cancelButton.click();
  }
}
