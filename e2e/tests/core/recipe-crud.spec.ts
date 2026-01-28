/**
 * Core Tier: Recipe CRUD
 * Consolidated from: recipes/create.spec.ts, recipes/detail.spec.ts,
 *   recipes/edit.spec.ts, recipes/delete.spec.ts, recipes/list.spec.ts
 *
 * Covers: create (all fields, persist, remove items), detail (display, ownership),
 * edit (all field types, persist, cancel), delete (confirm, cancel, DB removal),
 * list (display, search, filters, empty states, navigation)
 *
 * Removed (per audit): create validate required fields, create require ingredient/instruction,
 * detail 404, detail total time, edit validate required fields,
 * delete non-owner, delete multiple sequence, delete with complex recipe,
 * list combine search+filters
 */

import { test, expect } from '../../fixtures/auth.fixture';
import { RecipesPage } from '../../pages/recipes.page';
import { CreateRecipePage } from '../../pages/create-recipe.page';
import { RecipeDetailPage } from '../../pages/recipe-detail.page';
import { APIHelper } from '../../utils/api';
import { generateRecipeData } from '../../utils/test-data';

// === CREATE ===

test.describe('Core: Recipe Creation', () => {
  let recipesPage: RecipesPage;
  let createRecipePage: CreateRecipePage;

  test.beforeEach(async ({ authenticatedPage }) => {
    recipesPage = new RecipesPage(authenticatedPage);
    createRecipePage = new CreateRecipePage(authenticatedPage);

    await recipesPage.goto();
  });

  test('should create recipe with all fields', async ({ authenticatedPage }) => {
    const recipeData = generateRecipeData();

    await recipesPage.createRecipeButton.click();
    await expect(authenticatedPage).toHaveURL(/\/recipes\/create/);

    await createRecipePage.fillBasicInfo(
      recipeData.title,
      recipeData.description,
      recipeData.prep_time_minutes,
      recipeData.cook_time_minutes,
      recipeData.servings
    );

    for (const ingredient of recipeData.ingredients) {
      await createRecipePage.addIngredient(
        ingredient.name,
        ingredient.amount,
        ingredient.unit,
        ingredient.notes
      );
    }

    for (const instruction of recipeData.instructions) {
      await createRecipePage.addInstruction(
        instruction.instruction,
        instruction.duration_minutes
      );
    }

    await createRecipePage.fillAdditionalInfo(
      recipeData.cuisine_type,
      recipeData.difficulty_level,
      recipeData.dietary_tags
    );

    await createRecipePage.submit();

    await expect(authenticatedPage).toHaveURL(/\/recipes\/[0-9a-f-]{36}/, { timeout: 10000 });

    const detailPage = new RecipeDetailPage(authenticatedPage);
    await expect(detailPage.recipeTitle).toHaveText(recipeData.title);
    await expect(detailPage.recipeDescription).toContainText(recipeData.description);
  });

  test('should persist recipe to database', async ({ authenticatedPage, context }) => {
    const recipeData = generateRecipeData();

    await recipesPage.createRecipeButton.click();
    await createRecipePage.fillBasicInfo(
      recipeData.title,
      recipeData.description,
      recipeData.prep_time_minutes,
      recipeData.cook_time_minutes,
      recipeData.servings
    );

    for (const ingredient of recipeData.ingredients) {
      await createRecipePage.addIngredient(
        ingredient.name,
        ingredient.amount,
        ingredient.unit,
        ingredient.notes
      );
    }

    for (const instruction of recipeData.instructions) {
      await createRecipePage.addInstruction(
        instruction.instruction,
        instruction.duration_minutes
      );
    }

    await createRecipePage.submit();
    await expect(authenticatedPage).toHaveURL(/\/recipes\/[0-9a-f-]{36}/, { timeout: 10000 });

    const url = authenticatedPage.url();
    const recipeId = url.match(/\/recipes\/([^/]+)/)?.[1];
    expect(recipeId).toBeTruthy();

    const newPage = await context.newPage();
    await newPage.goto(`/recipes/${recipeId}`);

    const detailPage = new RecipeDetailPage(newPage);
    await expect(detailPage.recipeTitle).toHaveText(recipeData.title);

    await newPage.close();
  });

  test('should allow removing ingredients and instructions before submission', async ({ authenticatedPage }) => {
    await recipesPage.createRecipeButton.click();

    // Add and remove ingredients
    await createRecipePage.addIngredient('flour', '2', 'cups', '');
    await createRecipePage.addIngredient('sugar', '1', 'cup', '');
    await createRecipePage.addIngredient('eggs', '3', 'whole', '');

    await createRecipePage.removeIngredient(1);

    const ingredientCount = await createRecipePage.getIngredientCount();
    expect(ingredientCount).toBe(2);

    // Add and remove instructions
    await createRecipePage.addInstruction('Mix ingredients', 5);
    await createRecipePage.addInstruction('Bake', 30);
    await createRecipePage.addInstruction('Cool', 10);

    await createRecipePage.removeInstruction(1);

    const instructionCount = await createRecipePage.getInstructionCount();
    expect(instructionCount).toBe(2);
  });
});

// === DETAIL ===

test.describe('Core: Recipe Detail', () => {
  let recipeDetailPage: RecipeDetailPage;

  test('should display all recipe fields', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

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

    await recipeDetailPage.goto(recipe.id);

    await expect(recipeDetailPage.recipeTitle).toHaveText('Complete Test Recipe');
    await expect(recipeDetailPage.recipeDescription).toContainText('A recipe with all fields filled');

    const prepTime = await recipeDetailPage.getPrepTime();
    expect(prepTime).toBe('15');

    const cookTime = await recipeDetailPage.getCookTime();
    expect(cookTime).toBe('45');

    const servings = await recipeDetailPage.getServings();
    expect(servings).toBe('6');

    await expect(authenticatedPage.getByText('Italian')).toBeVisible();
    await expect(authenticatedPage.getByText(/medium/i)).toBeVisible();

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

    await expect(authenticatedPage.getByText('flour')).toBeVisible();
    await expect(authenticatedPage.getByText('2 cups')).toBeVisible();
    await expect(authenticatedPage.getByText('all-purpose')).toBeVisible();

    await expect(authenticatedPage.getByText('sugar')).toBeVisible();
    await expect(authenticatedPage.getByText('1 cup')).toBeVisible();

    await expect(authenticatedPage.getByText('whole eggs')).toBeVisible();
    await expect(authenticatedPage.getByText('3 whole')).toBeVisible();
  });

  test('should display instructions in order', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

    const recipeData = generateRecipeData({
      instructions: [
        { step_number: 1, instruction: 'Preheat oven to 350\u00B0F', duration_minutes: 5 },
        { step_number: 2, instruction: 'Mix dry ingredients', duration_minutes: 5 },
        { step_number: 3, instruction: 'Add wet ingredients', duration_minutes: 3 },
        { step_number: 4, instruction: 'Bake for 30 minutes', duration_minutes: 30 },
      ]
    });

    const recipe = await api.createRecipe(token!, recipeData);
    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipe.id);

    await expect(authenticatedPage.getByText('Preheat oven to 350\u00B0F')).toBeVisible();
    await expect(authenticatedPage.getByText('Mix dry ingredients')).toBeVisible();
    await expect(authenticatedPage.getByText('Add wet ingredients')).toBeVisible();
    await expect(authenticatedPage.getByText('Bake for 30 minutes')).toBeVisible();

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

    await expect(recipeDetailPage.editButton).toBeVisible();
    await expect(recipeDetailPage.deleteButton).toBeVisible();
  });

  test('should not show edit/delete buttons for non-owner', async ({ authenticatedPage, context, request }) => {
    const api = new APIHelper(request);
    const token1 = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));
    const recipeData = generateRecipeData();
    const recipe = await api.createRecipe(token1!, recipeData);

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

    recipeDetailPage = new RecipeDetailPage(page2);
    await recipeDetailPage.goto(recipe.id);

    await expect(recipeDetailPage.editButton).not.toBeVisible();
    await expect(recipeDetailPage.deleteButton).not.toBeVisible();

    await page2.close();
  });

  test('should navigate to edit page when clicking edit button', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

    const recipeData = generateRecipeData();
    const recipe = await api.createRecipe(token!, recipeData);

    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipe.id);

    await recipeDetailPage.editButton.click();

    await expect(authenticatedPage).toHaveURL(`/recipes/${recipe.id}/edit`);
  });

  test('should display recipe metadata', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

    const recipeData = generateRecipeData({
      cuisine_type: 'Mexican',
      difficulty_level: 'hard',
      dietary_tags: ['vegan']
    });
    const recipe = await api.createRecipe(token!, recipeData);

    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipe.id);

    await expect(authenticatedPage.getByText('Mexican')).toBeVisible();
    await expect(authenticatedPage.getByText('hard')).toBeVisible();
    await expect(authenticatedPage.getByText('vegan')).toBeVisible();
  });
});

// === EDIT ===

test.describe('Core: Recipe Edit', () => {
  let recipeDetailPage: RecipeDetailPage;
  let editRecipePage: CreateRecipePage;

  test('should update recipe title and description', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

    const recipeData = generateRecipeData({
      title: 'Original Title',
      description: 'Original description'
    });
    const recipe = await api.createRecipe(token!, recipeData);

    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipe.id);
    await recipeDetailPage.editButton.click();

    editRecipePage = new CreateRecipePage(authenticatedPage);
    await editRecipePage.waitForFormLoaded();

    await editRecipePage.fillControlledInput(editRecipePage.titleInput, 'Updated Title');
    await editRecipePage.fillControlledInput(editRecipePage.descriptionInput, 'Updated description');

    await editRecipePage.submitAndWaitForResponse();

    await expect(authenticatedPage).toHaveURL(`/recipes/${recipe.id}`);

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

    await editRecipePage.fillControlledInput(editRecipePage.prepTimeInput, '25');
    await editRecipePage.fillControlledInput(editRecipePage.cookTimeInput, '45');
    await editRecipePage.fillControlledInput(editRecipePage.servingsInput, '6');

    await editRecipePage.submitAndWaitForResponse();

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

    await editRecipePage.cuisineSelect.selectOption('Japanese');
    await editRecipePage.difficultySelect.selectOption('hard');

    await editRecipePage.submitAndWaitForResponse();

    await expect(authenticatedPage.getByText('Japanese')).toBeVisible();
    await expect(authenticatedPage.getByText(/hard/i)).toBeVisible();
  });

  test('should add and remove ingredients', async ({ authenticatedPage, request }) => {
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

    // Add a new ingredient
    await editRecipePage.addIngredient('butter', '100', 'g', 'melted');

    // Remove the second ingredient (sugar)
    await editRecipePage.removeIngredient(1);

    await editRecipePage.submitAndWaitForResponse();

    await expect(authenticatedPage.getByText('flour')).toBeVisible();
    await expect(authenticatedPage.getByText('butter')).toBeVisible();
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

    const ingredientRow = authenticatedPage.locator('.ingredient-row, [data-testid="ingredient-row"]').first();
    const amountInput = ingredientRow.locator('input[name*="amount"]');
    await editRecipePage.fillControlledInput(amountInput, '3');

    await editRecipePage.submitAndWaitForResponse();

    await expect(authenticatedPage.getByText('3 cups')).toBeVisible();
  });

  test('should add and remove instructions', async ({ authenticatedPage, request }) => {
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

    // Add new instruction
    await editRecipePage.addInstruction('Let it cool', 15);

    // Remove the second instruction
    await editRecipePage.removeInstruction(1);

    await editRecipePage.submitAndWaitForResponse();

    await expect(authenticatedPage.getByText('Preheat oven')).toBeVisible();
    await expect(authenticatedPage.getByText('Bake')).toBeVisible();
    await expect(authenticatedPage.getByText('Let it cool')).toBeVisible();
    await expect(authenticatedPage.getByText('Mix ingredients')).not.toBeVisible();
  });

  test('should persist changes after page refresh', async ({ authenticatedPage, request }) => {
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
    await editRecipePage.fillControlledInput(editRecipePage.titleInput, 'Updated After Refresh');
    await editRecipePage.submitAndWaitForResponse();

    await expect(authenticatedPage).toHaveURL(`/recipes/${recipe.id}`);

    await authenticatedPage.reload();

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

    await editRecipePage.fillControlledInput(editRecipePage.titleInput, 'Should Not Be Saved');
    await editRecipePage.cancel();

    await expect(authenticatedPage).toHaveURL(`/recipes/${recipe.id}`);

    await expect(recipeDetailPage.recipeTitle).toHaveText('Original Title');
  });
});

// === DELETE ===

test.describe('Core: Recipe Deletion', () => {
  let recipeDetailPage: RecipeDetailPage;
  let recipesPage: RecipesPage;

  test('should delete recipe successfully', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

    const recipeData = generateRecipeData({ title: 'Recipe to Delete' });
    const recipe = await api.createRecipe(token!, recipeData);

    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipe.id);

    authenticatedPage.on('dialog', dialog => dialog.accept());

    await recipeDetailPage.clickDeleteButton();

    await expect(authenticatedPage).toHaveURL(/\/recipes$/, { timeout: 10000 });

    recipesPage = new RecipesPage(authenticatedPage);
    await expect(authenticatedPage.getByText('Recipe to Delete')).not.toBeVisible();
  });

  test('should show confirmation dialog before deleting', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

    const recipeData = generateRecipeData();
    const recipe = await api.createRecipe(token!, recipeData);

    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipe.id);

    let dialogShown = false;
    authenticatedPage.on('dialog', dialog => {
      dialogShown = true;
      dialog.dismiss();
    });

    await recipeDetailPage.clickDeleteButton();

    await authenticatedPage.waitForTimeout(500);

    expect(dialogShown).toBe(true);

    await expect(authenticatedPage).toHaveURL(`/recipes/${recipe.id}`);
  });

  test('should cancel deletion when dismissing confirmation', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

    const recipeData = generateRecipeData({ title: 'Should Not Be Deleted' });
    const recipe = await api.createRecipe(token!, recipeData);

    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipe.id);

    authenticatedPage.on('dialog', dialog => dialog.dismiss());

    await recipeDetailPage.clickDeleteButton();
    await authenticatedPage.waitForTimeout(500);

    await expect(authenticatedPage).toHaveURL(`/recipes/${recipe.id}`);

    await expect(recipeDetailPage.recipeTitle).toHaveText('Should Not Be Deleted');
  });

  test('should remove recipe from database', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

    const recipeData = generateRecipeData();
    const recipe = await api.createRecipe(token!, recipeData);

    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipe.id);

    authenticatedPage.on('dialog', dialog => dialog.accept());
    await recipeDetailPage.clickDeleteButton();
    await expect(authenticatedPage).toHaveURL(/\/recipes$/, { timeout: 10000 });

    await authenticatedPage.goto(`/recipes/${recipe.id}`);

    const notFoundMessage = authenticatedPage.getByText(/not found|doesn't exist/i);
    await expect(notFoundMessage).toBeVisible({ timeout: 10000 });
  });

  test('should update recipe count after deletion', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

    await api.createRecipe(token!, generateRecipeData({ title: 'Recipe A' }));
    await api.createRecipe(token!, generateRecipeData({ title: 'Recipe B' }));
    const recipeC = await api.createRecipe(token!, generateRecipeData({ title: 'Recipe C' }));

    recipesPage = new RecipesPage(authenticatedPage);
    await recipesPage.goto();

    let recipeCards = authenticatedPage.locator('[data-testid="recipe-card"]');
    await expect(recipeCards).toHaveCount(3);

    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipeC.id);

    authenticatedPage.on('dialog', dialog => dialog.accept());
    await recipeDetailPage.clickDeleteButton();

    await expect(authenticatedPage).toHaveURL(/\/recipes$/, { timeout: 10000 });

    recipeCards = authenticatedPage.locator('[data-testid="recipe-card"]');
    await expect(recipeCards).toHaveCount(2);
  });
});

// === LIST ===

test.describe('Core: Recipe List', () => {
  let recipesPage: RecipesPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    recipesPage = new RecipesPage(authenticatedPage);
    await recipesPage.goto();
  });

  test('should display user recipes', async ({ authenticatedPage, testUser, request }) => {
    const api = new APIHelper(request);

    const token = await recipesPage.getAuthToken();
    const recipe1 = generateRecipeData({ title: 'Test Recipe 1' });
    const recipe2 = generateRecipeData({ title: 'Test Recipe 2' });

    await api.createRecipe(token!, recipe1);
    await api.createRecipe(token!, recipe2);

    await recipesPage.goto();

    const recipeCards = recipesPage.page.locator('[data-testid="recipe-card"]');
    await expect(recipeCards).toHaveCount(2, { timeout: 10000 });

    await expect(recipesPage.page.getByText('Test Recipe 1')).toBeVisible();
    await expect(recipesPage.page.getByText('Test Recipe 2')).toBeVisible();
  });

  test('should search recipes by title', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await recipesPage.getAuthToken();

    await api.createRecipe(token!, generateRecipeData({ title: 'Chocolate Cake' }));
    await api.createRecipe(token!, generateRecipeData({ title: 'Vanilla Cookies' }));
    await api.createRecipe(token!, generateRecipeData({ title: 'Chocolate Brownies' }));

    await recipesPage.goto();

    await recipesPage.search('chocolate');

    const recipeCards = recipesPage.page.locator('[data-testid="recipe-card"]');
    await expect(recipeCards).toHaveCount(2, { timeout: 10000 });

    await expect(recipesPage.page.getByText('Chocolate Cake')).toBeVisible();
    await expect(recipesPage.page.getByText('Chocolate Brownies')).toBeVisible();
    await expect(recipesPage.page.getByText('Vanilla Cookies')).not.toBeVisible();
  });

  test('should filter by cuisine type', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await recipesPage.getAuthToken();

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

    await recipesPage.filterByCuisine('Italian');

    const recipeCards = recipesPage.page.locator('[data-testid="recipe-card"]');
    await expect(recipeCards).toHaveCount(2, { timeout: 10000 });

    await expect(recipesPage.page.getByText('Pasta Carbonara')).toBeVisible();
    await expect(recipesPage.page.getByText('Pizza Margherita')).toBeVisible();
    await expect(recipesPage.page.getByText('Sushi Roll')).not.toBeVisible();
  });

  test('should filter by difficulty level', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await recipesPage.getAuthToken();

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

    await recipesPage.filterByDifficulty('easy');

    const recipeCards = recipesPage.page.locator('[data-testid="recipe-card"]');
    await expect(recipeCards).toHaveCount(2, { timeout: 10000 });

    await expect(recipesPage.page.getByText('Simple Salad')).toBeVisible();
    await expect(recipesPage.page.getByText('Basic Pasta')).toBeVisible();
    await expect(recipesPage.page.getByText('Beef Wellington')).not.toBeVisible();
  });

  test('should filter by dietary tags', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await recipesPage.getAuthToken();

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

    await recipesPage.filterByDietaryTag('vegetarian');

    const recipeCards = recipesPage.page.locator('[data-testid="recipe-card"]');
    await expect(recipeCards).toHaveCount(2, { timeout: 10000 });

    await expect(recipesPage.page.getByText('Veggie Burger')).toBeVisible();
    await expect(recipesPage.page.getByText('Tofu Stir Fry')).toBeVisible();
    await expect(recipesPage.page.getByText('Grilled Chicken')).not.toBeVisible();
  });

  test('should clear filters', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await recipesPage.getAuthToken();

    await api.createRecipe(token!, generateRecipeData({ title: 'Recipe 1', cuisine_type: 'Italian' }));
    await api.createRecipe(token!, generateRecipeData({ title: 'Recipe 2', cuisine_type: 'Japanese' }));

    await recipesPage.goto();

    await recipesPage.filterByCuisine('Italian');
    const filteredCards = recipesPage.page.locator('[data-testid="recipe-card"]');
    await expect(filteredCards).toHaveCount(1);

    await recipesPage.clearFilters();

    const allCards = recipesPage.page.locator('[data-testid="recipe-card"]');
    await expect(allCards).toHaveCount(2, { timeout: 10000 });
  });

  test('should show empty state when no recipes', async ({ authenticatedPage }) => {
    await recipesPage.goto();

    const emptyMessage = recipesPage.page.getByText(/no recipes/i);
    await expect(emptyMessage).toBeVisible();

    await expect(recipesPage.createRecipeButton).toBeVisible();
  });

  test('should show empty state when search returns no results', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await recipesPage.getAuthToken();

    await api.createRecipe(token!, generateRecipeData({ title: 'Chocolate Cake' }));

    await recipesPage.goto();

    await recipesPage.search('unicorn recipe');

    const noResultsMessage = recipesPage.page.getByText(/no recipes found/i);
    await expect(noResultsMessage).toBeVisible();
  });

  test('should navigate to recipe detail on click', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await recipesPage.getAuthToken();

    const recipeData = generateRecipeData({ title: 'Test Navigation Recipe' });
    await api.createRecipe(token!, recipeData);

    await recipesPage.goto();

    const recipeCard = recipesPage.page.locator('[data-testid="recipe-card"]').first();
    await recipeCard.click();

    await expect(authenticatedPage).toHaveURL(/\/recipes\/[^/]+/);
  });
});
