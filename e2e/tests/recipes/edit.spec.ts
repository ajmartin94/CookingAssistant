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
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

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

    // Wait for edit form to load existing data before interacting
    editRecipePage = new CreateRecipePage(authenticatedPage);
    await editRecipePage.waitForFormLoaded();

    // Update title and description using controlled input fill with retry
    await editRecipePage.fillControlledInput(editRecipePage.titleInput, 'Updated Title');
    await editRecipePage.fillControlledInput(editRecipePage.descriptionInput, 'Updated description');

    // Save changes and wait for API response
    await editRecipePage.submitAndWaitForResponse();

    // Should redirect to detail page
    await expect(authenticatedPage).toHaveURL(`/recipes/${recipe.id}`);

    // Verify changes
    await expect(recipeDetailPage.recipeTitle).toHaveText('Updated Title');
    await expect(recipeDetailPage.recipeDescription).toContainText('Updated description');
  });

  test('should update prep time, cook time, and servings', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

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
    await editRecipePage.waitForFormLoaded();

    // Update times and servings using controlled input fill with retry
    await editRecipePage.fillControlledInput(editRecipePage.prepTimeInput, '25');
    await editRecipePage.fillControlledInput(editRecipePage.cookTimeInput, '45');
    await editRecipePage.fillControlledInput(editRecipePage.servingsInput, '6');

    await editRecipePage.submitAndWaitForResponse();

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
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

    const recipeData = generateRecipeData({
      cuisine_type: 'Italian',
      difficulty_level: 'easy'
    });
    const recipe = await api.createRecipe(token!, recipeData);

    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipe.id);
    await recipeDetailPage.editButton.click();

    editRecipePage = new CreateRecipePage(authenticatedPage);
    await editRecipePage.waitForFormLoaded();

    // Update cuisine and difficulty
    await editRecipePage.cuisineSelect.selectOption('Japanese');
    await editRecipePage.difficultySelect.selectOption('hard');

    await editRecipePage.submitAndWaitForResponse();

    // Verify changes
    await expect(authenticatedPage.getByText('Japanese')).toBeVisible();
    await expect(authenticatedPage.getByText(/hard/i)).toBeVisible();
  });

  test('should add new ingredients', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

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
    await editRecipePage.waitForFormLoaded();

    // Add a new ingredient
    await editRecipePage.addIngredient('sugar', '1', 'cup', 'granulated');

    await editRecipePage.submitAndWaitForResponse();

    // Verify both ingredients are displayed
    await expect(authenticatedPage.getByText('flour')).toBeVisible();
    await expect(authenticatedPage.getByText('sugar')).toBeVisible();
  });

  test('should remove ingredients', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

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
    await editRecipePage.waitForFormLoaded();

    // Remove the second ingredient (sugar)
    await editRecipePage.removeIngredient(1);

    await editRecipePage.submitAndWaitForResponse();

    // Verify sugar is removed but others remain
    await expect(authenticatedPage.getByText('flour')).toBeVisible();
    await expect(authenticatedPage.getByText('whole eggs')).toBeVisible();
    await expect(authenticatedPage.getByText('sugar')).not.toBeVisible();
  });

  test('should modify existing ingredients', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

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
    await editRecipePage.waitForFormLoaded();

    // Modify the ingredient amount using controlled input fill with retry
    const ingredientRow = authenticatedPage.locator('.ingredient-row, [data-testid="ingredient-row"]').first();
    const amountInput = ingredientRow.locator('input[name*="amount"]');
    await editRecipePage.fillControlledInput(amountInput, '3');

    await editRecipePage.submitAndWaitForResponse();

    // Verify change
    await expect(authenticatedPage.getByText('3 cups')).toBeVisible();
  });

  test('should add new instructions', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

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
    await editRecipePage.waitForFormLoaded();

    // Add a new instruction
    await editRecipePage.addInstruction('Bake in oven', 30);

    await editRecipePage.submitAndWaitForResponse();

    // Verify both instructions are displayed
    await expect(authenticatedPage.getByText('Mix ingredients')).toBeVisible();
    await expect(authenticatedPage.getByText('Bake in oven')).toBeVisible();
  });

  test('should remove instructions', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

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
    await editRecipePage.waitForFormLoaded();

    // Remove the second instruction
    await editRecipePage.removeInstruction(1);

    await editRecipePage.submitAndWaitForResponse();

    // Verify instruction is removed
    await expect(authenticatedPage.getByText('Preheat oven')).toBeVisible();
    await expect(authenticatedPage.getByText('Bake')).toBeVisible();
    await expect(authenticatedPage.getByText('Mix ingredients')).not.toBeVisible();
  });

  test('should persist changes after page refresh', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

    const recipeData = generateRecipeData({
      title: 'Original Title'
    });
    const recipe = await api.createRecipe(token!, recipeData);

    // Edit the recipe
    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipe.id);
    await recipeDetailPage.editButton.click();

    editRecipePage = new CreateRecipePage(authenticatedPage);
    await editRecipePage.waitForFormLoaded();
    await editRecipePage.fillControlledInput(editRecipePage.titleInput, 'Updated After Refresh');
    await editRecipePage.submitAndWaitForResponse();

    // Wait for navigation to detail page before refreshing
    await expect(authenticatedPage).toHaveURL(`/recipes/${recipe.id}`);

    // Refresh the page
    await authenticatedPage.reload();

    // Changes should persist
    await expect(recipeDetailPage.recipeTitle).toHaveText('Updated After Refresh');
  });

  test('should cancel edit without saving changes', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

    const recipeData = generateRecipeData({
      title: 'Original Title'
    });
    const recipe = await api.createRecipe(token!, recipeData);

    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipe.id);
    await recipeDetailPage.editButton.click();

    editRecipePage = new CreateRecipePage(authenticatedPage);
    await editRecipePage.waitForFormLoaded();

    // Make changes but cancel using controlled input fill with retry
    await editRecipePage.fillControlledInput(editRecipePage.titleInput, 'Should Not Be Saved');
    await editRecipePage.cancel();

    // Should go back to detail page
    await expect(authenticatedPage).toHaveURL(`/recipes/${recipe.id}`);

    // Original title should still be there
    await expect(recipeDetailPage.recipeTitle).toHaveText('Original Title');
  });

  test('should validate required fields on edit', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

    const recipeData = generateRecipeData();
    const recipe = await api.createRecipe(token!, recipeData);

    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipe.id);
    await recipeDetailPage.editButton.click();

    editRecipePage = new CreateRecipePage(authenticatedPage);
    await editRecipePage.waitForFormLoaded();

    // Clear required field using controlled input fill with retry
    await editRecipePage.fillControlledInput(editRecipePage.titleInput, '');
    await editRecipePage.submit();

    // Should stay on edit page with validation error
    await expect(authenticatedPage).toHaveURL(/\/edit/);

    const hasErrors = await editRecipePage.hasValidationErrors();
    expect(hasErrors).toBe(true);
  });
});
