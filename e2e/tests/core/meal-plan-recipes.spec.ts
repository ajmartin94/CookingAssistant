/**
 * Core Tier: Assign and Remove Recipes from Meal Slots
 *
 * Covers: recipe picker modal, search filtering, assigning recipes
 * to slots, changing assigned recipes, removing recipes from slots
 */

import { test, expect } from '../../fixtures/auth.fixture';
import { MealPlanPage } from '../../pages/meal-plan.page';
import { APIHelper } from '../../utils/api';
import { generateRecipeData } from '../../utils/test-data';

const FIRST_DAY = 'Mon';

test.describe('Core: Assign and Remove Recipes from Meal Slots', () => {
  let token: string;
  let recipeName: string;

  test.beforeEach(async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    token = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    ) as string;

    // Create a recipe via API so the picker has something to show
    const recipeData = generateRecipeData({ title: `Pancakes ${Date.now()}` });
    recipeName = recipeData.title;
    await api.createRecipe(token, recipeData);
  });

  test('user clicks empty slot and sees recipe picker modal', async ({
    authenticatedPage,
  }) => {
    const mealPlan = new MealPlanPage(authenticatedPage);
    await mealPlan.goto();

    // Click the "+ Add" button on Monday Breakfast
    await mealPlan.getAddButton(FIRST_DAY, 'Breakfast').click();

    // Recipe picker modal should appear
    await expect(mealPlan.recipePickerModal).toBeVisible();
    await expect(mealPlan.recipePickerSearchInput).toBeVisible();
    await expect(mealPlan.recipePickerItems).toHaveCount(1, { timeout: 5000 });
  });

  test('user searches and filters the recipe list in the picker', async ({
    authenticatedPage,
    request,
  }) => {
    const api = new APIHelper(request);
    // Create a second recipe with a different name
    const secondRecipe = generateRecipeData({ title: `Spaghetti ${Date.now()}` });
    await api.createRecipe(token, secondRecipe);

    const mealPlan = new MealPlanPage(authenticatedPage);
    await mealPlan.goto();

    await mealPlan.getAddButton(FIRST_DAY, 'Breakfast').click();
    await expect(mealPlan.recipePickerModal).toBeVisible();

    // Both recipes should be listed initially
    await expect(mealPlan.recipePickerItems).toHaveCount(2, { timeout: 5000 });

    // Type a search term that matches only one recipe
    await mealPlan.recipePickerSearchInput.fill('Pancakes');

    // Only the matching recipe should remain
    await expect(mealPlan.recipePickerItems).toHaveCount(1);
    await expect(mealPlan.getRecipePickerItem('Pancakes')).toBeVisible();
  });

  test('user selects a recipe and the slot shows the recipe name', async ({
    authenticatedPage,
  }) => {
    const mealPlan = new MealPlanPage(authenticatedPage);
    await mealPlan.goto();

    // Open picker for Monday Breakfast
    await mealPlan.getAddButton(FIRST_DAY, 'Breakfast').click();
    await expect(mealPlan.recipePickerModal).toBeVisible();

    // Select the recipe
    await mealPlan.getRecipePickerItem(recipeName).click();

    // Modal should close
    await expect(mealPlan.recipePickerModal).toBeHidden();

    // Slot should now display the recipe name
    await expect(
      mealPlan.getFilledSlotRecipeName(FIRST_DAY, 'Breakfast')
    ).toHaveText(recipeName);

    // The "+ Add" button should no longer be visible for this slot
    await expect(mealPlan.getAddButton(FIRST_DAY, 'Breakfast')).toBeHidden();
  });

  test('user clicks a filled slot and can change the recipe', async ({
    authenticatedPage,
    request,
  }) => {
    const api = new APIHelper(request);
    const secondRecipe = generateRecipeData({ title: `Waffles ${Date.now()}` });
    const secondName = secondRecipe.title;
    await api.createRecipe(token, secondRecipe);

    const mealPlan = new MealPlanPage(authenticatedPage);
    await mealPlan.goto();

    // Assign first recipe to Monday Breakfast
    await mealPlan.getAddButton(FIRST_DAY, 'Breakfast').click();
    await expect(mealPlan.recipePickerModal).toBeVisible();
    await mealPlan.getRecipePickerItem(recipeName).click();
    await expect(mealPlan.recipePickerModal).toBeHidden();

    // Click the filled slot to change recipe
    await mealPlan.getChangeButton(FIRST_DAY, 'Breakfast').click();
    await expect(mealPlan.recipePickerModal).toBeVisible();

    // Select the second recipe
    await mealPlan.getRecipePickerItem(secondName).click();
    await expect(mealPlan.recipePickerModal).toBeHidden();

    // Slot should now show the second recipe
    await expect(
      mealPlan.getFilledSlotRecipeName(FIRST_DAY, 'Breakfast')
    ).toHaveText(secondName);
  });

  test('user removes a recipe and the slot returns to empty state', async ({
    authenticatedPage,
  }) => {
    const mealPlan = new MealPlanPage(authenticatedPage);
    await mealPlan.goto();

    // Assign recipe to Monday Breakfast
    await mealPlan.getAddButton(FIRST_DAY, 'Breakfast').click();
    await expect(mealPlan.recipePickerModal).toBeVisible();
    await mealPlan.getRecipePickerItem(recipeName).click();
    await expect(mealPlan.recipePickerModal).toBeHidden();

    // Verify recipe is assigned
    await expect(
      mealPlan.getFilledSlotRecipeName(FIRST_DAY, 'Breakfast')
    ).toHaveText(recipeName);

    // Remove the recipe
    await mealPlan.getRemoveButton(FIRST_DAY, 'Breakfast').click();

    // Slot should return to empty state with "+ Add" button
    await expect(mealPlan.getAddButton(FIRST_DAY, 'Breakfast')).toBeVisible();
    await expect(
      mealPlan.getFilledSlotRecipeName(FIRST_DAY, 'Breakfast')
    ).toBeHidden();
  });
});
