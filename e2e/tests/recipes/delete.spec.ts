import { test, expect } from '../../fixtures/auth.fixture';
import { RecipeDetailPage } from '../../pages/recipe-detail.page';
import { RecipesPage } from '../../pages/recipes.page';
import { APIHelper } from '../../utils/api';
import { generateRecipeData } from '../../utils/test-data';

test.describe('Recipe Deletion', () => {
  let recipeDetailPage: RecipeDetailPage;
  let recipesPage: RecipesPage;

  test('should delete recipe successfully', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('token'));

    // Create a recipe
    const recipeData = generateRecipeData({ title: 'Recipe to Delete' });
    const recipe = await api.createRecipe(token!, recipeData);

    // Navigate to recipe detail page
    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipe.id);

    // Set up dialog handler to accept confirmation
    authenticatedPage.on('dialog', dialog => dialog.accept());

    // Click delete button
    await recipeDetailPage.deleteButton.click();

    // Should redirect to recipes list
    await expect(authenticatedPage).toHaveURL(/\/recipes$/, { timeout: 10000 });

    // Recipe should not be visible in the list
    recipesPage = new RecipesPage(authenticatedPage);
    await expect(authenticatedPage.getByText('Recipe to Delete')).not.toBeVisible();
  });

  test('should show confirmation dialog before deleting', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('token'));

    const recipeData = generateRecipeData();
    const recipe = await api.createRecipe(token!, recipeData);

    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipe.id);

    // Set up dialog handler to verify dialog appears
    let dialogShown = false;
    authenticatedPage.on('dialog', dialog => {
      dialogShown = true;
      dialog.dismiss(); // Dismiss instead of accept
    });

    await recipeDetailPage.deleteButton.click();

    // Wait a bit for dialog to show
    await authenticatedPage.waitForTimeout(500);

    // Verify dialog was shown
    expect(dialogShown).toBe(true);

    // Should stay on detail page (dialog was dismissed)
    await expect(authenticatedPage).toHaveURL(`/recipes/${recipe.id}`);
  });

  test('should cancel deletion when dismissing confirmation', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('token'));

    const recipeData = generateRecipeData({ title: 'Should Not Be Deleted' });
    const recipe = await api.createRecipe(token!, recipeData);

    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipe.id);

    // Dismiss the confirmation dialog
    authenticatedPage.on('dialog', dialog => dialog.dismiss());

    await recipeDetailPage.deleteButton.click();
    await authenticatedPage.waitForTimeout(500);

    // Should stay on the same page
    await expect(authenticatedPage).toHaveURL(`/recipes/${recipe.id}`);

    // Recipe should still exist
    await expect(recipeDetailPage.recipeTitle).toHaveText('Should Not Be Deleted');
  });

  test('should remove recipe from database', async ({ authenticatedPage, request, context }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('token'));

    // Create a recipe
    const recipeData = generateRecipeData();
    const recipe = await api.createRecipe(token!, recipeData);

    // Delete the recipe
    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipe.id);

    authenticatedPage.on('dialog', dialog => dialog.accept());
    await recipeDetailPage.deleteButton.click();
    await expect(authenticatedPage).toHaveURL(/\/recipes$/, { timeout: 10000 });

    // Try to access the deleted recipe directly
    await authenticatedPage.goto(`/recipes/${recipe.id}`);

    // Should show not found error or redirect
    const notFoundMessage = authenticatedPage.getByText(/not found|doesn't exist/i);
    await expect(notFoundMessage).toBeVisible({ timeout: 10000 });
  });

  test('should not show delete button for non-owner', async ({ authenticatedPage, context, request }) => {
    const api = new APIHelper(request);
    const token1 = await authenticatedPage.evaluate(() => localStorage.getItem('token'));

    // User 1 creates a recipe
    const recipeData = generateRecipeData();
    const recipe = await api.createRecipe(token1!, recipeData);

    // User 2 logs in
    const page2 = await context.newPage();
    const { RegisterPage } = await import('../../pages/register.page');
    const register = new RegisterPage(page2);
    await register.goto();
    await register.register(
      `user2_${Date.now()}`,
      `user2_${Date.now()}@example.com`,
      'TestPassword123!'
    );

    // User 2 tries to view User 1's recipe
    recipeDetailPage = new RecipeDetailPage(page2);
    await recipeDetailPage.goto(recipe.id);

    // Delete button should not be visible
    await expect(recipeDetailPage.deleteButton).not.toBeVisible();

    await page2.close();
  });

  test('should delete multiple recipes in sequence', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('token'));

    // Create multiple recipes
    const recipe1 = await api.createRecipe(token!, generateRecipeData({ title: 'Recipe 1' }));
    const recipe2 = await api.createRecipe(token!, generateRecipeData({ title: 'Recipe 2' }));
    const recipe3 = await api.createRecipe(token!, generateRecipeData({ title: 'Recipe 3' }));

    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    authenticatedPage.on('dialog', dialog => dialog.accept());

    // Delete recipe 1
    await recipeDetailPage.goto(recipe1.id);
    await recipeDetailPage.deleteButton.click();
    await expect(authenticatedPage).toHaveURL(/\/recipes$/, { timeout: 10000 });

    // Delete recipe 2
    await recipeDetailPage.goto(recipe2.id);
    await recipeDetailPage.deleteButton.click();
    await expect(authenticatedPage).toHaveURL(/\/recipes$/, { timeout: 10000 });

    // Verify only recipe 3 remains
    recipesPage = new RecipesPage(authenticatedPage);
    await recipesPage.goto();

    await expect(authenticatedPage.getByText('Recipe 1')).not.toBeVisible();
    await expect(authenticatedPage.getByText('Recipe 2')).not.toBeVisible();
    await expect(authenticatedPage.getByText('Recipe 3')).toBeVisible();
  });

  test('should handle delete with ingredients and instructions', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('token'));

    // Create a complex recipe
    const recipeData = generateRecipeData({
      title: 'Complex Recipe to Delete',
      ingredients: [
        { name: 'ingredient1', amount: '1', unit: 'cup', notes: '' },
        { name: 'ingredient2', amount: '2', unit: 'tsp', notes: '' },
        { name: 'ingredient3', amount: '3', unit: 'oz', notes: '' },
      ],
      instructions: [
        { step_number: 1, instruction: 'Step 1', duration_minutes: 5 },
        { step_number: 2, instruction: 'Step 2', duration_minutes: 10 },
        { step_number: 3, instruction: 'Step 3', duration_minutes: 15 },
      ]
    });

    const recipe = await api.createRecipe(token!, recipeData);

    // Delete the recipe
    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipe.id);

    authenticatedPage.on('dialog', dialog => dialog.accept());
    await recipeDetailPage.deleteButton.click();

    // Should successfully delete and redirect
    await expect(authenticatedPage).toHaveURL(/\/recipes$/, { timeout: 10000 });

    // Recipe should not appear in list
    await expect(authenticatedPage.getByText('Complex Recipe to Delete')).not.toBeVisible();
  });

  test('should update recipe count after deletion', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('token'));

    // Create 3 recipes
    await api.createRecipe(token!, generateRecipeData({ title: 'Recipe A' }));
    await api.createRecipe(token!, generateRecipeData({ title: 'Recipe B' }));
    const recipeC = await api.createRecipe(token!, generateRecipeData({ title: 'Recipe C' }));

    recipesPage = new RecipesPage(authenticatedPage);
    await recipesPage.goto();

    // Verify 3 recipes exist
    let recipeCards = authenticatedPage.locator('[data-testid="recipe-card"]');
    await expect(recipeCards).toHaveCount(3);

    // Delete one recipe
    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipeC.id);

    authenticatedPage.on('dialog', dialog => dialog.accept());
    await recipeDetailPage.deleteButton.click();

    await expect(authenticatedPage).toHaveURL(/\/recipes$/, { timeout: 10000 });

    // Verify only 2 recipes remain
    recipeCards = authenticatedPage.locator('[data-testid="recipe-card"]');
    await expect(recipeCards).toHaveCount(2);
  });
});
