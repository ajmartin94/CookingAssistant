import { test, expect } from '../../fixtures/auth.fixture';
import { RecipesPage } from '../../pages/recipes.page';
import { APIHelper } from '../../utils/api';
import { generateRecipeData } from '../../utils/test-data';

// Viewport configurations
const viewports = {
  mobile: { width: 375, height: 667 }, // iPhone SE
  tablet: { width: 768, height: 1024 }, // iPad
  desktop: { width: 1280, height: 720 }, // Laptop
  wide: { width: 1920, height: 1080 }, // Desktop monitor
};

test.describe('Responsive - Mobile (375px)', () => {
  test.use({ viewport: viewports.mobile });

  test('should render recipes page without horizontal scroll', async ({ authenticatedPage }) => {
    const recipesPage = new RecipesPage(authenticatedPage);
    await recipesPage.goto();

    // Check no horizontal overflow
    const body = authenticatedPage.locator('body');
    const scrollWidth = await body.evaluate((el) => el.scrollWidth);
    const clientWidth = await body.evaluate((el) => el.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // Allow 1px tolerance
  });

  test('should stack recipe cards in single column', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const recipesPage = new RecipesPage(authenticatedPage);
    const token = await recipesPage.getAuthToken();

    // Create recipes
    await api.createRecipe(token!, generateRecipeData({ title: 'Mobile Recipe 1' }));
    await api.createRecipe(token!, generateRecipeData({ title: 'Mobile Recipe 2' }));

    await recipesPage.goto();

    // Cards should be full width on mobile
    const cards = authenticatedPage.locator('[data-testid="recipe-card"]');
    const firstCard = cards.first();
    const cardWidth = await firstCard.evaluate((el) => el.getBoundingClientRect().width);
    const containerWidth = await authenticatedPage
      .locator('.container, main')
      .first()
      .evaluate((el) => el.getBoundingClientRect().width);

    // Card should take most of container width (accounting for padding)
    expect(cardWidth).toBeGreaterThan(containerWidth * 0.8);
  });

  test('should have touch-friendly button sizes', async ({ authenticatedPage }) => {
    const recipesPage = new RecipesPage(authenticatedPage);
    await recipesPage.goto();

    // Check create button is at least 44px tall (touch target)
    const createButton = recipesPage.createRecipeButton;
    if (await createButton.isVisible()) {
      const height = await createButton.evaluate((el) => el.getBoundingClientRect().height);
      expect(height).toBeGreaterThanOrEqual(44);
    }
  });

  test('should display readable text', async ({ authenticatedPage }) => {
    const recipesPage = new RecipesPage(authenticatedPage);
    await recipesPage.goto();

    // Check heading font size is reasonable
    const heading = authenticatedPage.locator('h1').first();
    if (await heading.isVisible()) {
      const fontSize = await heading.evaluate((el) =>
        parseFloat(window.getComputedStyle(el).fontSize)
      );
      expect(fontSize).toBeGreaterThanOrEqual(20); // At least 20px for headings
    }
  });
});

test.describe('Responsive - Tablet (768px)', () => {
  test.use({ viewport: viewports.tablet });

  test('should render recipes page without horizontal scroll', async ({ authenticatedPage }) => {
    const recipesPage = new RecipesPage(authenticatedPage);
    await recipesPage.goto();

    const body = authenticatedPage.locator('body');
    const scrollWidth = await body.evaluate((el) => el.scrollWidth);
    const clientWidth = await body.evaluate((el) => el.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test('should show 2 columns of recipe cards', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const recipesPage = new RecipesPage(authenticatedPage);
    const token = await recipesPage.getAuthToken();

    // Create enough recipes
    await api.createRecipe(token!, generateRecipeData({ title: 'Tablet Recipe 1' }));
    await api.createRecipe(token!, generateRecipeData({ title: 'Tablet Recipe 2' }));
    await api.createRecipe(token!, generateRecipeData({ title: 'Tablet Recipe 3' }));

    await recipesPage.goto();

    // Get grid and check column count
    const grid = authenticatedPage.locator('.grid').first();
    if (await grid.isVisible()) {
      const gridStyle = await grid.evaluate((el) => window.getComputedStyle(el).gridTemplateColumns);
      const columns = gridStyle.split(' ').length;
      expect(columns).toBeGreaterThanOrEqual(2);
    }
  });
});

test.describe('Responsive - Desktop (1280px)', () => {
  test.use({ viewport: viewports.desktop });

  test('should render recipes page without horizontal scroll', async ({ authenticatedPage }) => {
    const recipesPage = new RecipesPage(authenticatedPage);
    await recipesPage.goto();

    const body = authenticatedPage.locator('body');
    const scrollWidth = await body.evaluate((el) => el.scrollWidth);
    const clientWidth = await body.evaluate((el) => el.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test('should show 3+ columns of recipe cards', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const recipesPage = new RecipesPage(authenticatedPage);
    const token = await recipesPage.getAuthToken();

    // Create enough recipes
    await api.createRecipe(token!, generateRecipeData({ title: 'Desktop Recipe 1' }));
    await api.createRecipe(token!, generateRecipeData({ title: 'Desktop Recipe 2' }));
    await api.createRecipe(token!, generateRecipeData({ title: 'Desktop Recipe 3' }));
    await api.createRecipe(token!, generateRecipeData({ title: 'Desktop Recipe 4' }));

    await recipesPage.goto();

    // Get grid and check column count
    const grid = authenticatedPage.locator('.grid').first();
    if (await grid.isVisible()) {
      const gridStyle = await grid.evaluate((el) => window.getComputedStyle(el).gridTemplateColumns);
      const columns = gridStyle.split(' ').length;
      expect(columns).toBeGreaterThanOrEqual(3);
    }
  });

  test('navigation should be fully visible', async ({ authenticatedPage }) => {
    const recipesPage = new RecipesPage(authenticatedPage);
    await recipesPage.goto();

    // Nav links should be visible
    const recipesLink = authenticatedPage.locator('nav a[href="/recipes"], a:has-text("Recipes")');
    if (await recipesLink.count() > 0) {
      await expect(recipesLink.first()).toBeVisible();
    }
  });
});

test.describe('Responsive - Login Page', () => {
  test('should be usable on mobile', async ({ page }) => {
    await page.setViewportSize(viewports.mobile);
    await page.goto('/login');

    // Form should be visible
    const usernameInput = page.locator('input[name="username"], input[type="text"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]');

    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    // Form should be full width on mobile
    const form = page.locator('form').first();
    const formWidth = await form.evaluate((el) => el.getBoundingClientRect().width);
    expect(formWidth).toBeGreaterThan(viewports.mobile.width * 0.7);
  });

  test('should center form on desktop', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await page.goto('/login');

    const form = page.locator('form').first();
    const formBox = await form.evaluate((el) => el.getBoundingClientRect());

    // Form should be roughly centered
    const centerOffset = Math.abs(
      formBox.left + formBox.width / 2 - viewports.desktop.width / 2
    );
    expect(centerOffset).toBeLessThan(viewports.desktop.width * 0.2);
  });
});

test.describe('Responsive - Recipe Detail Page', () => {
  test('should display all content on mobile', async ({ authenticatedPage, request }) => {
    await authenticatedPage.setViewportSize(viewports.mobile);

    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

    const recipe = await api.createRecipe(token!, generateRecipeData({
      title: 'Mobile Detail Test',
      description: 'A test recipe for mobile view',
    }));

    await authenticatedPage.goto(`/recipes/${recipe.id}`);

    // Key elements should be visible
    await expect(authenticatedPage.getByText('Mobile Detail Test')).toBeVisible();
    await expect(authenticatedPage.getByText(/ingredients/i)).toBeVisible();
    await expect(authenticatedPage.getByText(/instructions/i)).toBeVisible();
  });
});
