import { test, expect } from '../../fixtures/auth.fixture';
import { LibrariesPage } from '../../pages/libraries.page';
import { APIHelper } from '../../utils/api';
import { generateLibraryData, generateRecipeData } from '../../utils/test-data';

test.describe('Library Recipes', () => {
  let librariesPage: LibrariesPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    librariesPage = new LibrariesPage(authenticatedPage);
  });

  test('should add recipe to library via API', async ({ request }) => {
    const api = new APIHelper(request);
    const token = await librariesPage.getAuthToken();

    // Create library and recipe
    const library = await api.createLibrary(
      token!,
      generateLibraryData({ name: 'Recipe Collection' })
    );
    const recipe = await api.createRecipe(
      token!,
      generateRecipeData({ title: 'Test Recipe for Library' })
    );

    // Add recipe to library
    await api.addRecipeToLibrary(token!, library.id, recipe.id);

    // Verify recipe is in library
    const updatedLibrary = await api.getLibrary(token!, library.id);
    expect(updatedLibrary.recipes).toBeDefined();
    const recipeInLibrary = updatedLibrary.recipes?.find((r: any) => r.id === recipe.id);
    expect(recipeInLibrary).toBeTruthy();
  });

  test('should remove recipe from library via API', async ({ request }) => {
    const api = new APIHelper(request);
    const token = await librariesPage.getAuthToken();

    // Create library and recipe
    const library = await api.createLibrary(
      token!,
      generateLibraryData({ name: 'Removal Test Library' })
    );
    const recipe = await api.createRecipe(
      token!,
      generateRecipeData({ title: 'Recipe to Remove' })
    );

    // Add then remove
    await api.addRecipeToLibrary(token!, library.id, recipe.id);
    await api.removeRecipeFromLibrary(token!, library.id, recipe.id);

    // Verify recipe is removed
    const updatedLibrary = await api.getLibrary(token!, library.id);
    const recipeInLibrary = updatedLibrary.recipes?.find((r: any) => r.id === recipe.id);
    expect(recipeInLibrary).toBeFalsy();
  });

  test('should add multiple recipes to library', async ({ request }) => {
    const api = new APIHelper(request);
    const token = await librariesPage.getAuthToken();

    // Create library and multiple recipes
    const library = await api.createLibrary(
      token!,
      generateLibraryData({ name: 'Multi Recipe Library' })
    );
    const recipe1 = await api.createRecipe(
      token!,
      generateRecipeData({ title: 'Recipe One' })
    );
    const recipe2 = await api.createRecipe(
      token!,
      generateRecipeData({ title: 'Recipe Two' })
    );
    const recipe3 = await api.createRecipe(
      token!,
      generateRecipeData({ title: 'Recipe Three' })
    );

    // Add all to library
    await api.addRecipeToLibrary(token!, library.id, recipe1.id);
    await api.addRecipeToLibrary(token!, library.id, recipe2.id);
    await api.addRecipeToLibrary(token!, library.id, recipe3.id);

    // Verify all are in library
    const updatedLibrary = await api.getLibrary(token!, library.id);
    expect(updatedLibrary.recipes?.length).toBe(3);
  });

  test('should display recipes in library detail page', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await librariesPage.getAuthToken();

    // Create library with recipes
    const library = await api.createLibrary(
      token!,
      generateLibraryData({ name: 'Display Test Library' })
    );
    const recipe = await api.createRecipe(
      token!,
      generateRecipeData({ title: 'Visible Recipe' })
    );
    await api.addRecipeToLibrary(token!, library.id, recipe.id);

    // Navigate to library detail
    await librariesPage.goto();
    await librariesPage.clickLibrary('Display Test Library');

    // Should see the recipe
    await expect(authenticatedPage.getByText('Visible Recipe')).toBeVisible();
  });

  test('should show empty state when library has no recipes', async ({
    authenticatedPage,
    request,
  }) => {
    const api = new APIHelper(request);
    const token = await librariesPage.getAuthToken();

    // Create empty library
    const library = await api.createLibrary(
      token!,
      generateLibraryData({ name: 'Empty Library' })
    );

    // Navigate to library detail
    await librariesPage.goto();
    await librariesPage.clickLibrary('Empty Library');

    // Should show empty state message
    const emptyMessage = authenticatedPage.getByText(/no recipes/i);
    await expect(emptyMessage).toBeVisible();
  });
});
