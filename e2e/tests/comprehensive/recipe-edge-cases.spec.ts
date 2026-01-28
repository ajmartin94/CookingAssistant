/**
 * Comprehensive Tier: Recipe Edge Cases
 * Consolidated from: recipes/create.spec.ts, recipes/edit.spec.ts,
 * recipes/detail.spec.ts, recipes/delete.spec.ts, recipes/list.spec.ts
 *
 * Covers edge cases not in core tier:
 * - Validation: require ingredient on create, require instruction on create,
 *   validate required fields on edit
 * - Detail: 404 for non-existent recipe, total time calculation
 * - Delete: multiple deletions in sequence, delete recipe with ingredients/instructions
 * - List: combine search and filters
 *
 * Core recipe flows (create, read, update, delete happy paths) are in core/recipes.spec.ts.
 */

import { test, expect } from '../../fixtures/auth.fixture';
import { RecipesPage } from '../../pages/recipes.page';
import { CreateRecipePage } from '../../pages/create-recipe.page';
import { RecipeDetailPage } from '../../pages/recipe-detail.page';
import { APIHelper } from '../../utils/api';
import { generateRecipeData } from '../../utils/test-data';

test.describe('Comprehensive: Create Validation Edge Cases', () => {
  test('user cannot create recipe without any ingredients', async ({ authenticatedPage }) => {
    const recipesPage = new RecipesPage(authenticatedPage);
    const createRecipePage = new CreateRecipePage(authenticatedPage);

    await recipesPage.goto();
    await recipesPage.createRecipeButton.click();

    const recipeData = generateRecipeData();

    await createRecipePage.fillBasicInfo(
      recipeData.title,
      recipeData.description,
      recipeData.prep_time_minutes,
      recipeData.cook_time_minutes,
      recipeData.servings
    );

    // Add instructions but no ingredients
    await createRecipePage.addInstruction(
      recipeData.instructions[0].instruction,
      recipeData.instructions[0].duration_minutes
    );

    await createRecipePage.submit();

    const hasErrors = await createRecipePage.hasValidationErrors();
    expect(hasErrors).toBe(true);
  });

  test('user cannot create recipe without any instructions', async ({ authenticatedPage }) => {
    const recipesPage = new RecipesPage(authenticatedPage);
    const createRecipePage = new CreateRecipePage(authenticatedPage);

    await recipesPage.goto();
    await recipesPage.createRecipeButton.click();

    const recipeData = generateRecipeData();

    await createRecipePage.fillBasicInfo(
      recipeData.title,
      recipeData.description,
      recipeData.prep_time_minutes,
      recipeData.cook_time_minutes,
      recipeData.servings
    );

    // Add ingredients but no instructions
    await createRecipePage.addIngredient(
      recipeData.ingredients[0].name,
      recipeData.ingredients[0].amount,
      recipeData.ingredients[0].unit,
      recipeData.ingredients[0].notes
    );

    await createRecipePage.submit();

    const hasErrors = await createRecipePage.hasValidationErrors();
    expect(hasErrors).toBe(true);
  });
});

test.describe('Comprehensive: Edit Validation Edge Cases', () => {
  test('user cannot clear required fields during edit', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

    const recipeData = generateRecipeData();
    const recipe = await api.createRecipe(token!, recipeData);

    const recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipe.id);
    await recipeDetailPage.editButton.click();

    const editRecipePage = new CreateRecipePage(authenticatedPage);
    await editRecipePage.waitForFormLoaded();

    // Clear required field
    await editRecipePage.fillControlledInput(editRecipePage.titleInput, '');
    await editRecipePage.submit();

    // Should stay on edit page with validation error
    await expect(authenticatedPage).toHaveURL(/\/edit/);

    const hasErrors = await editRecipePage.hasValidationErrors();
    expect(hasErrors).toBe(true);
  });
});

test.describe('Comprehensive: Detail Page Edge Cases', () => {
  test('user sees error for non-existent recipe', async ({ authenticatedPage }) => {
    const recipeDetailPage = new RecipeDetailPage(authenticatedPage);

    await recipeDetailPage.goto('00000000-0000-0000-0000-000000000000');

    const errorMessage = authenticatedPage.getByText(/not found|doesn't exist|404|error/i);
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });

  test('total time is calculated from prep and cook time', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

    const recipeData = generateRecipeData({
      prep_time_minutes: 20,
      cook_time_minutes: 40,
    });

    const recipe = await api.createRecipe(token!, recipeData);
    const recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipe.id);

    const totalTime = await recipeDetailPage.getTotalTime();
    expect(totalTime).toBe('60');
  });
});

test.describe('Comprehensive: Delete Edge Cases', () => {
  test('user can delete multiple recipes in sequence', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

    const recipe1 = await api.createRecipe(token!, generateRecipeData({ title: 'Recipe 1' }));
    const recipe2 = await api.createRecipe(token!, generateRecipeData({ title: 'Recipe 2' }));
    const recipe3 = await api.createRecipe(token!, generateRecipeData({ title: 'Recipe 3' }));

    const recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    authenticatedPage.on('dialog', dialog => dialog.accept());

    // Delete recipe 1
    await recipeDetailPage.goto(recipe1.id);
    await recipeDetailPage.clickDeleteButton();
    await expect(authenticatedPage).toHaveURL(/\/recipes$/, { timeout: 10000 });

    // Delete recipe 2
    await recipeDetailPage.goto(recipe2.id);
    await recipeDetailPage.clickDeleteButton();
    await expect(authenticatedPage).toHaveURL(/\/recipes$/, { timeout: 10000 });

    // Verify only recipe 3 remains
    const recipesPage = new RecipesPage(authenticatedPage);
    await recipesPage.goto();

    await expect(authenticatedPage.getByText('Recipe 1')).not.toBeVisible();
    await expect(authenticatedPage.getByText('Recipe 2')).not.toBeVisible();
    await expect(authenticatedPage.getByText('Recipe 3')).toBeVisible();
  });

  test('user can delete recipe with many ingredients and instructions', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

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
      ],
    });

    const recipe = await api.createRecipe(token!, recipeData);

    const recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipe.id);

    authenticatedPage.on('dialog', dialog => dialog.accept());
    await recipeDetailPage.clickDeleteButton();

    await expect(authenticatedPage).toHaveURL(/\/recipes$/, { timeout: 10000 });
    await expect(authenticatedPage.getByText('Complex Recipe to Delete')).not.toBeVisible();
  });
});

test.describe('Comprehensive: List Edge Cases', () => {
  test('user can combine search and cuisine filter', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const recipesPage = new RecipesPage(authenticatedPage);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

    // Create various recipes
    await api.createRecipe(token!, generateRecipeData({
      title: 'Italian Vegetable Soup',
      cuisine_type: 'Italian',
      dietary_tags: ['vegetarian'],
    }));
    await api.createRecipe(token!, generateRecipeData({
      title: 'Italian Meatballs',
      cuisine_type: 'Italian',
      dietary_tags: [],
    }));
    await api.createRecipe(token!, generateRecipeData({
      title: 'Vegetable Stir Fry',
      cuisine_type: 'Chinese',
      dietary_tags: ['vegetarian'],
    }));

    await recipesPage.goto();

    // Search for "vegetable" AND filter by Italian
    await recipesPage.search('vegetable');
    await recipesPage.filterByCuisine('Italian');

    // Should only show Italian vegetable recipe
    const recipeCards = authenticatedPage.locator('[data-testid="recipe-card"]');
    await expect(recipeCards).toHaveCount(1, { timeout: 10000 });

    await expect(authenticatedPage.getByText('Italian Vegetable Soup')).toBeVisible();
  });
});
