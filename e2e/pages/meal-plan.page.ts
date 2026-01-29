import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class MealPlanPage extends BasePage {
  readonly calendarGrid: Locator;
  readonly dayColumns: Locator;
  readonly todayColumn: Locator;

  // Week navigation locators
  readonly prevWeekButton: Locator;
  readonly nextWeekButton: Locator;
  readonly todayButton: Locator;
  readonly dateRangeLabel: Locator;

  // Recipe picker modal locators
  readonly recipePickerModal: Locator;
  readonly recipePickerSearchInput: Locator;
  readonly recipePickerList: Locator;
  readonly recipePickerItems: Locator;

  constructor(page: Page) {
    super(page);
    this.calendarGrid = page.getByTestId('meal-plan-calendar');
    this.dayColumns = page.getByTestId('day-column');
    this.todayColumn = page.getByTestId('day-column-today');

    // Week navigation
    this.prevWeekButton = page.getByRole('button', { name: /previous week/i });
    this.nextWeekButton = page.getByRole('button', { name: /next week/i });
    this.todayButton = page.getByRole('button', { name: /today/i });
    this.dateRangeLabel = page.getByTestId('week-date-range');

    // Recipe picker modal
    this.recipePickerModal = page.getByTestId('recipe-picker-modal');
    this.recipePickerSearchInput = this.recipePickerModal.getByRole('textbox', { name: /search/i });
    this.recipePickerList = this.recipePickerModal.getByTestId('recipe-picker-list');
    this.recipePickerItems = this.recipePickerList.getByTestId('recipe-picker-item');
  }

  async goto() {
    await super.goto('/planning');
  }

  getDayColumn(dayName: string): Locator {
    return this.calendarGrid.locator(`[data-testid="day-column"]`, {
      has: this.page.getByText(dayName, { exact: false }),
    });
  }

  getMealSlots(dayName: string): Locator {
    return this.getDayColumn(dayName).getByTestId('meal-slot');
  }

  getAddButton(dayName: string, meal: 'Breakfast' | 'Lunch' | 'Dinner'): Locator {
    return this.getDayColumn(dayName)
      .locator('[data-testid="meal-slot"]', {
        has: this.page.getByText(meal),
      })
      .getByText(/\+\s*Add/i);
  }

  getMealSlot(dayName: string, meal: 'Breakfast' | 'Lunch' | 'Dinner'): Locator {
    return this.getDayColumn(dayName)
      .locator('[data-testid="meal-slot"]', {
        has: this.page.getByText(meal),
      });
  }

  getFilledSlotRecipeName(dayName: string, meal: 'Breakfast' | 'Lunch' | 'Dinner'): Locator {
    return this.getMealSlot(dayName, meal).getByTestId('slot-recipe-name');
  }

  getRecipePickerItem(recipeName: string): Locator {
    return this.recipePickerItems.filter({ hasText: recipeName });
  }

  getRemoveButton(dayName: string, meal: 'Breakfast' | 'Lunch' | 'Dinner'): Locator {
    return this.getMealSlot(dayName, meal).getByRole('button', { name: /remove/i });
  }

  getChangeButton(dayName: string, meal: 'Breakfast' | 'Lunch' | 'Dinner'): Locator {
    return this.getMealSlot(dayName, meal).getByRole('button', { name: /change/i });
  }
}
