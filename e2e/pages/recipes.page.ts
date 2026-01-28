import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class RecipesPage extends BasePage {
  readonly createRecipeButton: Locator;
  readonly searchInput: Locator;
  readonly recipeCards: Locator;
  readonly logoutButton: Locator;
  readonly cuisineFilter: Locator;
  readonly difficultyFilter: Locator;
  readonly dietaryFilter: Locator;
  readonly clearFiltersButton: Locator;

  constructor(page: Page) {
    super(page);
    // Use first() to avoid matching both header button and empty state CTA
    this.createRecipeButton = page.locator('a[href="/recipes/create"]:not([data-testid="empty-state-cta"])').first();
    this.searchInput = page.locator('input[placeholder*="Search"]');
    this.recipeCards = page.locator('[data-testid="recipe-card"]');
    this.logoutButton = page.locator('button[aria-label="Logout"]');
    // The filters are rendered as 3 select elements in a grid
    this.cuisineFilter = page.locator('select').first();
    this.difficultyFilter = page.locator('select').nth(1);
    this.dietaryFilter = page.locator('select').nth(2);
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
    await this.dietaryFilter.selectOption(tag);
    await this.page.waitForTimeout(500); // Wait for filter to apply
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
      await this.dietaryFilter.selectOption('');
      await this.searchInput.clear();
    }
  }
}
