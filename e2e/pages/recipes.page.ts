import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class RecipesPage extends BasePage {
  readonly createRecipeButton: Locator;
  readonly searchInput: Locator;
  readonly recipeCards: Locator;
  readonly logoutButton: Locator;
  readonly cuisineFilter: Locator;
  readonly difficultyFilter: Locator;
  readonly clearFiltersButton: Locator;

  constructor(page: Page) {
    super(page);
    this.createRecipeButton = page.locator('a[href="/recipes/create"]');
    this.searchInput = page.locator('input[placeholder*="Search"]');
    this.recipeCards = page.locator('[data-testid="recipe-card"]');
    this.logoutButton = page.locator('button:has-text("Logout")');
    this.cuisineFilter = page.locator('select[name="cuisine"], select').first();
    this.difficultyFilter = page.locator('select[name="difficulty"], select').nth(1);
    this.clearFiltersButton = page.locator('button:has-text("Clear"), button:has-text("Reset")');
  }

  async goto() {
    await super.goto('/recipes');
  }

  async createRecipe() {
    await this.createRecipeButton.click();
    await this.page.waitForURL(/\/recipes\/create/);
  }

  async searchRecipes(query: string) {
    await this.fillField(this.searchInput, query);
    await this.page.waitForTimeout(500); // Debounce
  }

  async getRecipeCount(): Promise<number> {
    return this.recipeCards.count();
  }

  async clickRecipe(title: string) {
    await this.page.locator(`[data-testid="recipe-card"]:has-text("${title}")`).click();
  }

  async logout() {
    await this.logoutButton.click();
    await this.page.waitForURL(/\/login/);
  }

  async search(query: string) {
    await this.fillField(this.searchInput, query);
    await this.page.waitForTimeout(500); // Debounce
  }

  async filterByCuisine(cuisine: string) {
    await this.cuisineFilter.selectOption(cuisine);
    await this.page.waitForTimeout(500); // Wait for filter to apply
  }

  async filterByDifficulty(difficulty: string) {
    await this.difficultyFilter.selectOption(difficulty);
    await this.page.waitForTimeout(500); // Wait for filter to apply
  }

  async filterByDietaryTag(tag: string) {
    // Dietary tags might be checkboxes or a multi-select
    const tagCheckbox = this.page.locator(`input[type="checkbox"][value="${tag}"]`);
    if (await tagCheckbox.count() > 0) {
      await tagCheckbox.check();
      await this.page.waitForTimeout(500); // Wait for filter to apply
    } else {
      // Might be a select with multiple option
      const tagSelect = this.page.locator('select[name="dietary_tags"]');
      if (await tagSelect.count() > 0) {
        await tagSelect.selectOption(tag);
        await this.page.waitForTimeout(500);
      }
    }
  }

  async clearFilters() {
    const clearButton = this.clearFiltersButton;
    if (await clearButton.count() > 0) {
      await clearButton.click();
      await this.page.waitForTimeout(500);
    } else {
      // Alternative: manually reset filters
      await this.cuisineFilter.selectOption('');
      await this.difficultyFilter.selectOption('');
      await this.searchInput.clear();
    }
  }
}
