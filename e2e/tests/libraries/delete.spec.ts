import { test, expect } from '../../fixtures/auth.fixture';
import { LibrariesPage } from '../../pages/libraries.page';
import { APIHelper } from '../../utils/api';
import { generateLibraryData } from '../../utils/test-data';

test.describe('Library Deletion', () => {
  let librariesPage: LibrariesPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    librariesPage = new LibrariesPage(authenticatedPage);
  });

  test('should delete a library', async ({ request }) => {
    const api = new APIHelper(request);
    const token = await librariesPage.getAuthToken();

    // Create library first
    await api.createLibrary(token!, generateLibraryData({ name: 'To Be Deleted' }));

    await librariesPage.goto();
    await expect(librariesPage.page.getByText('To Be Deleted')).toBeVisible();

    // Delete it
    await librariesPage.deleteLibrary('To Be Deleted');

    // Should no longer be visible
    await expect(librariesPage.page.getByText('To Be Deleted')).not.toBeVisible();
  });

  test('should remove library from database after deletion', async ({ request }) => {
    const api = new APIHelper(request);
    const token = await librariesPage.getAuthToken();

    // Create and get library
    const created = await api.createLibrary(
      token!,
      generateLibraryData({ name: 'Database Delete Test' })
    );
    const libraryId = created.id;

    await librariesPage.goto();
    await librariesPage.deleteLibrary('Database Delete Test');

    // Verify removed from database
    const libraries = await api.getLibraries(token!);
    const found = libraries.find((lib: any) => lib.id === libraryId);
    expect(found).toBeFalsy();
  });

  test('should delete one of multiple libraries', async ({ request }) => {
    const api = new APIHelper(request);
    const token = await librariesPage.getAuthToken();

    // Create three libraries
    await api.createLibrary(token!, generateLibraryData({ name: 'Keep This One' }));
    await api.createLibrary(token!, generateLibraryData({ name: 'Delete This One' }));
    await api.createLibrary(token!, generateLibraryData({ name: 'Also Keep This' }));

    await librariesPage.goto();

    // Delete the middle one
    await librariesPage.deleteLibrary('Delete This One');

    // Verify only the correct one was deleted
    await expect(librariesPage.page.getByText('Keep This One')).toBeVisible();
    await expect(librariesPage.page.getByText('Delete This One')).not.toBeVisible();
    await expect(librariesPage.page.getByText('Also Keep This')).toBeVisible();
  });

  test('should show empty state after deleting last library', async ({ request }) => {
    const api = new APIHelper(request);
    const token = await librariesPage.getAuthToken();

    // Create single library
    await api.createLibrary(token!, generateLibraryData({ name: 'Only Library' }));

    await librariesPage.goto();
    await librariesPage.deleteLibrary('Only Library');

    // Should show empty state
    await expect(librariesPage.emptyState).toBeVisible();
  });

  test('should delete multiple libraries in sequence', async ({ request }) => {
    const api = new APIHelper(request);
    const token = await librariesPage.getAuthToken();

    // Create libraries
    await api.createLibrary(token!, generateLibraryData({ name: 'Delete First' }));
    await api.createLibrary(token!, generateLibraryData({ name: 'Delete Second' }));
    await api.createLibrary(token!, generateLibraryData({ name: 'Delete Third' }));

    await librariesPage.goto();

    // Delete them one by one
    await librariesPage.deleteLibrary('Delete First');
    await expect(librariesPage.page.getByText('Delete First')).not.toBeVisible();

    await librariesPage.deleteLibrary('Delete Second');
    await expect(librariesPage.page.getByText('Delete Second')).not.toBeVisible();

    await librariesPage.deleteLibrary('Delete Third');
    await expect(librariesPage.page.getByText('Delete Third')).not.toBeVisible();

    // Should show empty state
    await expect(librariesPage.emptyState).toBeVisible();
  });
});
