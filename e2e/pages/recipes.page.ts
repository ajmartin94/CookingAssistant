import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class RecipesPage extends BasePage {
  readonly createRecipeButton: Locator;
  readonly searchInput: Locator;
  readonly recipeCards: Locator;
  readonly logoutButton: Locator;
  readonly cuisineFilter: Locator;
  readonly difficultyFilter: Locator;

  constructor(page: Page) {
    super(page);
    this.createRecipeButton = page.locator('a[href="/recipes/create"]');
    this.searchInput = page.locator('input[placeholder*="Search"]');
    this.recipeCards = page.locator('[data-testid="recipe-card"]');
    this.logoutButton = page.locator('button:has-text("Logout")');
    this.cuisineFilter = page.locator('select').first();
    this.difficultyFilter = page.locator('select').nth(1);
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

  async filterByCuisine(cuisine: string) {
    await this.cuisineFilter.selectOption(cuisine);
  }

  async filterByDifficulty(difficulty: string) {
    await this.difficultyFilter.selectOption(difficulty);
  }
}
