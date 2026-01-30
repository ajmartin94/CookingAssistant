/**
 * Core Tier: Cooking Mode
 *
 * Covers: Start cooking overlay, step navigation (next/previous/keyboard),
 * close (X button, Escape), resume position, start over, progress bar
 */

import { test, expect } from '../../fixtures/auth.fixture';
import { RecipeDetailPage } from '../../pages/recipe-detail.page';
import { APIHelper } from '../../utils/api';
import { generateRecipeData } from '../../utils/test-data';

test.describe('Core: Cooking Mode - Start from Home', () => {
  let recipeId: string;
  let recipeData: ReturnType<typeof generateRecipeData>;

  test.beforeEach(async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );

    recipeData = generateRecipeData();
    const recipe = await api.createRecipe(token!, recipeData);
    recipeId = recipe.id;

    // Set up tonight's dinner in the meal plan so "Start Cooking" appears on home page
    const mealPlan = await api.getCurrentMealPlan(token!);
    const today = new Date().toISOString().split('T')[0];
    await api.upsertMealPlanEntry(token!, mealPlan.id, {
      date: today,
      meal_type: 'dinner',
      recipe_id: recipeId,
    });
  });

  test('user clicks Start Cooking on featured recipe and enters cooking mode at step 1', async ({ authenticatedPage }) => {
    // Navigate to home page
    await authenticatedPage.goto('/home');

    // The home page should show a "Tonight's Recipe" section with a Start Cooking button
    const startCookingButton = authenticatedPage.getByRole('button', { name: /start cooking/i });
    await expect(startCookingButton).toBeVisible();

    // Click Start Cooking on the featured recipe
    await startCookingButton.click();

    // Should navigate to the recipe detail page
    await authenticatedPage.waitForURL(/\/recipes\/[\w-]+/);

    // Cooking mode overlay should be open with step 1
    const overlay = authenticatedPage.getByRole('dialog');
    await expect(overlay).toBeVisible();
    await expect(authenticatedPage.getByText(/step 1 of/i)).toBeVisible();

    // The overlay should show the recipe title
    await expect(overlay.getByText(recipeData.title)).toBeVisible();
  });
});

test.describe('Core: Cooking Mode', () => {
  let recipeDetailPage: RecipeDetailPage;
  let recipeId: string;
  let recipeData: ReturnType<typeof generateRecipeData>;

  test.beforeEach(async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );

    recipeData = generateRecipeData();
    const recipe = await api.createRecipe(token!, recipeData);
    recipeId = recipe.id;

    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipeId);
  });

  test('user starts cooking and sees step 1 in overlay', async ({ authenticatedPage }) => {
    await authenticatedPage.getByRole('button', { name: /start cooking/i }).click();

    const overlay = authenticatedPage.getByRole('dialog');

    // Overlay should be visible with step 1 content
    await expect(authenticatedPage.getByText(/step 1 of 3/i)).toBeVisible();
    await expect(overlay.getByText(recipeData.instructions[0].instruction)).toBeVisible();

    // Recipe title should be shown in the overlay
    await expect(overlay.getByText(recipeData.title)).toBeVisible();
  });

  test('user navigates through all steps with Next button', async ({ authenticatedPage }) => {
    await authenticatedPage.getByRole('button', { name: /start cooking/i }).click();
    const overlay = authenticatedPage.getByRole('dialog');

    // Step 1
    await expect(authenticatedPage.getByText(/step 1 of 3/i)).toBeVisible();
    await expect(overlay.getByText(recipeData.instructions[0].instruction)).toBeVisible();

    // Advance to step 2
    await authenticatedPage.getByRole('button', { name: /next/i }).click();
    await expect(authenticatedPage.getByText(/step 2 of 3/i)).toBeVisible();
    await expect(overlay.getByText(recipeData.instructions[1].instruction)).toBeVisible();

    // Advance to step 3 (last)
    await authenticatedPage.getByRole('button', { name: /next/i }).click();
    await expect(authenticatedPage.getByText(/step 3 of 3/i)).toBeVisible();
    await expect(overlay.getByText(recipeData.instructions[2].instruction)).toBeVisible();
  });

  test('user goes back one step with Previous button', async ({ authenticatedPage }) => {
    await authenticatedPage.getByRole('button', { name: /start cooking/i }).click();
    const overlay = authenticatedPage.getByRole('dialog');

    // Go to step 2
    await authenticatedPage.getByRole('button', { name: /next/i }).click();
    await expect(authenticatedPage.getByText(/step 2 of 3/i)).toBeVisible();

    // Go back to step 1
    await authenticatedPage.getByRole('button', { name: /previous/i }).click();
    await expect(authenticatedPage.getByText(/step 1 of 3/i)).toBeVisible();
    await expect(overlay.getByText(recipeData.instructions[0].instruction)).toBeVisible();
  });

  test('Previous button is disabled on step 1', async ({ authenticatedPage }) => {
    await authenticatedPage.getByRole('button', { name: /start cooking/i }).click();

    await expect(authenticatedPage.getByText(/step 1 of 3/i)).toBeVisible();

    const previousButton = authenticatedPage.getByRole('button', { name: /previous/i });
    await expect(previousButton).toBeDisabled();
  });

  test('user closes cooking mode with X button', async ({ authenticatedPage }) => {
    await authenticatedPage.getByRole('button', { name: /start cooking/i }).click();
    await expect(authenticatedPage.getByText(/step 1 of 3/i)).toBeVisible();

    // Close via X button
    await authenticatedPage.getByRole('button', { name: /close/i }).click();

    // Overlay should be gone, recipe detail page visible
    await expect(authenticatedPage.getByText(/step 1 of 3/i)).not.toBeVisible();
    await expect(recipeDetailPage.recipeTitle).toBeVisible();
  });

  test('user closes cooking mode with Escape key', async ({ authenticatedPage }) => {
    await authenticatedPage.getByRole('button', { name: /start cooking/i }).click();
    await expect(authenticatedPage.getByText(/step 1 of 3/i)).toBeVisible();

    await authenticatedPage.keyboard.press('Escape');

    await expect(authenticatedPage.getByText(/step 1 of 3/i)).not.toBeVisible();
    await expect(recipeDetailPage.recipeTitle).toBeVisible();
  });

  test('user reopens cooking mode and resumes where they left off', async ({ authenticatedPage }) => {
    await authenticatedPage.getByRole('button', { name: /start cooking/i }).click();

    // Navigate to step 2
    await authenticatedPage.getByRole('button', { name: /next/i }).click();
    await expect(authenticatedPage.getByText(/step 2 of 3/i)).toBeVisible();

    // Close
    await authenticatedPage.keyboard.press('Escape');
    await expect(authenticatedPage.getByText(/step 2 of 3/i)).not.toBeVisible();

    // Reopen -- should resume at step 2
    await authenticatedPage.getByRole('button', { name: /start cooking/i }).click();
    const overlay = authenticatedPage.getByRole('dialog');
    await expect(authenticatedPage.getByText(/step 2 of 3/i)).toBeVisible();
    await expect(overlay.getByText(recipeData.instructions[1].instruction)).toBeVisible();
  });

  test('user clicks Start Over to return to step 1', async ({ authenticatedPage }) => {
    await authenticatedPage.getByRole('button', { name: /start cooking/i }).click();

    // Navigate to step 3
    await authenticatedPage.getByRole('button', { name: /next/i }).click();
    await authenticatedPage.getByRole('button', { name: /next/i }).click();
    await expect(authenticatedPage.getByText(/step 3 of 3/i)).toBeVisible();

    // Start over
    await authenticatedPage.getByRole('button', { name: /start over/i }).click();
    const overlay = authenticatedPage.getByRole('dialog');
    await expect(authenticatedPage.getByText(/step 1 of 3/i)).toBeVisible();
    await expect(overlay.getByText(recipeData.instructions[0].instruction)).toBeVisible();
  });
});

test.describe('Core: Cooking Mode - Step Menu & Completion', () => {
  let recipeDetailPage: RecipeDetailPage;
  let recipeId: string;
  let recipeData: ReturnType<typeof generateRecipeData>;

  test.beforeEach(async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );

    recipeData = generateRecipeData();
    const recipe = await api.createRecipe(token!, recipeData);
    recipeId = recipe.id;

    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    await recipeDetailPage.goto(recipeId);
  });

  test('user opens step menu and sees all steps listed', async ({ authenticatedPage }) => {
    await authenticatedPage.getByRole('button', { name: /start cooking/i }).click();
    await expect(authenticatedPage.getByText(/step 1 of 3/i)).toBeVisible();

    // Open step menu
    await authenticatedPage.getByRole('button', { name: /steps/i }).click();

    // All 3 steps should be listed
    const stepList = authenticatedPage.getByRole('list', { name: /steps/i });
    await expect(stepList).toBeVisible();
    await expect(stepList.getByRole('listitem')).toHaveCount(3);
    await expect(stepList.getByText(/step 1/i)).toBeVisible();
    await expect(stepList.getByText(/step 2/i)).toBeVisible();
    await expect(stepList.getByText(/step 3/i)).toBeVisible();
  });

  test('user jumps to step 3 via step menu', async ({ authenticatedPage }) => {
    await authenticatedPage.getByRole('button', { name: /start cooking/i }).click();
    await expect(authenticatedPage.getByText(/step 1 of 3/i)).toBeVisible();

    // Open menu and tap Step 3
    await authenticatedPage.getByRole('button', { name: /steps/i }).click();
    const stepList = authenticatedPage.getByRole('list', { name: /steps/i });
    await expect(stepList).toBeVisible();

    await stepList.getByText(/step 3/i).click();

    // Overlay should now show step 3, menu should be closed
    const overlay = authenticatedPage.getByRole('dialog');
    await expect(authenticatedPage.getByText(/step 3 of 3/i)).toBeVisible();
    await expect(overlay.getByText(recipeData.instructions[2].instruction)).toBeVisible();
    await expect(stepList).not.toBeVisible();
  });

  test('last step shows Finish button instead of Next', async ({ authenticatedPage }) => {
    await authenticatedPage.getByRole('button', { name: /start cooking/i }).click();

    // Navigate to last step
    await authenticatedPage.getByRole('button', { name: /next/i }).click();
    await authenticatedPage.getByRole('button', { name: /next/i }).click();
    await expect(authenticatedPage.getByText(/step 3 of 3/i)).toBeVisible();

    // "Next" should not exist; "Finish" should be present
    await expect(authenticatedPage.getByRole('button', { name: /^next$/i })).not.toBeVisible();
    await expect(authenticatedPage.getByRole('button', { name: /finish/i })).toBeVisible();
  });

  test('user finishes cooking and sees completion screen', async ({ authenticatedPage }) => {
    await authenticatedPage.getByRole('button', { name: /start cooking/i }).click();

    // Navigate to last step and click Finish
    await authenticatedPage.getByRole('button', { name: /next/i }).click();
    await authenticatedPage.getByRole('button', { name: /next/i }).click();
    await expect(authenticatedPage.getByText(/step 3 of 3/i)).toBeVisible();

    await authenticatedPage.getByRole('button', { name: /finish/i }).click();

    // Completion screen should appear
    const overlay = authenticatedPage.getByRole('dialog');
    await expect(overlay.getByRole('heading', { name: /nice work/i })).toBeVisible();
    await expect(overlay.getByText(recipeData.title)).toBeVisible();
  });

  test('user rates recipe, adds notes, and closes completion screen', async ({ authenticatedPage }) => {
    await authenticatedPage.getByRole('button', { name: /start cooking/i }).click();

    // Navigate to last step and finish
    await authenticatedPage.getByRole('button', { name: /next/i }).click();
    await authenticatedPage.getByRole('button', { name: /next/i }).click();
    await authenticatedPage.getByRole('button', { name: /finish/i }).click();

    const overlay = authenticatedPage.getByRole('dialog');
    await expect(overlay.getByRole('heading', { name: /nice work/i })).toBeVisible();

    // Tap star rating (4 stars)
    await overlay.getByRole('button', { name: /4 stars/i }).click();

    // Type notes
    await overlay.getByRole('textbox', { name: /notes/i }).fill('Came out great, will make again!');

    // Click Done
    await overlay.getByRole('button', { name: /done/i }).click();

    // Overlay should close, back to recipe detail
    await expect(overlay).not.toBeVisible();
    await expect(recipeDetailPage.recipeTitle).toBeVisible();
  });
});
