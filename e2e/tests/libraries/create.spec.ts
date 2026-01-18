import { test, expect } from '../../fixtures/auth.fixture';
import { LibrariesPage } from '../../pages/libraries.page';
import { APIHelper } from '../../utils/api';

test.describe('Library Creation', () => {
  let librariesPage: LibrariesPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    librariesPage = new LibrariesPage(authenticatedPage);
    await librariesPage.goto();
  });

  test('should open create library modal', async () => {
    await librariesPage.openCreateModal();
    await expect(librariesPage.createModal).toBeVisible();
    await expect(librariesPage.libraryNameInput).toBeVisible();
    await expect(librariesPage.libraryDescriptionInput).toBeVisible();
  });

  test('should create library with name only', async ({ request }) => {
    const api = new APIHelper(request);
    const token = await librariesPage.getAuthToken();

    await librariesPage.createLibrary('My New Library');

    // Verify library appears in list
    await expect(librariesPage.page.getByText('My New Library')).toBeVisible();

    // Verify in database
    const libraries = await api.getLibraries(token!);
    const created = libraries.find((lib: any) => lib.name === 'My New Library');
    expect(created).toBeTruthy();
  });

  test('should create library with name and description', async ({ request }) => {
    const api = new APIHelper(request);
    const token = await librariesPage.getAuthToken();

    await librariesPage.createLibrary(
      'Desserts Collection',
      'All my favorite sweet treats'
    );

    // Verify library appears
    await expect(librariesPage.page.getByText('Desserts Collection')).toBeVisible();

    // Verify description in database
    const libraries = await api.getLibraries(token!);
    const created = libraries.find((lib: any) => lib.name === 'Desserts Collection');
    expect(created).toBeTruthy();
    expect(created.description).toBe('All my favorite sweet treats');
  });

  test('should create public library', async ({ request }) => {
    const api = new APIHelper(request);
    const token = await librariesPage.getAuthToken();

    await librariesPage.createLibrary('Public Recipes', 'Shared with everyone', true);

    // Verify in database
    const libraries = await api.getLibraries(token!);
    const created = libraries.find((lib: any) => lib.name === 'Public Recipes');
    expect(created).toBeTruthy();
    expect(created.is_public).toBe(true);
  });

  test('should cancel library creation', async () => {
    await librariesPage.openCreateModal();
    await librariesPage.fillField(librariesPage.libraryNameInput, 'Cancelled Library');
    await librariesPage.cancelCreate();

    // Modal should be closed
    await expect(librariesPage.createModal).not.toBeVisible();

    // Library should not appear
    await expect(librariesPage.page.getByText('Cancelled Library')).not.toBeVisible();
  });

  test('should validate required name field', async () => {
    await librariesPage.openCreateModal();

    // Try to submit without name
    const submitButton = librariesPage.submitButton;
    await expect(submitButton).toBeDisabled();
  });

  test('should create multiple libraries', async ({ request }) => {
    const api = new APIHelper(request);
    const token = await librariesPage.getAuthToken();

    await librariesPage.createLibrary('First Library');
    await librariesPage.createLibrary('Second Library');
    await librariesPage.createLibrary('Third Library');

    // Verify all appear
    await expect(librariesPage.page.getByText('First Library')).toBeVisible();
    await expect(librariesPage.page.getByText('Second Library')).toBeVisible();
    await expect(librariesPage.page.getByText('Third Library')).toBeVisible();

    // Verify count in database
    const libraries = await api.getLibraries(token!);
    expect(libraries.length).toBeGreaterThanOrEqual(3);
  });

  test('should persist library after page refresh', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await librariesPage.getAuthToken();

    await librariesPage.createLibrary('Persistent Library');

    // Refresh page
    await librariesPage.goto();

    // Library should still be there
    await expect(librariesPage.page.getByText('Persistent Library')).toBeVisible();
  });
});
