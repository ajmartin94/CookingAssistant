import { test, expect } from '../../fixtures/auth.fixture';
import { RecipeDetailPage } from '../../pages/recipe-detail.page';
import { APIHelper } from '../../utils/api';
import { generateRecipeData } from '../../utils/test-data';

test.describe('Recipe Detail', () => {
  let recipeDetailPage: RecipeDetailPage;

  test('should display all recipe fields', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

    // Create a recipe with all fields
    const recipeData = generateRecipeData({
      title: 'Complete Test Recipe',
      description: 'A recipe with all fields filled',
      prep_time_minutes: 15,
      cook_time_minutes: 45,
      servings: 6,
      cuisine_type: 'Italian',
      difficulty_level: 'medium',
      dietary_tags: ['vegetarian', 'gluten-free']
    });

    const recipe = await api.createRecipe(token!, recipeData);
    recipeDetailPage = new RecipeDetailPage(authenticatedPage);

    // Navigate to recipe detail page
    await recipeDetailPage.goto(recipe.id);

    // Verify basic info
    await expect(recipeDetailPage.recipeTitle).toHaveText('Complete Test Recipe');
    await expect(recipeDetailPage.recipeDescription).toContainText('A recipe with all fields filled');

    // Verify times and servings
    const prepTime = await recipeDetailPage.getPrepTime();
    expect(prepTime).toBe('15');

    const cookTime = await recipeDetailPage.getCookTime();
    expect(cookTime).toBe('45');

    const servings = await recipeDetailPage.getServings();
    expect(servings).toBe('6');

    // Verify cuisine and difficulty
    await expect(authenticatedPage.getByText('Italian')).toBeVisible();
    await expect(authenticatedPage.getByText(/medium/i)).toBeVisible();

    // Verify dietary tags
    await expect(authenticatedPage.getByText('vegetarian')).toBeVisible();
    await expect(authenticatedPage.getByText('gluten-free')).toBeVisible();
  });

  test('should display ingredients correctly', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

    const recipeData = generateRecipeData({
      ingredients: [
        { name: 'flour', amount: '2', unit: 'cups', notes: 'all-purpose' },
        { name: 'sugar', amount: '1', unit: 'cup', notes: 'white granulated' },
        { name: 'eggs', amount: '3', unit: 'whole', notes: 'large' },
      ]
    });

    const recipe = await api.createRecipe(token!, recipeData);
    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipe.id);

    // Verify all ingredients are displayed
    await expect(authenticatedPage.getByText('flour')).toBeVisible();
    await expect(authenticatedPage.getByText('2 cups')).toBeVisible();
    await expect(authenticatedPage.getByText('all-purpose')).toBeVisible();

    await expect(authenticatedPage.getByText('sugar')).toBeVisible();
    await expect(authenticatedPage.getByText('1 cup')).toBeVisible();

    await expect(authenticatedPage.getByText('eggs')).toBeVisible();
    await expect(authenticatedPage.getByText('3 whole')).toBeVisible();
  });

  test('should display instructions in order', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

    const recipeData = generateRecipeData({
      instructions: [
        { step_number: 1, instruction: 'Preheat oven to 350°F', duration_minutes: 5 },
        { step_number: 2, instruction: 'Mix dry ingredients', duration_minutes: 5 },
        { step_number: 3, instruction: 'Add wet ingredients', duration_minutes: 3 },
        { step_number: 4, instruction: 'Bake for 30 minutes', duration_minutes: 30 },
      ]
    });

    const recipe = await api.createRecipe(token!, recipeData);
    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipe.id);

    // Verify all instructions are displayed
    await expect(authenticatedPage.getByText('Preheat oven to 350°F')).toBeVisible();
    await expect(authenticatedPage.getByText('Mix dry ingredients')).toBeVisible();
    await expect(authenticatedPage.getByText('Add wet ingredients')).toBeVisible();
    await expect(authenticatedPage.getByText('Bake for 30 minutes')).toBeVisible();

    // Verify they are in order (check step numbers)
    const instructions = await recipeDetailPage.getInstructions();
    expect(instructions).toHaveLength(4);
    expect(instructions[0]).toContain('Preheat oven');
    expect(instructions[1]).toContain('Mix dry ingredients');
    expect(instructions[2]).toContain('Add wet ingredients');
    expect(instructions[3]).toContain('Bake for 30 minutes');
  });

  test('should show edit and delete buttons for recipe owner', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

    const recipeData = generateRecipeData();
    const recipe = await api.createRecipe(token!, recipeData);

    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipe.id);

    // Should see edit and delete buttons
    await expect(recipeDetailPage.editButton).toBeVisible();
    await expect(recipeDetailPage.deleteButton).toBeVisible();
  });

  test('should not show edit/delete buttons for non-owner', async ({ authenticatedPage, context, request }) => {
    // Create a recipe with the first user
    const api = new APIHelper(request);
    const token1 = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));
    const recipeData = generateRecipeData();
    const recipe = await api.createRecipe(token1!, recipeData);

    // Create a second user in a new page
    const page2 = await context.newPage();
    const registerPage = await import('../../pages/register.page');
    const RegisterPage = registerPage.RegisterPage;
    const register = new RegisterPage(page2);
    await register.goto();
    await register.register(
      `user2_${Date.now()}`,
      `user2_${Date.now()}@example.com`,
      'TestPassword123!'
    );

    // Navigate to the first user's recipe
    recipeDetailPage = new RecipeDetailPage(page2);
    await recipeDetailPage.goto(recipe.id);

    // Should NOT see edit and delete buttons
    await expect(recipeDetailPage.editButton).not.toBeVisible();
    await expect(recipeDetailPage.deleteButton).not.toBeVisible();

    await page2.close();
  });

  test('should handle non-existent recipe (404)', async ({ authenticatedPage }) => {
    recipeDetailPage = new RecipeDetailPage(authenticatedPage);

    // Navigate to a non-existent recipe ID
    await recipeDetailPage.goto('00000000-0000-0000-0000-000000000000');

    // Should show error message or redirect
    const notFoundMessage = authenticatedPage.getByText(/not found|doesn't exist/i);
    await expect(notFoundMessage).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to edit page when clicking edit button', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

    const recipeData = generateRecipeData();
    const recipe = await api.createRecipe(token!, recipeData);

    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipe.id);

    // Click edit button
    await recipeDetailPage.editButton.click();

    // Should navigate to edit page
    await expect(authenticatedPage).toHaveURL(`/recipes/${recipe.id}/edit`);
  });

  test('should calculate total time correctly', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

    const recipeData = generateRecipeData({
      prep_time_minutes: 20,
      cook_time_minutes: 40
    });

    const recipe = await api.createRecipe(token!, recipeData);
    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipe.id);

    // Should display total time (60 minutes = 1 hour)
    const totalTime = await recipeDetailPage.getTotalTime();
    expect(totalTime).toBe('60'); // Or check for "1 hour" if formatted
  });

  test('should display recipe metadata', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

    const recipeData = generateRecipeData();
    const recipe = await api.createRecipe(token!, recipeData);

    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipe.id);

    // Should show created date
    const hasCreatedDate = await recipeDetailPage.hasCreatedDate();
    expect(hasCreatedDate).toBe(true);

    // Should show author (username)
    const hasAuthor = await recipeDetailPage.hasAuthor();
    expect(hasAuthor).toBe(true);
  });
});
