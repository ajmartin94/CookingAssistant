import { Page, Locator, expect } from '@playwright/test';
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
    this.addInstructionButton = page.locator('button:has-text("Add Step")');
    this.saveButton = page.locator('button[type="submit"]:has-text("Create"), button[type="submit"]:has-text("Update")');
    this.cancelButton = page.locator('button:has-text("Cancel")');
  }

  /**
   * Fill a controlled input reliably. With controlled components, React can
   * re-render and overwrite the input value if state hasn't settled. This method
   * retries the fill operation if the controlled component reverts the value
   * (due to a concurrent async state update overwriting the input).
   */
  async fillControlledInput(locator: Locator, value: string) {
    await locator.waitFor({ state: 'visible' });

    // Retry fill up to 3 times if controlled component reverts the value
    for (let attempt = 0; attempt < 3; attempt++) {
      await locator.click();
      await locator.fill(value);

      // Wait for React to process the state update (double rAF ensures
      // both the state update and the subsequent re-render complete)
      await this.page.evaluate(() => new Promise(resolve => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve(undefined)));
      }));

      // Check if the value stuck after React re-rendered
      try {
        await expect(locator).toHaveValue(value, { timeout: 2000 });
        return; // Value stuck, we're done
      } catch {
        // Value was reverted by controlled component, retry
      }
    }

    // Final attempt with full timeout - if this fails, the test fails
    await locator.click();
    await locator.fill(value);
    await this.page.evaluate(() => new Promise(resolve => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve(undefined)));
    }));
    await expect(locator).toHaveValue(value);
  }

  /**
   * Wait for the edit form to finish loading existing recipe data.
   * On the edit page, inputs are populated asynchronously from API data.
   * We must wait for this before interacting to avoid race conditions
   * where React re-renders overwrite user input with stale API data.
   */
  async waitForFormLoaded() {
    // Wait for title input to have a non-empty value (form loaded from API)
    await this.titleInput.waitFor({ state: 'visible' });
    await expect(this.titleInput).not.toHaveValue('', { timeout: 10000 });
    // Wait for network to be idle, ensuring all API-driven state updates
    // have completed and no more re-renders will overwrite input values
    await this.page.waitForLoadState('networkidle');
  }

  async goto() {
    await super.goto('/recipes/create');
  }

  async fillRecipeDetails(title: string, description: string) {
    await this.fillControlledInput(this.titleInput, title);
    await this.fillControlledInput(this.descriptionInput, description);
  }

  async setTimes(prepMinutes: number, cookMinutes: number) {
    await this.fillControlledInput(this.prepTimeInput, prepMinutes.toString());
    await this.fillControlledInput(this.cookTimeInput, cookMinutes.toString());
  }

  async setServings(servings: number) {
    await this.fillControlledInput(this.servingsInput, servings.toString());
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
    await this.fillControlledInput(this.titleInput, title);
    await this.fillControlledInput(this.descriptionInput, description);
    await this.fillControlledInput(this.prepTimeInput, prepMinutes.toString());
    await this.fillControlledInput(this.cookTimeInput, cookMinutes.toString());
    await this.fillControlledInput(this.servingsInput, servings.toString());
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
    // Wait for button to be visible
    await this.addIngredientButton.waitFor({ state: 'visible' });

    // Get ingredient rows
    const ingredientRows = this.page.locator('[data-testid="ingredient-row"]');
    await ingredientRows.first().waitFor({ state: 'visible' });

    // Check if the last row is empty (initial empty row)
    const lastRow = ingredientRows.last();
    const nameInput = lastRow.locator('input[name="ingredient-name"]');
    const currentName = await nameInput.inputValue();

    // If last row is not empty, add a new row
    if (currentName.trim() !== '') {
      const currentCount = await ingredientRows.count();
      await this.addIngredientButton.click();
      // Wait for the new row to appear in the DOM (row count increases)
      await expect(ingredientRows).toHaveCount(currentCount + 1);
    }

    // Get the row to fill (may be new or existing empty row)
    const targetRow = ingredientRows.last();
    const targetNameInput = targetRow.locator('input[name="ingredient-name"]');

    // Wait for the new input to be visible and attached before interacting
    await targetNameInput.waitFor({ state: 'visible' });
    await targetNameInput.waitFor({ state: 'attached' });
    await this.fillControlledInput(targetNameInput, name);

    const amountInput = targetRow.locator('input[name="ingredient-amount"]');
    await this.fillControlledInput(amountInput, amount);

    const unitInput = targetRow.locator('input[name="ingredient-unit"]');
    await this.fillControlledInput(unitInput, unit);

    if (notes) {
      const notesInput = targetRow.locator('input[placeholder*="notes"], input[name*="notes"]');
      if (await notesInput.count() > 0) {
        await this.fillControlledInput(notesInput, notes);
      }
    }
  }

  async addInstruction(text: string, durationMinutes?: number) {
    // Wait for button to be visible
    await this.addInstructionButton.waitFor({ state: 'visible' });

    // Get instruction rows
    const instructionRows = this.page.locator('[data-testid="instruction-row"]');
    await instructionRows.first().waitFor({ state: 'visible' });

    // Check if the last row is empty (initial empty row)
    const lastRow = instructionRows.last();
    const textArea = lastRow.locator('textarea[name="instruction-text"]');
    const currentText = await textArea.inputValue();

    // If last row is not empty, add a new row
    if (currentText.trim() !== '') {
      const currentCount = await instructionRows.count();
      await this.addInstructionButton.click();
      // Wait for the new row to appear in the DOM (row count increases)
      await expect(instructionRows).toHaveCount(currentCount + 1);
    }

    // Get the row to fill (may be new or existing empty row)
    const targetRow = instructionRows.last();
    const targetTextArea = targetRow.locator('textarea[name="instruction-text"]');

    // Wait for the new textarea to be visible and attached before interacting
    await targetTextArea.waitFor({ state: 'visible' });
    await targetTextArea.waitFor({ state: 'attached' });
    await this.fillControlledInput(targetTextArea, text);

    if (durationMinutes !== undefined) {
      const durationInput = targetRow.locator('input[placeholder*="duration"], input[name*="duration"]');
      if (await durationInput.count() > 0) {
        await this.fillControlledInput(durationInput, durationMinutes.toString());
      }
    }
  }

  async removeIngredient(index: number) {
    const ingredientRows = this.page.locator('[data-testid="ingredient-row"]');
    // Wait for the target row to be visible before interacting
    await ingredientRows.nth(index).waitFor({ state: 'visible' });
    // Ensure React has settled before capturing count
    await this.page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
    const currentCount = await ingredientRows.count();
    const removeButton = ingredientRows.nth(index).locator('button:has-text("Remove"), button[aria-label*="Remove"]');
    await removeButton.waitFor({ state: 'visible' });
    // Use locator-based click which auto-waits for actionability
    await removeButton.click();
    // Wait for the row to be removed from the DOM
    await expect(ingredientRows).toHaveCount(currentCount - 1, { timeout: 10000 });
  }

  async removeInstruction(index: number) {
    const instructionRows = this.page.locator('[data-testid="instruction-row"]');
    // Wait for the target row to be visible before interacting
    await instructionRows.nth(index).waitFor({ state: 'visible' });
    // Ensure React has settled before capturing count
    await this.page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
    const currentCount = await instructionRows.count();
    const removeButton = instructionRows.nth(index).locator('button:has-text("Remove"), button[aria-label*="Remove"]');
    await removeButton.waitFor({ state: 'visible' });
    // Use locator-based click which auto-waits for actionability
    await removeButton.click();
    // Wait for the row to be removed from the DOM
    await expect(instructionRows).toHaveCount(currentCount - 1, { timeout: 10000 });
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

  /**
   * Submit the form and wait for the API response. Use this instead of submit()
   * when you expect the submission to succeed (not blocked by validation).
   *
   * Includes a brief evaluation pause to ensure React has flushed all pending
   * state updates from prior fill operations before the form reads its state.
   */
  async submitAndWaitForResponse() {
    // Ensure React has flushed all batched state updates before submit reads form state.
    // React 18's automatic batching can defer state updates from input events;
    // double rAF ensures both the state update and the re-render have completed.
    await this.page.evaluate(() => new Promise(resolve => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve(undefined)));
    }));

    const responsePromise = this.page.waitForResponse(
      resp => resp.url().includes('/api/v1/recipes') &&
        (resp.request().method() === 'POST' || resp.request().method() === 'PUT' || resp.request().method() === 'PATCH') &&
        resp.status() < 400
    );
    await this.saveButton.click();
    await responsePromise;
  }

  async hasValidationErrors(): Promise<boolean> {
    const errorMessages = this.page.locator('.error, .validation-error, [role="alert"], .text-red-500, .text-error-500');
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
