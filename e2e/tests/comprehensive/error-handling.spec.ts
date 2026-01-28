/**
 * Comprehensive Tier: Error Handling
 * Consolidated from: errors/network-errors.spec.ts, errors/validation-errors.spec.ts
 *
 * Covers: network failure on create, 500 server error, 401 redirect to login,
 * 404 non-existent recipe, recipe creation validation (empty form, missing title,
 * missing ingredients, missing instructions, user-friendly messages),
 * edit validation (clearing required fields)
 *
 * Removed (per audit):
 * - retry login (weak assertion: errorVisible || attemptCount > 0 always passes)
 * - CORS test (duplicate of network fail - same abort mechanism)
 * - rate limiting 429 (unlikely scenario)
 * - invalid JSON response (edge case)
 * - registration validation tests (duplicates core/auth.spec.ts)
 * - login validation tests (duplicates core/auth.spec.ts)
 * - server-side validation test (duplicates core/auth.spec.ts)
 */

import { test, expect } from '../../fixtures/auth.fixture';
import { test as publicTest, expect as publicExpect } from '@playwright/test';
import { RecipesPage } from '../../pages/recipes.page';
import { CreateRecipePage } from '../../pages/create-recipe.page';
import { RecipeDetailPage } from '../../pages/recipe-detail.page';
import { RegisterPage } from '../../pages/register.page';
import { APIHelper } from '../../utils/api';
import { generateRecipeData, generateUniqueUsername, generateUniqueEmail } from '../../utils/test-data';

test.describe('Comprehensive: Network Error Handling', () => {
  test('user sees error when network fails during recipe creation', async ({ authenticatedPage }) => {
    const createRecipePage = new CreateRecipePage(authenticatedPage);
    await createRecipePage.goto();

    // Intercept API request and force it to fail
    await authenticatedPage.route('**/api/v1/recipes', route => {
      route.abort('failed');
    });

    const recipeData = generateRecipeData();

    await createRecipePage.fillBasicInfo(
      recipeData.title,
      recipeData.description,
      recipeData.prep_time_minutes,
      recipeData.cook_time_minutes,
      recipeData.servings
    );

    await createRecipePage.addIngredient(
      recipeData.ingredients[0].name,
      recipeData.ingredients[0].amount,
      recipeData.ingredients[0].unit
    );

    await createRecipePage.addInstruction(
      recipeData.instructions[0].instruction,
      recipeData.instructions[0].duration_minutes
    );

    await createRecipePage.submit();

    // Should show error message and stay on create page
    const errorMessage = authenticatedPage.locator('.bg-error-50, [role="alert"]').first();
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    await expect(authenticatedPage).toHaveURL(/\/create/);
  });

  test('user sees friendly error on 500 server error', async ({ authenticatedPage }) => {
    const createRecipePage = new CreateRecipePage(authenticatedPage);
    await createRecipePage.goto();

    await authenticatedPage.route('**/api/v1/recipes', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ detail: 'Internal server error' }),
      });
    });

    const recipeData = generateRecipeData();

    await createRecipePage.fillBasicInfo(
      recipeData.title,
      recipeData.description,
      recipeData.prep_time_minutes,
      recipeData.cook_time_minutes,
      recipeData.servings
    );

    await createRecipePage.addIngredient(
      recipeData.ingredients[0].name,
      recipeData.ingredients[0].amount,
      recipeData.ingredients[0].unit
    );

    await createRecipePage.addInstruction(
      recipeData.instructions[0].instruction,
      recipeData.instructions[0].duration_minutes
    );

    await createRecipePage.submit();

    const errorMessage = authenticatedPage.locator('.bg-error-50, [role="alert"]').first();
    await expect(errorMessage).toBeVisible({ timeout: 10000 });

    const errorText = await errorMessage.textContent();
    expect(errorText?.toLowerCase()).toContain('error');
  });

  test('user is redirected to login when session expires (401)', async ({ authenticatedPage }) => {
    const recipesPage = new RecipesPage(authenticatedPage);

    // Clear auth token to simulate expired session
    await authenticatedPage.evaluate(() => {
      localStorage.removeItem('auth_token');
    });

    await recipesPage.goto();

    await expect(authenticatedPage).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('user sees not-found message for non-existent recipe', async ({ authenticatedPage }) => {
    const detailPage = new RecipeDetailPage(authenticatedPage);

    await detailPage.goto('00000000-0000-0000-0000-000000000000');

    const notFoundMessage = authenticatedPage.locator('.bg-error-50').or(
      authenticatedPage.getByText(/not found|doesn't exist|error/i)
    );
    await expect(notFoundMessage.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Comprehensive: Recipe Creation Validation', () => {
  let createRecipePage: CreateRecipePage;

  test.beforeEach(async ({ authenticatedPage }) => {
    createRecipePage = new CreateRecipePage(authenticatedPage);
    await createRecipePage.goto();
  });

  test('user cannot submit empty recipe form', async ({ authenticatedPage }) => {
    await createRecipePage.submit();

    await expect(authenticatedPage).toHaveURL(/\/create/);

    const hasErrors = await createRecipePage.hasValidationErrors();
    expect(hasErrors).toBe(true);
  });

  test('user cannot create recipe without title', async ({ authenticatedPage }) => {
    // Fill everything except title
    await createRecipePage.descriptionInput.fill('A description');
    await createRecipePage.prepTimeInput.fill('10');
    await createRecipePage.cookTimeInput.fill('20');
    await createRecipePage.servingsInput.fill('4');

    await createRecipePage.addIngredient('flour', '2', 'cups');
    await createRecipePage.addInstruction('Mix ingredients', 5);

    await createRecipePage.submit();

    await expect(authenticatedPage).toHaveURL(/\/create/);

    const hasErrors = await createRecipePage.hasValidationErrors();
    expect(hasErrors).toBe(true);
  });

  test('user cannot create recipe without ingredients', async ({ authenticatedPage }) => {
    await createRecipePage.titleInput.fill('Test Recipe');
    await createRecipePage.descriptionInput.fill('Description');
    await createRecipePage.prepTimeInput.fill('10');
    await createRecipePage.cookTimeInput.fill('20');
    await createRecipePage.servingsInput.fill('4');

    await createRecipePage.addInstruction('Cook it', 30);

    await createRecipePage.submit();

    await expect(authenticatedPage).toHaveURL(/\/create/);

    const hasErrors = await createRecipePage.hasValidationErrors();
    expect(hasErrors).toBe(true);
  });

  test('user cannot create recipe without instructions', async ({ authenticatedPage }) => {
    await createRecipePage.titleInput.fill('Test Recipe');
    await createRecipePage.descriptionInput.fill('Description');
    await createRecipePage.prepTimeInput.fill('10');
    await createRecipePage.cookTimeInput.fill('20');
    await createRecipePage.servingsInput.fill('4');

    await createRecipePage.addIngredient('flour', '2', 'cups');

    await createRecipePage.submit();

    await expect(authenticatedPage).toHaveURL(/\/create/);

    const hasErrors = await createRecipePage.hasValidationErrors();
    expect(hasErrors).toBe(true);
  });

  test('user sees friendly validation messages on empty submit', async ({ authenticatedPage }) => {
    await createRecipePage.submit();

    const errorMessages = authenticatedPage.locator('.error, .validation-error, [role="alert"], .text-error-500');
    const errorCount = await errorMessages.count();

    expect(errorCount).toBeGreaterThan(0);

    const firstError = errorMessages.first();
    await expect(firstError).toBeVisible();

    const errorText = await firstError.textContent();
    expect(errorText?.trim().length).toBeGreaterThan(0);
  });
});

test.describe('Comprehensive: Recipe Edit Validation', () => {
  test('user cannot clear required fields during edit', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

    const recipeData = generateRecipeData({ title: 'Original Recipe' });
    const recipe = await api.createRecipe(token!, recipeData);

    const recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipe.id);
    await recipeDetailPage.editButton.click();

    const editRecipePage = new CreateRecipePage(authenticatedPage);
    await editRecipePage.waitForFormLoaded();

    // Clear the title
    await editRecipePage.fillControlledInput(editRecipePage.titleInput, '');
    await editRecipePage.submit();

    // Should stay on edit page with validation error
    await expect(authenticatedPage).toHaveURL(/\/edit/);

    const hasErrors = await editRecipePage.hasValidationErrors();
    expect(hasErrors).toBe(true);
  });
});
