/**
 * Core Tier: Navigate Between Weeks
 *
 * Covers: previous/next week arrows, Today button,
 * date range label format, data loading per week
 */

import { test, expect } from '../../fixtures/auth.fixture';
import { MealPlanPage } from '../../pages/meal-plan.page';

/**
 * Returns the Monday and Sunday of the week containing the given date,
 * formatted as "Mon DD - Sun DD" (e.g. "Jan 27 - Feb 02").
 */
function expectedDateRange(referenceDate: Date): string {
  const d = new Date(referenceDate);
  const dayOfWeek = d.getDay(); // 0=Sun, 1=Mon, ...
  const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMon);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (date: Date) => {
    const mon = date.toLocaleDateString('en-US', { month: 'short' });
    const day = String(date.getDate()).padStart(2, '0');
    return `${mon} ${day}`;
  };

  return `${fmt(monday)} - ${fmt(sunday)}`;
}

function offsetWeek(weeks: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

test.describe('Core: Navigate Between Weeks', () => {
  test('user sees week navigation controls on the meal plan page', async ({
    authenticatedPage,
  }) => {
    const mealPlan = new MealPlanPage(authenticatedPage);
    await mealPlan.goto();

    await expect(mealPlan.prevWeekButton).toBeVisible();
    await expect(mealPlan.nextWeekButton).toBeVisible();
    await expect(mealPlan.todayButton).toBeVisible();
    await expect(mealPlan.dateRangeLabel).toBeVisible();
  });

  test('date range label shows current week in "Mon DD - Sun DD" format', async ({
    authenticatedPage,
  }) => {
    const mealPlan = new MealPlanPage(authenticatedPage);
    await mealPlan.goto();

    const expected = expectedDateRange(new Date());
    await expect(mealPlan.dateRangeLabel).toHaveText(expected);
  });

  test('user clicks next arrow and sees the following week dates', async ({
    authenticatedPage,
  }) => {
    const mealPlan = new MealPlanPage(authenticatedPage);
    await mealPlan.goto();

    await mealPlan.nextWeekButton.click();

    const expected = expectedDateRange(offsetWeek(1));
    await expect(mealPlan.dateRangeLabel).toHaveText(expected);
  });

  test('user clicks prev arrow and sees the previous week dates', async ({
    authenticatedPage,
  }) => {
    const mealPlan = new MealPlanPage(authenticatedPage);
    await mealPlan.goto();

    await mealPlan.prevWeekButton.click();

    const expected = expectedDateRange(offsetWeek(-1));
    await expect(mealPlan.dateRangeLabel).toHaveText(expected);
  });

  test('user navigates away and clicks Today to return to current week', async ({
    authenticatedPage,
  }) => {
    const mealPlan = new MealPlanPage(authenticatedPage);
    await mealPlan.goto();

    // Navigate two weeks forward
    await mealPlan.nextWeekButton.click();
    await mealPlan.nextWeekButton.click();

    const futureRange = expectedDateRange(offsetWeek(2));
    await expect(mealPlan.dateRangeLabel).toHaveText(futureRange);

    // Click Today to return
    await mealPlan.todayButton.click();

    const currentRange = expectedDateRange(new Date());
    await expect(mealPlan.dateRangeLabel).toHaveText(currentRange);
  });

  test('today column highlight is absent when viewing a non-current week', async ({
    authenticatedPage,
  }) => {
    const mealPlan = new MealPlanPage(authenticatedPage);
    await mealPlan.goto();

    // Confirm today column exists for current week
    await expect(mealPlan.todayColumn).toBeVisible();

    // Navigate to next week
    await mealPlan.nextWeekButton.click();

    // Today highlight should not appear on a different week
    await expect(mealPlan.todayColumn).toBeHidden();
  });

  test('meal plan data loads for the navigated week', async ({
    authenticatedPage,
  }) => {
    const mealPlan = new MealPlanPage(authenticatedPage);
    await mealPlan.goto();

    // Navigate to next week and verify the grid still renders 7 days
    await mealPlan.nextWeekButton.click();

    await expect(mealPlan.calendarGrid).toBeVisible();
    await expect(mealPlan.dayColumns).toHaveCount(7);
  });
});
