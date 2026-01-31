/**
 * Core Tier: Shopping List Generation from Meal Plan
 *
 * Covers: generate from populated meal plan, duplicate list prompt, empty meal plan message
 */

import { test, expect } from '../../fixtures/auth.fixture';
import { APIHelper } from '../../utils/api';

/**
 * Helper: get a Monday-based week_start_date for the current week.
 */
function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().split('T')[0];
}

test.describe('Core: Generate Shopping List from Meal Plan', () => {
  let api: APIHelper;
  let token: string;

  test.beforeEach(async ({ authenticatedPage, request }) => {
    api = new APIHelper(request);
    token = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    ) as string;
  });

  test('user generates a shopping list from a populated meal plan', async ({
    authenticatedPage,
    request,
  }) => {
    const weekStart = getCurrentWeekStart();

    // Setup: create a recipe with ingredients via API
    const recipe = await api.createRecipe(token, {
      title: 'Pasta Carbonara',
      description: 'Classic Italian pasta',
      ingredients: [
        { name: 'Spaghetti', amount: '400', unit: 'g' },
        { name: 'Eggs', amount: '4', unit: '' },
        { name: 'Parmesan', amount: '100', unit: 'g' },
        { name: 'Pancetta', amount: '200', unit: 'g' },
      ],
      instructions: [{ step_number: 1, instruction: 'Cook pasta' }],
      servings: 4,
    });

    // Setup: add recipe to meal plan for this week
    const mealPlan = await api.getCurrentMealPlan(token);
    await api.upsertMealPlanEntry(token, mealPlan.id, {
      date: weekStart,
      meal_type: 'dinner',
      recipe_id: recipe.id,
    });

    // Navigate to shopping page
    await authenticatedPage.goto('/shopping');

    // Click the generate button
    await authenticatedPage
      .getByRole('button', { name: /generate from meal plan/i })
      .click();

    // The week navigation panel should appear with a date range
    await expect(
      authenticatedPage.getByTestId('week-date-range')
    ).toBeVisible();

    // Confirm generation and wait for API response
    const generateResponse = authenticatedPage.waitForResponse(
      (resp) =>
        resp.url().includes('/api/v1/shopping-lists/generate') &&
        resp.request().method() === 'POST' &&
        resp.status() === 201
    );
    await authenticatedPage
      .getByRole('button', { name: /^generate$/i })
      .click();
    await generateResponse;

    // After generation, the detail view shows items (consolidated by LLM or raw fallback)
    // LLM may rename ingredients, so verify items exist by checking the progress counter
    await expect(authenticatedPage.getByText(/\d+.*items? checked/i)).toBeVisible({ timeout: 10000 });
    // Verify at least one item with a checkbox is rendered
    await expect(authenticatedPage.getByRole('checkbox').first()).toBeVisible();
  });

  test('user sees confirmation prompt when generating for a week that already has a list', async ({
    authenticatedPage,
    request,
  }) => {
    const weekStart = getCurrentWeekStart();

    // Setup: create a recipe and add to meal plan
    const recipe = await api.createRecipe(token, {
      title: 'Simple Salad',
      description: 'Quick salad',
      ingredients: [
        { name: 'Lettuce', amount: '1', unit: 'head' },
        { name: 'Tomato', amount: '2', unit: '' },
      ],
      instructions: [{ step_number: 1, instruction: 'Chop and mix' }],
      servings: 2,
    });

    const mealPlan = await api.getCurrentMealPlan(token);
    await api.upsertMealPlanEntry(token, mealPlan.id, {
      date: weekStart,
      meal_type: 'lunch',
      recipe_id: recipe.id,
    });

    // Setup: generate a shopping list for this week first, so a duplicate exists
    await api.generateShoppingList(token, weekStart);

    // Navigate to shopping page
    await authenticatedPage.goto('/shopping');

    // Click generate
    await authenticatedPage
      .getByRole('button', { name: /generate from meal plan/i })
      .click();

    // Trigger generation for the same week
    await authenticatedPage
      .getByRole('button', { name: /^generate$/i })
      .click();

    // Confirmation dialog should appear
    await expect(
      authenticatedPage.getByText(/already exists/i)
    ).toBeVisible();
    await expect(
      authenticatedPage.getByRole('button', { name: /replace/i })
    ).toBeVisible();
    await expect(
      authenticatedPage.getByRole('button', { name: /cancel/i })
    ).toBeVisible();
  });

  test('user sees helpful message when generating from empty meal plan', async ({
    authenticatedPage,
  }) => {
    // Navigate to shopping page (meal plan for this week has no recipes)
    await authenticatedPage.goto('/shopping');

    // Click generate
    await authenticatedPage
      .getByRole('button', { name: /generate from meal plan/i })
      .click();

    // Trigger generation
    await authenticatedPage
      .getByRole('button', { name: /^generate$/i })
      .click();

    // Should see helpful empty state message
    // Backend returns: "Meal plan has no recipes with ingredients for this week."
    await expect(
      authenticatedPage.getByText(/no recipes/i)
    ).toBeVisible();
  });
});
