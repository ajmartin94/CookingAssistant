import { test, expect } from '../../fixtures/auth.fixture';
import { RecipesPage } from '../../pages/recipes.page';

test.describe('User Logout', () => {
  test('should logout successfully', async ({ authenticatedPage }) => {
    const recipesPage = new RecipesPage(authenticatedPage);

    // Verify we're authenticated and on recipes page
    await recipesPage.goto();
    await expect(authenticatedPage).toHaveURL(/\/recipes/);

    // Logout
    await recipesPage.logout();

    // Should redirect to login page
    await expect(authenticatedPage).toHaveURL(/\/login/);

    // Auth token should be removed
    const token = await recipesPage.getAuthToken();
    expect(token).toBeNull();
  });

  test('should redirect to login when accessing protected route after logout', async ({ authenticatedPage }) => {
    const recipesPage = new RecipesPage(authenticatedPage);

    // Logout
    await recipesPage.goto();
    await recipesPage.logout();

    // Try to access protected route
    await authenticatedPage.goto('/recipes/create');

    // Should redirect to login
    await expect(authenticatedPage).toHaveURL(/\/login/);
  });

  test('should redirect to login when accessing recipes page after logout', async ({ authenticatedPage }) => {
    const recipesPage = new RecipesPage(authenticatedPage);

    await recipesPage.goto();
    await recipesPage.logout();

    // Try to access recipes page
    await authenticatedPage.goto('/recipes');

    // Should redirect to login
    await expect(authenticatedPage).toHaveURL(/\/login/);
  });
});
