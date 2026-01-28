/**
 * Core Tier: Libraries
 * Consolidated from: libraries/create.spec.ts, libraries/delete.spec.ts,
 *   libraries/list.spec.ts, libraries/recipes.spec.ts
 *
 * Covers: create (with name+desc, persist), delete (basic, empty state),
 * list (display, count), recipes (display in detail, empty state)
 *
 * Removed (per audit): create name only, create public, cancel creation,
 * validate required, create multiple, delete from DB, delete one of multiple,
 * delete sequence, list empty state, list navigate to detail,
 * recipes add/remove via API, recipes add multiple
 */

import { test, expect } from '../../fixtures/auth.fixture';
import { LibrariesPage } from '../../pages/libraries.page';
import { APIHelper } from '../../utils/api';
import { generateLibraryData, generateRecipeData } from '../../utils/test-data';

// === CREATE ===

test.describe('Core: Library Creation', () => {
  let librariesPage: LibrariesPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    librariesPage = new LibrariesPage(authenticatedPage);
    await librariesPage.goto();
  });

  test('should create library with name and description', async ({ request }) => {
    const api = new APIHelper(request);
    const token = await librariesPage.getAuthToken();

    await librariesPage.createLibrary(
      'Desserts Collection',
      'All my favorite sweet treats'
    );

    await expect(librariesPage.page.getByText('Desserts Collection')).toBeVisible();

    const libraries = await api.getLibraries(token!);
    const created = libraries.find((lib: any) => lib.name === 'Desserts Collection');
    expect(created).toBeTruthy();
    expect(created.description).toBe('All my favorite sweet treats');
  });

  test('should persist library after page refresh', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await librariesPage.getAuthToken();

    await librariesPage.createLibrary('Persistent Library');

    await librariesPage.goto();

    await expect(librariesPage.page.getByText('Persistent Library')).toBeVisible();
  });
});

// === DELETE ===

test.describe('Core: Library Deletion', () => {
  let librariesPage: LibrariesPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    librariesPage = new LibrariesPage(authenticatedPage);
  });

  test('should delete a library', async ({ request }) => {
    const api = new APIHelper(request);
    const token = await librariesPage.getAuthToken();

    await api.createLibrary(token!, generateLibraryData({ name: 'To Be Deleted' }));

    await librariesPage.goto();
    await expect(librariesPage.page.getByText('To Be Deleted')).toBeVisible();

    await librariesPage.deleteLibrary('To Be Deleted');

    await expect(librariesPage.page.getByText('To Be Deleted')).not.toBeVisible();
  });

  test('should show empty state after deleting last library', async ({ request }) => {
    const api = new APIHelper(request);
    const token = await librariesPage.getAuthToken();

    await api.createLibrary(token!, generateLibraryData({ name: 'Only Library' }));

    await librariesPage.goto();
    await librariesPage.deleteLibrary('Only Library');

    await expect(librariesPage.emptyState).toBeVisible();
  });
});

// === LIST ===

test.describe('Core: Library List', () => {
  let librariesPage: LibrariesPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    librariesPage = new LibrariesPage(authenticatedPage);
    await librariesPage.goto();
  });

  test('should display user libraries', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await librariesPage.getAuthToken();

    await api.createLibrary(token!, generateLibraryData({ name: 'My Favorites' }));
    await api.createLibrary(token!, generateLibraryData({ name: 'Quick Meals' }));

    await librariesPage.goto();

    await expect(librariesPage.page.getByText('My Favorites')).toBeVisible();
    await expect(librariesPage.page.getByText('Quick Meals')).toBeVisible();
  });

  test('should show library count', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await librariesPage.getAuthToken();

    await api.createLibrary(token!, generateLibraryData({ name: 'Library 1' }));
    await api.createLibrary(token!, generateLibraryData({ name: 'Library 2' }));
    await api.createLibrary(token!, generateLibraryData({ name: 'Library 3' }));

    await librariesPage.goto();

    const cards = librariesPage.page.locator('[data-testid="library-card"]');
    await expect(cards).toHaveCount(3, { timeout: 10000 });
  });
});

// === RECIPES IN LIBRARY ===

test.describe('Core: Library Recipes', () => {
  let librariesPage: LibrariesPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    librariesPage = new LibrariesPage(authenticatedPage);
  });

  test('should display recipes in library detail page', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await librariesPage.getAuthToken();

    const library = await api.createLibrary(
      token!,
      generateLibraryData({ name: 'Display Test Library' })
    );
    const recipe = await api.createRecipe(
      token!,
      generateRecipeData({ title: 'Visible Recipe' })
    );
    await api.addRecipeToLibrary(token!, library.id, recipe.id);

    await librariesPage.goto();
    await librariesPage.clickLibrary('Display Test Library');

    await expect(authenticatedPage.getByText('Visible Recipe')).toBeVisible();
  });

  test('should show empty state when library has no recipes', async ({
    authenticatedPage,
    request,
  }) => {
    const api = new APIHelper(request);
    const token = await librariesPage.getAuthToken();

    const library = await api.createLibrary(
      token!,
      generateLibraryData({ name: 'Empty Library' })
    );

    await librariesPage.goto();
    await librariesPage.clickLibrary('Empty Library');

    const emptyMessage = authenticatedPage.getByText(/no recipes/i);
    await expect(emptyMessage).toBeVisible();
  });
});
