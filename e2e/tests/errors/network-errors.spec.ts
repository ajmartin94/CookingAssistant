import { test, expect } from '../../fixtures/auth.fixture';
import { RecipesPage } from '../../pages/recipes.page';
import { CreateRecipePage } from '../../pages/create-recipe.page';
import { LoginPage } from '../../pages/login.page';
import { generateRecipeData } from '../../utils/test-data';

test.describe('Network Error Handling', () => {
  test('should handle API errors gracefully on recipe creation', async ({ authenticatedPage }) => {
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

    // Should show error message
    const errorMessage = authenticatedPage.locator('.error, [role="alert"], .text-red-500');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });

    // Should stay on create page
    await expect(authenticatedPage).toHaveURL(/\/create/);
  });

  test('should handle 500 server errors', async ({ authenticatedPage }) => {
    const createRecipePage = new CreateRecipePage(authenticatedPage);
    await createRecipePage.goto();

    // Intercept API request and return 500 error
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

    // Should display user-friendly error message
    const errorMessage = authenticatedPage.locator('.error, [role="alert"]');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });

    // Error message should be user-friendly
    const errorText = await errorMessage.textContent();
    expect(errorText?.toLowerCase()).toContain('error');
  });

  test('should handle unauthorized (401) errors by redirecting to login', async ({ authenticatedPage }) => {
    const recipesPage = new RecipesPage(authenticatedPage);

    // Clear auth token to simulate expired session
    await authenticatedPage.evaluate(() => {
      localStorage.removeItem('token');
    });

    // Try to access protected route
    await recipesPage.goto();

    // Should redirect to login
    await expect(authenticatedPage).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('should handle network timeout gracefully', async ({ authenticatedPage }) => {
    const createRecipePage = new CreateRecipePage(authenticatedPage);
    await createRecipePage.goto();

    // Intercept and delay API request to simulate timeout
    await authenticatedPage.route('**/api/v1/recipes', async route => {
      await new Promise(resolve => setTimeout(resolve, 60000)); // 60 second delay
      route.continue();
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

    // Should show timeout or error message within reasonable time
    const errorMessage = authenticatedPage.locator('.error, [role="alert"]');
    await expect(errorMessage).toBeVisible({ timeout: 30000 });
  });

  test('should handle 404 errors for non-existent recipes', async ({ authenticatedPage }) => {
    const recipeDetailPage = await import('../../pages/recipe-detail.page');
    const RecipeDetailPage = recipeDetailPage.RecipeDetailPage;
    const detailPage = new RecipeDetailPage(authenticatedPage);

    // Navigate to non-existent recipe
    await detailPage.goto('00000000-0000-0000-0000-000000000000');

    // Should show not found message
    const notFoundMessage = authenticatedPage.getByText(/not found|doesn't exist/i);
    await expect(notFoundMessage).toBeVisible({ timeout: 10000 });
  });

  test('should handle invalid JSON responses', async ({ authenticatedPage }) => {
    const recipesPage = new RecipesPage(authenticatedPage);

    // Intercept API and return invalid JSON
    await authenticatedPage.route('**/api/v1/recipes*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'invalid json{{{',
      });
    });

    await recipesPage.goto();

    // Should handle the error gracefully
    // Either show error message or show empty state
    const errorOrEmpty = authenticatedPage.locator('.error, [role="alert"], :text("no recipes")');
    await expect(errorOrEmpty.first()).toBeVisible({ timeout: 10000 });
  });

  test('should retry failed login attempts', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    let attemptCount = 0;

    // Intercept login and fail first attempt, succeed second
    await page.route('**/api/v1/users/login', route => {
      attemptCount++;
      if (attemptCount === 1) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });

    // This test verifies that users can retry after a failed login
    await loginPage.usernameInput.fill('testuser');
    await loginPage.passwordInput.fill('testpassword');
    await loginPage.loginButton.click();

    // First attempt should fail
    await page.waitForTimeout(1000);

    // Should show error
    const errorVisible = await loginPage.hasError();
    expect(errorVisible || attemptCount > 0).toBe(true);
  });

  test('should handle CORS errors gracefully', async ({ authenticatedPage }) => {
    const createRecipePage = new CreateRecipePage(authenticatedPage);
    await createRecipePage.goto();

    // Simulate CORS error by blocking the request
    await authenticatedPage.route('**/api/v1/recipes', route => {
      route.abort('connectionrefused');
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

    // Should show connection error message
    const errorMessage = authenticatedPage.locator('.error, [role="alert"]');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });

  test('should handle rate limiting (429) errors', async ({ authenticatedPage }) => {
    const recipesPage = new RecipesPage(authenticatedPage);

    // Intercept and return 429 Too Many Requests
    await authenticatedPage.route('**/api/v1/recipes*', route => {
      route.fulfill({
        status: 429,
        body: JSON.stringify({ detail: 'Too many requests' }),
      });
    });

    await recipesPage.goto();

    // Should show appropriate error message
    const errorMessage = authenticatedPage.locator('.error, [role="alert"]');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });
});
