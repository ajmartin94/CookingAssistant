/**
 * Comprehensive: Cooking Mode Overlay Layout
 *
 * Covers: Overlay covers full viewport (including sidebar), no duplicate controls
 */

import { test, expect } from '../../fixtures/auth.fixture';
import { RecipeDetailPage } from '../../pages/recipe-detail.page';
import { APIHelper } from '../../utils/api';
import { generateRecipeData } from '../../utils/test-data';

test.use({ viewport: { width: 1280, height: 720 } });

test.describe('Comprehensive: Cooking Mode Overlay Layout', () => {
  let recipeDetailPage: RecipeDetailPage;
  let recipeId: string;

  test.beforeEach(async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );

    const recipeData = generateRecipeData();
    const recipe = await api.createRecipe(token!, recipeData);
    recipeId = recipe.id;

    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipeId);
  });

  test('cooking mode overlay covers sidebar', async ({ authenticatedPage }) => {
    // Verify sidebar is visible before cooking mode
    const sidebar = authenticatedPage.locator('nav, [data-testid="sidebar"], aside').first();
    await expect(sidebar).toBeVisible();

    // Enter cooking mode
    await authenticatedPage.getByRole('button', { name: /start cooking/i }).click();

    const overlay = authenticatedPage.getByRole('dialog');
    await expect(overlay).toBeVisible();

    // The overlay should cover the full viewport width
    const box = await overlay.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeLessThanOrEqual(5); // Left edge at or near 0
    expect(box!.width).toBeGreaterThanOrEqual(1270); // Full viewport width (1280 minus small tolerance)

    // The sidebar should not be visible when cooking mode is active
    await expect(sidebar).not.toBeVisible();
  });

  test('cooking mode header shows exactly one set of controls', async ({ authenticatedPage }) => {
    // Enter cooking mode
    await authenticatedPage.getByRole('button', { name: /start cooking/i }).click();

    const overlay = authenticatedPage.getByRole('dialog');
    await expect(overlay).toBeVisible();

    // There should be exactly one Close button visible
    const closeButtons = authenticatedPage.getByRole('button', { name: /close/i });
    await expect(closeButtons).toHaveCount(1);

    // There should be exactly one Steps button visible
    const stepsButtons = authenticatedPage.getByRole('button', { name: /steps/i });
    await expect(stepsButtons).toHaveCount(1);
  });
});
