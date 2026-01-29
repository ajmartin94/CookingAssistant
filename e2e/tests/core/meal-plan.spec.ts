/**
 * Core Tier: Meal Plan Page
 *
 * Covers: 7-day calendar grid display, meal slot labels,
 * today highlight, empty slot placeholders
 */

import { test, expect } from '../../fixtures/auth.fixture';
import { MealPlanPage } from '../../pages/meal-plan.page';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

test.describe('Core: Meal Plan Calendar Grid', () => {
  test('user sees a 7-day calendar grid when navigating to /planning', async ({
    authenticatedPage,
  }) => {
    const mealPlan = new MealPlanPage(authenticatedPage);
    await mealPlan.goto();

    await expect(mealPlan.calendarGrid).toBeVisible();
    await expect(mealPlan.dayColumns).toHaveCount(7);

    for (const day of WEEKDAYS) {
      await expect(mealPlan.getDayColumn(day)).toBeVisible();
    }
  });

  test('each day shows Breakfast, Lunch, and Dinner meal slots', async ({
    authenticatedPage,
  }) => {
    const mealPlan = new MealPlanPage(authenticatedPage);
    await mealPlan.goto();

    for (const day of WEEKDAYS) {
      await expect(mealPlan.getMealSlots(day)).toHaveCount(3);

      for (const meal of ['Breakfast', 'Lunch', 'Dinner'] as const) {
        await expect(
          mealPlan.getDayColumn(day).getByText(meal)
        ).toBeVisible();
      }
    }
  });

  test('today column is visually distinct from other days', async ({
    authenticatedPage,
  }) => {
    const mealPlan = new MealPlanPage(authenticatedPage);
    await mealPlan.goto();

    // Exactly one column should be marked as today
    await expect(mealPlan.todayColumn).toBeVisible();
    await expect(mealPlan.todayColumn).toHaveCount(1);
  });

  test('empty meal slots show "+ Add" placeholder text', async ({
    authenticatedPage,
  }) => {
    const mealPlan = new MealPlanPage(authenticatedPage);
    await mealPlan.goto();

    // Check the first day has add placeholders in all three slots
    const firstDay = WEEKDAYS[0];
    for (const meal of ['Breakfast', 'Lunch', 'Dinner'] as const) {
      await expect(mealPlan.getAddButton(firstDay, meal)).toBeVisible();
    }
  });
});
