/**
 * Core Tier: Workflows
 * Consolidated from: workflows/complete-recipe-journey.spec.ts
 *
 * All 3 tests kept as-is (full journey tests per audit).
 */

import { test, expect } from '@playwright/test';
import { RegisterPage } from '../../pages/register.page';
import { LoginPage } from '../../pages/login.page';
import { RecipesPage } from '../../pages/recipes.page';
import { CreateRecipePage } from '../../pages/create-recipe.page';
import { RecipeDetailPage } from '../../pages/recipe-detail.page';
import { generateUniqueUsername, generateUniqueEmail, generateRecipeData } from '../../utils/test-data';

test.describe('Core: Complete Recipe Journey', () => {
  test('should complete full user journey: register, create, view, edit, delete, logout', async ({ page, context }) => {
    const username = generateUniqueUsername();
    const email = generateUniqueEmail();
    const password = 'TestPassword123!';

    // === STEP 1: REGISTRATION ===
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await registerPage.register(username, email, password);

    await expect(page).toHaveURL(/\/recipes/, { timeout: 10000 });

    const token = await registerPage.getAuthToken();
    expect(token).toBeTruthy();

    // === STEP 2: CREATE RECIPE ===
    const recipesPage = new RecipesPage(page);
    const createRecipePage = new CreateRecipePage(page);

    await recipesPage.createRecipeButton.click();
    await expect(page).toHaveURL(/\/recipes\/create/);

    const recipeData = generateRecipeData({
      title: 'My Journey Test Recipe',
      description: 'A recipe created during the complete user journey test',
      prep_time_minutes: 15,
      cook_time_minutes: 30,
      servings: 4,
      cuisine_type: 'American',
      difficulty_level: 'medium'
    });

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

    await expect(page).toHaveURL(/\/recipes\/[0-9a-f-]{36}/, { timeout: 10000 });

    const url = page.url();
    const recipeId = url.match(/\/recipes\/([^/]+)/)?.[1];
    expect(recipeId).toBeTruthy();

    // === STEP 3: VIEW RECIPE ===
    const recipeDetailPage = new RecipeDetailPage(page);

    await expect(recipeDetailPage.recipeTitle).toHaveText('My Journey Test Recipe');
    await expect(recipeDetailPage.recipeDescription).toContainText('complete user journey test');

    await expect(page.getByText(recipeData.ingredients[0].name)).toBeVisible();

    await expect(page.getByText(recipeData.instructions[0].instruction)).toBeVisible();

    // === STEP 4: EDIT RECIPE ===
    await recipeDetailPage.editButton.click();
    await expect(page).toHaveURL(/\/edit/);

    const editRecipePage = new CreateRecipePage(page);
    await editRecipePage.waitForFormLoaded();

    await editRecipePage.fillControlledInput(editRecipePage.titleInput, 'My Updated Journey Recipe');

    await editRecipePage.addIngredient('additional ingredient', '1', 'piece', 'optional');

    await editRecipePage.submit();

    await expect(page).toHaveURL(`/recipes/${recipeId}`);

    await expect(recipeDetailPage.recipeTitle).toHaveText('My Updated Journey Recipe');
    await expect(page.getByText('additional ingredient')).toBeVisible();

    // === STEP 5: NAVIGATE TO LIST AND VERIFY ===
    await recipesPage.goto();

    await expect(page.getByText('My Updated Journey Recipe')).toBeVisible();

    // === STEP 6: SEARCH FOR RECIPE ===
    await recipesPage.search('Updated');

    const recipeCards = page.locator('[data-testid="recipe-card"]');
    await expect(recipeCards).toHaveCount(1);
    await expect(page.getByText('My Updated Journey Recipe')).toBeVisible();

    await recipesPage.searchInput.clear();
    await page.waitForTimeout(500);

    // === STEP 7: DELETE RECIPE ===
    await recipeDetailPage.goto(recipeId!);

    page.on('dialog', dialog => dialog.accept());

    await recipeDetailPage.clickDeleteButton();

    await expect(page).toHaveURL(/\/recipes$/, { timeout: 10000 });

    await expect(page.getByText('My Updated Journey Recipe')).not.toBeVisible();

    // === STEP 8: VERIFY DELETION ===
    await page.goto(`/recipes/${recipeId}`);

    const errorMessage = page.getByText(/not found|doesn't exist|404|error/i);
    await expect(errorMessage).toBeVisible({ timeout: 10000 });

    // === STEP 9: LOGOUT ===
    await recipesPage.goto();
    await recipesPage.logout();

    await expect(page).toHaveURL(/\/login/);

    const tokenAfterLogout = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(tokenAfterLogout).toBeNull();

    // === STEP 10: VERIFY LOGGED OUT STATE ===
    await page.goto('/recipes');

    await expect(page).toHaveURL(/\/login/);

    // === STEP 11: LOGIN AGAIN ===
    const loginPage = new LoginPage(page);
    await loginPage.login(username, password);

    await expect(page).toHaveURL(/\/recipes/);

    const newToken = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(newToken).toBeTruthy();

    // === STEP 12: VERIFY NO RECIPES (deleted earlier) ===
    const remainingCards = page.locator('[data-testid="recipe-card"]');
    await expect(remainingCards).toHaveCount(0);
  });

  test('should handle complete journey with multiple recipes', async ({ page }) => {
    const username = generateUniqueUsername();
    const email = generateUniqueEmail();
    const password = 'TestPassword123!';

    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.register(username, email, password);
    await expect(page).toHaveURL(/\/recipes/, { timeout: 10000 });

    const recipesPage = new RecipesPage(page);
    const createRecipePage = new CreateRecipePage(page);
    const recipeDetailPage = new RecipeDetailPage(page);

    const recipeIds: string[] = [];

    for (let i = 1; i <= 3; i++) {
      await recipesPage.createRecipeButton.click();

      const recipeData = generateRecipeData({
        title: `Recipe Number ${i}`,
        description: `Description for recipe ${i}`
      });

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
      await expect(page).toHaveURL(/\/recipes\/[0-9a-f-]{36}/, { timeout: 10000 });

      const url = page.url();
      const recipeId = url.match(/\/recipes\/([^/]+)/)?.[1];
      if (recipeId) recipeIds.push(recipeId);

      await recipesPage.goto();
    }

    const recipeCards = page.locator('[data-testid="recipe-card"]');
    await expect(recipeCards).toHaveCount(3);

    await recipeDetailPage.goto(recipeIds[1]);
    page.on('dialog', dialog => dialog.accept());
    await recipeDetailPage.clickDeleteButton();
    await expect(page).toHaveURL(/\/recipes$/, { timeout: 10000 });

    await expect(recipeCards).toHaveCount(2);

    await expect(page.getByText('Recipe Number 1')).toBeVisible();
    await expect(page.getByText('Recipe Number 2')).not.toBeVisible();
    await expect(page.getByText('Recipe Number 3')).toBeVisible();

    await recipesPage.logout();
    await expect(page).toHaveURL(/\/login/);
  });

  test('should persist data across page refreshes during journey', async ({ page }) => {
    const username = generateUniqueUsername();
    const email = generateUniqueEmail();
    const password = 'TestPassword123!';

    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.register(username, email, password);
    await expect(page).toHaveURL(/\/recipes/, { timeout: 10000 });

    const recipesPage = new RecipesPage(page);
    const createRecipePage = new CreateRecipePage(page);

    await recipesPage.createRecipeButton.click();

    const recipeData = generateRecipeData({ title: 'Persistence Test Recipe' });

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
    await expect(page).toHaveURL(/\/recipes\/[0-9a-f-]{36}/, { timeout: 10000 });

    const url = page.url();
    const recipeId = url.match(/\/recipes\/([^/]+)/)?.[1];

    await page.reload();

    await expect(page).toHaveURL(`/recipes/${recipeId}`);

    const recipeDetailPage = new RecipeDetailPage(page);
    await expect(recipeDetailPage.recipeTitle).toHaveText('Persistence Test Recipe');

    await recipesPage.goto();

    await page.reload();

    await expect(page.getByText('Persistence Test Recipe')).toBeVisible();
  });
});
