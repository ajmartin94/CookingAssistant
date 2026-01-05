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

  async fillBasicInfo(
    title: string,
    description: string,
    prepMinutes: number,
    cookMinutes: number,
    servings: number
  ) {
    await this.fillField(this.titleInput, title);
    await this.fillField(this.descriptionInput, description);
    await this.fillField(this.prepTimeInput, prepMinutes.toString());
    await this.fillField(this.cookTimeInput, cookMinutes.toString());
    await this.fillField(this.servingsInput, servings.toString());
  }

  async fillAdditionalInfo(cuisine: string, difficulty: string, dietaryTags: string[]) {
    await this.cuisineSelect.selectOption(cuisine);
    await this.difficultySelect.selectOption(difficulty);

    // Handle dietary tags (checkboxes or multi-select)
    for (const tag of dietaryTags) {
      const tagCheckbox = this.page.locator(`input[type="checkbox"][value="${tag}"]`);
      if (await tagCheckbox.count() > 0) {
        await tagCheckbox.check();
      }
    }
  }

  async addIngredient(name: string, amount: string, unit: string, notes?: string) {
    await this.addIngredientButton.click();
    const ingredientRows = this.page.locator('.ingredient-row, [data-testid="ingredient-row"]');
    const lastRow = ingredientRows.last();

    await lastRow.locator('input[placeholder*="name"], input[name*="name"]').fill(name);
    await lastRow.locator('input[placeholder*="amount"], input[name*="amount"]').fill(amount);
    await lastRow.locator('input[placeholder*="unit"], input[name*="unit"]').fill(unit);

    if (notes) {
      const notesInput = lastRow.locator('input[placeholder*="notes"], input[name*="notes"]');
      if (await notesInput.count() > 0) {
        await notesInput.fill(notes);
      }
    }
  }

  async addInstruction(text: string, durationMinutes?: number) {
    await this.addInstructionButton.click();
    const instructionRows = this.page.locator('.instruction-row, [data-testid="instruction-row"]');
    const lastRow = instructionRows.last();

    await lastRow.locator('textarea, input[type="text"]').fill(text);

    if (durationMinutes !== undefined) {
      const durationInput = lastRow.locator('input[placeholder*="duration"], input[name*="duration"]');
      if (await durationInput.count() > 0) {
        await durationInput.fill(durationMinutes.toString());
      }
    }
  }

  async removeIngredient(index: number) {
    const ingredientRows = this.page.locator('.ingredient-row, [data-testid="ingredient-row"]');
    const removeButton = ingredientRows.nth(index).locator('button:has-text("Remove"), button[aria-label*="Remove"]');
    await removeButton.click();
  }

  async removeInstruction(index: number) {
    const instructionRows = this.page.locator('.instruction-row, [data-testid="instruction-row"]');
    const removeButton = instructionRows.nth(index).locator('button:has-text("Remove"), button[aria-label*="Remove"]');
    await removeButton.click();
  }

  async getIngredientCount(): Promise<number> {
    const ingredientRows = this.page.locator('.ingredient-row, [data-testid="ingredient-row"]');
    return await ingredientRows.count();
  }

  async getInstructionCount(): Promise<number> {
    const instructionRows = this.page.locator('.instruction-row, [data-testid="instruction-row"]');
    return await instructionRows.count();
  }

  async submit() {
    await this.saveButton.click();
  }

  async hasValidationErrors(): Promise<boolean> {
    const errorMessages = this.page.locator('.error, .validation-error, [role="alert"], .text-red-500');
    return (await errorMessages.count()) > 0;
  }

  async saveRecipe() {
    await this.saveButton.click();
    await this.page.waitForURL(/\/recipes\/[a-f0-9-]+/);
  }

  async cancel() {
    await this.cancelButton.click();
  }
}
