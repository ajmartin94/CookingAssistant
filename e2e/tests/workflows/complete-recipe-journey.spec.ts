import { test, expect } from '@playwright/test';
import { RegisterPage } from '../../pages/register.page';
import { LoginPage } from '../../pages/login.page';
import { RecipesPage } from '../../pages/recipes.page';
import { CreateRecipePage } from '../../pages/create-recipe.page';
import { RecipeDetailPage } from '../../pages/recipe-detail.page';
import { generateUniqueUsername, generateUniqueEmail, generateRecipeData } from '../../utils/test-data';

test.describe('Complete Recipe Journey', () => {
  test('should complete full user journey: register → create → view → edit → delete → logout', async ({ page, context }) => {
    // Generate unique user credentials
    const username = generateUniqueUsername();
    const email = generateUniqueEmail();
    const password = 'TestPassword123!';

    // === STEP 1: REGISTRATION ===
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await registerPage.register(username, email, password);

    // Should redirect to recipes page
    await expect(page).toHaveURL(/\/recipes/, { timeout: 10000 });

    // Should have auth token
    const token = await registerPage.getAuthToken();
    expect(token).toBeTruthy();

    // === STEP 2: CREATE RECIPE ===
    const recipesPage = new RecipesPage(page);
    const createRecipePage = new CreateRecipePage(page);

    // Navigate to create recipe page
    await recipesPage.createRecipeButton.click();
    await expect(page).toHaveURL(/\/recipes\/create/);

    // Fill in recipe data
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

    // Add ingredients
    for (const ingredient of recipeData.ingredients) {
      await createRecipePage.addIngredient(
        ingredient.name,
        ingredient.amount,
        ingredient.unit,
        ingredient.notes
      );
    }

    // Add instructions
    for (const instruction of recipeData.instructions) {
      await createRecipePage.addInstruction(
        instruction.instruction,
        instruction.duration_minutes
      );
    }

    // Set additional info
    await createRecipePage.fillAdditionalInfo(
      recipeData.cuisine_type,
      recipeData.difficulty_level,
      recipeData.dietary_tags
    );

    // Submit the recipe
    await createRecipePage.submit();

    // Should redirect to recipe detail page
    await expect(page).toHaveURL(/\/recipes\/[^/]+/, { timeout: 10000 });

    // Get the recipe ID from URL
    const url = page.url();
    const recipeId = url.match(/\/recipes\/([^/]+)/)?.[1];
    expect(recipeId).toBeTruthy();

    // === STEP 3: VIEW RECIPE ===
    const recipeDetailPage = new RecipeDetailPage(page);

    // Verify recipe details are displayed correctly
    await expect(recipeDetailPage.recipeTitle).toHaveText('My Journey Test Recipe');
    await expect(recipeDetailPage.recipeDescription).toContainText('complete user journey test');

    // Verify ingredients are shown
    await expect(page.getByText(recipeData.ingredients[0].name)).toBeVisible();

    // Verify instructions are shown
    await expect(page.getByText(recipeData.instructions[0].instruction)).toBeVisible();

    // === STEP 4: EDIT RECIPE ===
    await recipeDetailPage.editButton.click();
    await expect(page).toHaveURL(/\/edit/);

    const editRecipePage = new CreateRecipePage(page);

    // Update the title
    await editRecipePage.titleInput.clear();
    await editRecipePage.titleInput.fill('My Updated Journey Recipe');

    // Add another ingredient
    await editRecipePage.addIngredient('additional ingredient', '1', 'piece', 'optional');

    // Submit changes
    await editRecipePage.submit();

    // Should return to detail page
    await expect(page).toHaveURL(`/recipes/${recipeId}`);

    // Verify changes were saved
    await expect(recipeDetailPage.recipeTitle).toHaveText('My Updated Journey Recipe');
    await expect(page.getByText('additional ingredient')).toBeVisible();

    // === STEP 5: NAVIGATE TO LIST AND VERIFY ===
    await recipesPage.goto();

    // Should see the recipe in the list
    await expect(page.getByText('My Updated Journey Recipe')).toBeVisible();

    // === STEP 6: SEARCH FOR RECIPE ===
    await recipesPage.search('Updated');

    // Should still see the recipe
    const recipeCards = page.locator('[data-testid="recipe-card"]');
    await expect(recipeCards).toHaveCount(1);
    await expect(page.getByText('My Updated Journey Recipe')).toBeVisible();

    // Clear search
    await recipesPage.searchInput.clear();
    await page.waitForTimeout(500);

    // === STEP 7: DELETE RECIPE ===
    // Navigate back to recipe detail
    await recipeDetailPage.goto(recipeId!);

    // Set up dialog handler
    page.on('dialog', dialog => dialog.accept());

    // Delete the recipe
    await recipeDetailPage.deleteButton.click();

    // Should redirect to recipes list
    await expect(page).toHaveURL(/\/recipes$/, { timeout: 10000 });

    // Recipe should not be visible
    await expect(page.getByText('My Updated Journey Recipe')).not.toBeVisible();

    // === STEP 8: VERIFY DELETION ===
    // Try to access deleted recipe directly
    await page.goto(`/recipes/${recipeId}`);

    // Should show not found or redirect
    const notFoundMessage = page.getByText(/not found|doesn't exist/i);
    await expect(notFoundMessage).toBeVisible({ timeout: 10000 });

    // === STEP 9: LOGOUT ===
    await recipesPage.goto();
    await recipesPage.logout();

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/);

    // Auth token should be removed
    const tokenAfterLogout = await page.evaluate(() => localStorage.getItem('token'));
    expect(tokenAfterLogout).toBeNull();

    // === STEP 10: VERIFY LOGGED OUT STATE ===
    // Try to access protected route
    await page.goto('/recipes');

    // Should redirect back to login
    await expect(page).toHaveURL(/\/login/);

    // === STEP 11: LOGIN AGAIN ===
    const loginPage = new LoginPage(page);
    await loginPage.login(username, password);

    // Should be able to log back in
    await expect(page).toHaveURL(/\/recipes/);

    // Should have new auth token
    const newToken = await page.evaluate(() => localStorage.getItem('token'));
    expect(newToken).toBeTruthy();

    // === STEP 12: VERIFY NO RECIPES (deleted earlier) ===
    // Should see empty state or no recipes
    const remainingCards = page.locator('[data-testid="recipe-card"]');
    await expect(remainingCards).toHaveCount(0);
  });

  test('should handle complete journey with multiple recipes', async ({ page }) => {
    // Generate unique user
    const username = generateUniqueUsername();
    const email = generateUniqueEmail();
    const password = 'TestPassword123!';

    // Register
    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.register(username, email, password);
    await expect(page).toHaveURL(/\/recipes/, { timeout: 10000 });

    const recipesPage = new RecipesPage(page);
    const createRecipePage = new CreateRecipePage(page);
    const recipeDetailPage = new RecipeDetailPage(page);

    // Create 3 recipes
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
      await expect(page).toHaveURL(/\/recipes\/[^/]+/, { timeout: 10000 });

      const url = page.url();
      const recipeId = url.match(/\/recipes\/([^/]+)/)?.[1];
      if (recipeId) recipeIds.push(recipeId);

      await recipesPage.goto();
    }

    // Verify all 3 recipes are in list
    const recipeCards = page.locator('[data-testid="recipe-card"]');
    await expect(recipeCards).toHaveCount(3);

    // Delete middle recipe
    await recipeDetailPage.goto(recipeIds[1]);
    page.on('dialog', dialog => dialog.accept());
    await recipeDetailPage.deleteButton.click();
    await expect(page).toHaveURL(/\/recipes$/, { timeout: 10000 });

    // Should have 2 recipes now
    await expect(recipeCards).toHaveCount(2);

    // Verify correct recipes remain
    await expect(page.getByText('Recipe Number 1')).toBeVisible();
    await expect(page.getByText('Recipe Number 2')).not.toBeVisible();
    await expect(page.getByText('Recipe Number 3')).toBeVisible();

    // Logout
    await recipesPage.logout();
    await expect(page).toHaveURL(/\/login/);
  });

  test('should persist data across page refreshes during journey', async ({ page }) => {
    // Register
    const username = generateUniqueUsername();
    const email = generateUniqueEmail();
    const password = 'TestPassword123!';

    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.register(username, email, password);
    await expect(page).toHaveURL(/\/recipes/, { timeout: 10000 });

    // Create a recipe
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
    await expect(page).toHaveURL(/\/recipes\/[^/]+/, { timeout: 10000 });

    const url = page.url();
    const recipeId = url.match(/\/recipes\/([^/]+)/)?.[1];

    // Refresh the page
    await page.reload();

    // Should still be authenticated and on the same page
    await expect(page).toHaveURL(`/recipes/${recipeId}`);

    // Recipe data should still be there
    const recipeDetailPage = new RecipeDetailPage(page);
    await expect(recipeDetailPage.recipeTitle).toHaveText('Persistence Test Recipe');

    // Navigate to list
    await recipesPage.goto();

    // Refresh again
    await page.reload();

    // Should still see the recipe
    await expect(page.getByText('Persistence Test Recipe')).toBeVisible();
  });
});
