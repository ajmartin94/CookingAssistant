import { test, expect } from '../../fixtures/auth.fixture';
import { RecipeDetailPage } from '../../pages/recipe-detail.page';
import { CreateRecipePage } from '../../pages/create-recipe.page';
import { APIHelper } from '../../utils/api';
import { generateRecipeData } from '../../utils/test-data';

test.describe('Recipe Edit', () => {
  let recipeDetailPage: RecipeDetailPage;
  let editRecipePage: CreateRecipePage; // Edit page uses same component as create

  test('should update recipe title and description', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('token'));

    // Create a recipe
    const recipeData = generateRecipeData({
      title: 'Original Title',
      description: 'Original description'
    });
    const recipe = await api.createRecipe(token!, recipeData);

    // Navigate to edit page
    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipe.id);
    await recipeDetailPage.editButton.click();

    // Update title and description
    editRecipePage = new CreateRecipePage(authenticatedPage);
    await editRecipePage.titleInput.clear();
    await editRecipePage.titleInput.fill('Updated Title');
    await editRecipePage.descriptionInput.clear();
    await editRecipePage.descriptionInput.fill('Updated description');

    // Save changes
    await editRecipePage.submit();

    // Should redirect to detail page
    await expect(authenticatedPage).toHaveURL(`/recipes/${recipe.id}`);

    // Verify changes
    await expect(recipeDetailPage.recipeTitle).toHaveText('Updated Title');
    await expect(recipeDetailPage.recipeDescription).toContainText('Updated description');
  });

  test('should update prep time, cook time, and servings', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('token'));

    const recipeData = generateRecipeData({
      prep_time_minutes: 10,
      cook_time_minutes: 20,
      servings: 2
    });
    const recipe = await api.createRecipe(token!, recipeData);

    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipe.id);
    await recipeDetailPage.editButton.click();

    editRecipePage = new CreateRecipePage(authenticatedPage);

    // Update times and servings
    await editRecipePage.prepTimeInput.clear();
    await editRecipePage.prepTimeInput.fill('25');
    await editRecipePage.cookTimeInput.clear();
    await editRecipePage.cookTimeInput.fill('45');
    await editRecipePage.servingsInput.clear();
    await editRecipePage.servingsInput.fill('6');

    await editRecipePage.submit();

    // Verify changes
    const prepTime = await recipeDetailPage.getPrepTime();
    expect(prepTime).toBe('25');

    const cookTime = await recipeDetailPage.getCookTime();
    expect(cookTime).toBe('45');

    const servings = await recipeDetailPage.getServings();
    expect(servings).toBe('6');
  });

  test('should update cuisine and difficulty', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('token'));

    const recipeData = generateRecipeData({
      cuisine_type: 'Italian',
      difficulty_level: 'easy'
    });
    const recipe = await api.createRecipe(token!, recipeData);

    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipe.id);
    await recipeDetailPage.editButton.click();

    editRecipePage = new CreateRecipePage(authenticatedPage);

    // Update cuisine and difficulty
    await editRecipePage.cuisineSelect.selectOption('Japanese');
    await editRecipePage.difficultySelect.selectOption('hard');

    await editRecipePage.submit();

    // Verify changes
    await expect(authenticatedPage.getByText('Japanese')).toBeVisible();
    await expect(authenticatedPage.getByText(/hard/i)).toBeVisible();
  });

  test('should add new ingredients', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('token'));

    const recipeData = generateRecipeData({
      ingredients: [
        { name: 'flour', amount: '2', unit: 'cups', notes: '' }
      ]
    });
    const recipe = await api.createRecipe(token!, recipeData);

    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipe.id);
    await recipeDetailPage.editButton.click();

    editRecipePage = new CreateRecipePage(authenticatedPage);

    // Add a new ingredient
    await editRecipePage.addIngredient('sugar', '1', 'cup', 'granulated');

    await editRecipePage.submit();

    // Verify both ingredients are displayed
    await expect(authenticatedPage.getByText('flour')).toBeVisible();
    await expect(authenticatedPage.getByText('sugar')).toBeVisible();
  });

  test('should remove ingredients', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('token'));

    const recipeData = generateRecipeData({
      ingredients: [
        { name: 'flour', amount: '2', unit: 'cups', notes: '' },
        { name: 'sugar', amount: '1', unit: 'cup', notes: '' },
        { name: 'eggs', amount: '3', unit: 'whole', notes: '' }
      ]
    });
    const recipe = await api.createRecipe(token!, recipeData);

    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipe.id);
    await recipeDetailPage.editButton.click();

    editRecipePage = new CreateRecipePage(authenticatedPage);

    // Remove the second ingredient (sugar)
    await editRecipePage.removeIngredient(1);

    await editRecipePage.submit();

    // Verify sugar is removed but others remain
    await expect(authenticatedPage.getByText('flour')).toBeVisible();
    await expect(authenticatedPage.getByText('eggs')).toBeVisible();
    await expect(authenticatedPage.getByText('sugar')).not.toBeVisible();
  });

  test('should modify existing ingredients', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('token'));

    const recipeData = generateRecipeData({
      ingredients: [
        { name: 'flour', amount: '2', unit: 'cups', notes: 'all-purpose' }
      ]
    });
    const recipe = await api.createRecipe(token!, recipeData);

    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipe.id);
    await recipeDetailPage.editButton.click();

    editRecipePage = new CreateRecipePage(authenticatedPage);

    // Modify the ingredient amount
    const ingredientRow = authenticatedPage.locator('.ingredient-row, [data-testid="ingredient-row"]').first();
    const amountInput = ingredientRow.locator('input[name*="amount"]');
    await amountInput.clear();
    await amountInput.fill('3');

    await editRecipePage.submit();

    // Verify change
    await expect(authenticatedPage.getByText('3 cups')).toBeVisible();
  });

  test('should add new instructions', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('token'));

    const recipeData = generateRecipeData({
      instructions: [
        { step_number: 1, instruction: 'Mix ingredients', duration_minutes: 5 }
      ]
    });
    const recipe = await api.createRecipe(token!, recipeData);

    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipe.id);
    await recipeDetailPage.editButton.click();

    editRecipePage = new CreateRecipePage(authenticatedPage);

    // Add a new instruction
    await editRecipePage.addInstruction('Bake in oven', 30);

    await editRecipePage.submit();

    // Verify both instructions are displayed
    await expect(authenticatedPage.getByText('Mix ingredients')).toBeVisible();
    await expect(authenticatedPage.getByText('Bake in oven')).toBeVisible();
  });

  test('should remove instructions', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('token'));

    const recipeData = generateRecipeData({
      instructions: [
        { step_number: 1, instruction: 'Preheat oven', duration_minutes: 5 },
        { step_number: 2, instruction: 'Mix ingredients', duration_minutes: 5 },
        { step_number: 3, instruction: 'Bake', duration_minutes: 30 }
      ]
    });
    const recipe = await api.createRecipe(token!, recipeData);

    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipe.id);
    await recipeDetailPage.editButton.click();

    editRecipePage = new CreateRecipePage(authenticatedPage);

    // Remove the second instruction
    await editRecipePage.removeInstruction(1);

    await editRecipePage.submit();

    // Verify instruction is removed
    await expect(authenticatedPage.getByText('Preheat oven')).toBeVisible();
    await expect(authenticatedPage.getByText('Bake')).toBeVisible();
    await expect(authenticatedPage.getByText('Mix ingredients')).not.toBeVisible();
  });

  test('should persist changes after page refresh', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('token'));

    const recipeData = generateRecipeData({
      title: 'Original Title'
    });
    const recipe = await api.createRecipe(token!, recipeData);

    // Edit the recipe
    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipe.id);
    await recipeDetailPage.editButton.click();

    editRecipePage = new CreateRecipePage(authenticatedPage);
    await editRecipePage.titleInput.clear();
    await editRecipePage.titleInput.fill('Updated After Refresh');
    await editRecipePage.submit();

    // Refresh the page
    await authenticatedPage.reload();

    // Changes should persist
    await expect(recipeDetailPage.recipeTitle).toHaveText('Updated After Refresh');
  });

  test('should cancel edit without saving changes', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('token'));

    const recipeData = generateRecipeData({
      title: 'Original Title'
    });
    const recipe = await api.createRecipe(token!, recipeData);

    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipe.id);
    await recipeDetailPage.editButton.click();

    editRecipePage = new CreateRecipePage(authenticatedPage);

    // Make changes but cancel
    await editRecipePage.titleInput.clear();
    await editRecipePage.titleInput.fill('Should Not Be Saved');
    await editRecipePage.cancel();

    // Should go back to detail page
    await expect(authenticatedPage).toHaveURL(`/recipes/${recipe.id}`);

    // Original title should still be there
    await expect(recipeDetailPage.recipeTitle).toHaveText('Original Title');
  });

  test('should validate required fields on edit', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('token'));

    const recipeData = generateRecipeData();
    const recipe = await api.createRecipe(token!, recipeData);

    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipe.id);
    await recipeDetailPage.editButton.click();

    editRecipePage = new CreateRecipePage(authenticatedPage);

    // Clear required field
    await editRecipePage.titleInput.clear();
    await editRecipePage.submit();

    // Should stay on edit page with validation error
    await expect(authenticatedPage).toHaveURL(/\/edit/);

    const hasErrors = await editRecipePage.hasValidationErrors();
    expect(hasErrors).toBe(true);
  });
});
