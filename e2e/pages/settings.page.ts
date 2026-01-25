import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class SettingsPage extends BasePage {
  readonly dietaryRestrictions: {
    vegetarian: Locator;
    vegan: Locator;
    glutenFree: Locator;
    dairyFree: Locator;
    keto: Locator;
    paleo: Locator;
    lowCarb: Locator;
    nutFree: Locator;
    soyFree: Locator;
  };
  readonly skillLevelSelect: Locator;
  readonly defaultServingsInput: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);

    this.dietaryRestrictions = {
      vegetarian: page.getByRole('checkbox', { name: /vegetarian/i }),
      vegan: page.getByRole('checkbox', { name: /vegan/i }),
      glutenFree: page.getByRole('checkbox', { name: /gluten-free/i }),
      dairyFree: page.getByRole('checkbox', { name: /dairy-free/i }),
      keto: page.getByRole('checkbox', { name: /keto/i }),
      paleo: page.getByRole('checkbox', { name: /paleo/i }),
      lowCarb: page.getByRole('checkbox', { name: /low-carb/i }),
      nutFree: page.getByRole('checkbox', { name: /nut-free/i }),
      soyFree: page.getByRole('checkbox', { name: /soy-free/i }),
    };

    this.skillLevelSelect = page.getByRole('combobox', { name: /skill level/i });
    this.defaultServingsInput = page.getByRole('spinbutton', { name: /default servings/i });
    this.saveButton = page.getByRole('button', { name: /save/i });
  }

  async goto() {
    await super.goto('/settings');
  }

  async selectDietaryRestrictions(restrictions: string[]) {
    for (const restriction of restrictions) {
      const key = restriction
        .replace(/-([a-z])/g, (_, c) => c.toUpperCase())
        .replace(/\s+/g, '') as keyof typeof this.dietaryRestrictions;
      const checkbox = this.dietaryRestrictions[key];
      if (checkbox) {
        await checkbox.check();
      }
    }
  }

  async setSkillLevel(level: 'beginner' | 'intermediate' | 'advanced') {
    await this.skillLevelSelect.selectOption(level);
  }

  async setDefaultServings(servings: number) {
    await this.defaultServingsInput.clear();
    await this.defaultServingsInput.fill(servings.toString());
  }

  async save() {
    await this.saveButton.click();
  }
}
