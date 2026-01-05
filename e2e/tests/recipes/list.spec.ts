import { test, expect } from '../../fixtures/auth.fixture';
import { RecipesPage } from '../../pages/recipes.page';
import { APIHelper } from '../../utils/api';
import { generateRecipeData } from '../../utils/test-data';

test.describe('Recipe List', () => {
  let recipesPage: RecipesPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    recipesPage = new RecipesPage(authenticatedPage);
    await recipesPage.goto();
  });

  test('should display user recipes', async ({ authenticatedPage, testUser, request }) => {
    const api = new APIHelper(request);

    // Create a couple of recipes via API
    const token = await recipesPage.getAuthToken();
    const recipe1 = generateRecipeData({ title: 'Test Recipe 1' });
    const recipe2 = generateRecipeData({ title: 'Test Recipe 2' });

    await api.createRecipe(token!, recipe1);
    await api.createRecipe(token!, recipe2);

    // Reload the page to see new recipes
    await recipesPage.goto();

    // Should see both recipes
    const recipeCards = recipesPage.page.locator('[data-testid="recipe-card"]');
    await expect(recipeCards).toHaveCount(2, { timeout: 10000 });

    // Verify recipe titles are displayed
    await expect(recipesPage.page.getByText('Test Recipe 1')).toBeVisible();
    await expect(recipesPage.page.getByText('Test Recipe 2')).toBeVisible();
  });

  test('should search recipes by title', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await recipesPage.getAuthToken();

    // Create recipes with different titles
    await api.createRecipe(token!, generateRecipeData({ title: 'Chocolate Cake' }));
    await api.createRecipe(token!, generateRecipeData({ title: 'Vanilla Cookies' }));
    await api.createRecipe(token!, generateRecipeData({ title: 'Chocolate Brownies' }));

    await recipesPage.goto();

    // Search for "chocolate"
    await recipesPage.search('chocolate');

    // Should only show recipes with "chocolate" in title
    const recipeCards = recipesPage.page.locator('[data-testid="recipe-card"]');
    await expect(recipeCards).toHaveCount(2, { timeout: 10000 });

    await expect(recipesPage.page.getByText('Chocolate Cake')).toBeVisible();
    await expect(recipesPage.page.getByText('Chocolate Brownies')).toBeVisible();
    await expect(recipesPage.page.getByText('Vanilla Cookies')).not.toBeVisible();
  });

  test('should filter by cuisine type', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await recipesPage.getAuthToken();

    // Create recipes with different cuisines
    await api.createRecipe(token!, generateRecipeData({
      title: 'Pasta Carbonara',
      cuisine_type: 'Italian'
    }));
    await api.createRecipe(token!, generateRecipeData({
      title: 'Sushi Roll',
      cuisine_type: 'Japanese'
    }));
    await api.createRecipe(token!, generateRecipeData({
      title: 'Pizza Margherita',
      cuisine_type: 'Italian'
    }));

    await recipesPage.goto();

    // Filter by Italian cuisine
    await recipesPage.filterByCuisine('Italian');

    // Should only show Italian recipes
    const recipeCards = recipesPage.page.locator('[data-testid="recipe-card"]');
    await expect(recipeCards).toHaveCount(2, { timeout: 10000 });

    await expect(recipesPage.page.getByText('Pasta Carbonara')).toBeVisible();
    await expect(recipesPage.page.getByText('Pizza Margherita')).toBeVisible();
    await expect(recipesPage.page.getByText('Sushi Roll')).not.toBeVisible();
  });

  test('should filter by difficulty level', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await recipesPage.getAuthToken();

    // Create recipes with different difficulty levels
    await api.createRecipe(token!, generateRecipeData({
      title: 'Simple Salad',
      difficulty_level: 'easy'
    }));
    await api.createRecipe(token!, generateRecipeData({
      title: 'Beef Wellington',
      difficulty_level: 'hard'
    }));
    await api.createRecipe(token!, generateRecipeData({
      title: 'Basic Pasta',
      difficulty_level: 'easy'
    }));

    await recipesPage.goto();

    // Filter by easy difficulty
    await recipesPage.filterByDifficulty('easy');

    // Should only show easy recipes
    const recipeCards = recipesPage.page.locator('[data-testid="recipe-card"]');
    await expect(recipeCards).toHaveCount(2, { timeout: 10000 });

    await expect(recipesPage.page.getByText('Simple Salad')).toBeVisible();
    await expect(recipesPage.page.getByText('Basic Pasta')).toBeVisible();
    await expect(recipesPage.page.getByText('Beef Wellington')).not.toBeVisible();
  });

  test('should filter by dietary tags', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await recipesPage.getAuthToken();

    // Create recipes with different dietary tags
    await api.createRecipe(token!, generateRecipeData({
      title: 'Veggie Burger',
      dietary_tags: ['vegetarian', 'vegan']
    }));
    await api.createRecipe(token!, generateRecipeData({
      title: 'Grilled Chicken',
      dietary_tags: ['gluten-free']
    }));
    await api.createRecipe(token!, generateRecipeData({
      title: 'Tofu Stir Fry',
      dietary_tags: ['vegetarian', 'vegan', 'gluten-free']
    }));

    await recipesPage.goto();

    // Filter by vegetarian tag
    await recipesPage.filterByDietaryTag('vegetarian');

    // Should only show vegetarian recipes
    const recipeCards = recipesPage.page.locator('[data-testid="recipe-card"]');
    await expect(recipeCards).toHaveCount(2, { timeout: 10000 });

    await expect(recipesPage.page.getByText('Veggie Burger')).toBeVisible();
    await expect(recipesPage.page.getByText('Tofu Stir Fry')).toBeVisible();
    await expect(recipesPage.page.getByText('Grilled Chicken')).not.toBeVisible();
  });

  test('should combine search and filters', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await recipesPage.getAuthToken();

    // Create various recipes
    await api.createRecipe(token!, generateRecipeData({
      title: 'Italian Vegetable Soup',
      cuisine_type: 'Italian',
      dietary_tags: ['vegetarian']
    }));
    await api.createRecipe(token!, generateRecipeData({
      title: 'Italian Meatballs',
      cuisine_type: 'Italian',
      dietary_tags: []
    }));
    await api.createRecipe(token!, generateRecipeData({
      title: 'Vegetable Stir Fry',
      cuisine_type: 'Chinese',
      dietary_tags: ['vegetarian']
    }));

    await recipesPage.goto();

    // Search for "vegetable" AND filter by Italian
    await recipesPage.search('vegetable');
    await recipesPage.filterByCuisine('Italian');

    // Should only show Italian vegetable recipe
    const recipeCards = recipesPage.page.locator('[data-testid="recipe-card"]');
    await expect(recipeCards).toHaveCount(1, { timeout: 10000 });

    await expect(recipesPage.page.getByText('Italian Vegetable Soup')).toBeVisible();
  });

  test('should clear filters', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await recipesPage.getAuthToken();

    // Create multiple recipes
    await api.createRecipe(token!, generateRecipeData({ title: 'Recipe 1', cuisine_type: 'Italian' }));
    await api.createRecipe(token!, generateRecipeData({ title: 'Recipe 2', cuisine_type: 'Japanese' }));

    await recipesPage.goto();

    // Apply filter
    await recipesPage.filterByCuisine('Italian');
    const filteredCards = recipesPage.page.locator('[data-testid="recipe-card"]');
    await expect(filteredCards).toHaveCount(1);

    // Clear filters
    await recipesPage.clearFilters();

    // Should show all recipes again
    const allCards = recipesPage.page.locator('[data-testid="recipe-card"]');
    await expect(allCards).toHaveCount(2, { timeout: 10000 });
  });

  test('should show empty state when no recipes', async ({ authenticatedPage }) => {
    // Navigate to recipes page (no recipes created for this user)
    await recipesPage.goto();

    // Should show empty state message
    const emptyMessage = recipesPage.page.getByText(/no recipes/i);
    await expect(emptyMessage).toBeVisible();

    // Should show create recipe button
    await expect(recipesPage.createRecipeButton).toBeVisible();
  });

  test('should show empty state when search returns no results', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await recipesPage.getAuthToken();

    // Create a recipe
    await api.createRecipe(token!, generateRecipeData({ title: 'Chocolate Cake' }));

    await recipesPage.goto();

    // Search for something that doesn't exist
    await recipesPage.search('unicorn recipe');

    // Should show no results message
    const noResultsMessage = recipesPage.page.getByText(/no recipes found/i);
    await expect(noResultsMessage).toBeVisible();
  });

  test('should navigate to recipe detail on click', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await recipesPage.getAuthToken();

    // Create a recipe
    const recipeData = generateRecipeData({ title: 'Test Navigation Recipe' });
    await api.createRecipe(token!, recipeData);

    await recipesPage.goto();

    // Click on the recipe card
    const recipeCard = recipesPage.page.locator('[data-testid="recipe-card"]').first();
    await recipeCard.click();

    // Should navigate to detail page
    await expect(authenticatedPage).toHaveURL(/\/recipes\/[^/]+/);
  });
});
