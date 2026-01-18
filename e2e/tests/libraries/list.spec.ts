import { test, expect } from '../../fixtures/auth.fixture';
import { LibrariesPage } from '../../pages/libraries.page';
import { APIHelper } from '../../utils/api';
import { generateLibraryData } from '../../utils/test-data';

test.describe('Library List', () => {
  let librariesPage: LibrariesPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    librariesPage = new LibrariesPage(authenticatedPage);
    await librariesPage.goto();
  });

  test('should display empty state when no libraries exist', async () => {
    await expect(librariesPage.emptyState).toBeVisible();
    await expect(librariesPage.createLibraryButton).toBeVisible();
  });

  test('should display user libraries', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await librariesPage.getAuthToken();

    // Create libraries via API
    await api.createLibrary(token!, generateLibraryData({ name: 'My Favorites' }));
    await api.createLibrary(token!, generateLibraryData({ name: 'Quick Meals' }));

    // Reload page
    await librariesPage.goto();

    // Should see both libraries
    await expect(librariesPage.page.getByText('My Favorites')).toBeVisible();
    await expect(librariesPage.page.getByText('Quick Meals')).toBeVisible();
  });

  test('should show library count', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await librariesPage.getAuthToken();

    // Create 3 libraries
    await api.createLibrary(token!, generateLibraryData({ name: 'Library 1' }));
    await api.createLibrary(token!, generateLibraryData({ name: 'Library 2' }));
    await api.createLibrary(token!, generateLibraryData({ name: 'Library 3' }));

    await librariesPage.goto();

    // Verify count (assuming library cards have data-testid)
    const cards = librariesPage.page.locator('[data-testid="library-card"]');
    await expect(cards).toHaveCount(3, { timeout: 10000 });
  });

  test('should navigate to library detail on click', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await librariesPage.getAuthToken();

    const libraryData = generateLibraryData({ name: 'Click Test Library' });
    await api.createLibrary(token!, libraryData);

    await librariesPage.goto();

    // Click on library
    await librariesPage.clickLibrary('Click Test Library');

    // Should navigate to detail page
    await expect(authenticatedPage).toHaveURL(/\/libraries\/[^/]+/);
  });
});
