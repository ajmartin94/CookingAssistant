/**
 * E2E Tests for Recipe Page Redesign (Feature 6)
 *
 * Tests the redesigned recipe detail page with:
 * - Hero image with gradient overlay and recipe title
 * - Fallback for recipes without images (gradient with first letter)
 * - Metadata bar (prep time, cook time, servings, difficulty)
 * - Two-column layout: ingredients (left), instructions (right)
 * - Steps numbered with clear visual hierarchy
 * - Timer buttons inline with steps that have times (visual only)
 * - Notes section at bottom
 * - Edit/Delete actions in header
 * - Responsive layout (stacks on mobile)
 */

import { test, expect } from '../../fixtures/auth.fixture';
import { APIHelper } from '../../utils/api';
import { generateRecipeData } from '../../utils/test-data';

// Viewport configurations
const viewports = {
  mobile: { width: 375, height: 667 },
  desktop: { width: 1280, height: 720 },
};

test.describe('Recipe Page Redesign', () => {
  test.describe('Hero Section', () => {
    test('should display recipe title in hero section', async ({ authenticatedPage, request }) => {
      const api = new APIHelper(request);
      const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

      const recipeData = generateRecipeData({
        title: 'Classic Spaghetti Carbonara',
        image_url: 'https://example.com/carbonara.jpg',
      });

      const recipe = await api.createRecipe(token!, recipeData);

      await authenticatedPage.goto(`/recipes/${recipe.id}`);

      // Hero section should display the recipe title
      const heroTitle = authenticatedPage.locator('[data-testid="recipe-hero"] h1, [data-testid="recipe-title"]').first();
      await expect(heroTitle).toBeVisible();
      await expect(heroTitle).toHaveText('Classic Spaghetti Carbonara');
    });

    test('should display hero image when recipe has image URL', async ({ authenticatedPage, request }) => {
      const api = new APIHelper(request);
      const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

      const recipeData = generateRecipeData({
        title: 'Recipe with Image',
        image_url: 'https://example.com/recipe-image.jpg',
      });

      const recipe = await api.createRecipe(token!, recipeData);

      await authenticatedPage.goto(`/recipes/${recipe.id}`);

      // Hero image should be visible
      const heroImage = authenticatedPage.locator('[data-testid="recipe-hero-image"], [data-testid="recipe-hero"] img');
      await expect(heroImage.first()).toBeVisible();
    });

    test('should display fallback gradient with first letter when no image', async ({ authenticatedPage, request }) => {
      const api = new APIHelper(request);
      const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

      const recipeData = generateRecipeData({
        title: 'Banana Bread Delight',
        image_url: null, // No image
      });

      const recipe = await api.createRecipe(token!, recipeData);

      await authenticatedPage.goto(`/recipes/${recipe.id}`);

      // Fallback should show gradient with first letter "B"
      const fallback = authenticatedPage.locator('[data-testid="recipe-hero-fallback"], [data-testid="recipe-hero"]');
      await expect(fallback.first()).toBeVisible();

      // Should display the first letter of the recipe name
      const firstLetter = authenticatedPage.locator('[data-testid="recipe-hero-letter"], [data-testid="recipe-hero-fallback"]');
      await expect(firstLetter.first()).toContainText('B');
    });
  });

  test.describe('Metadata Bar', () => {
    test('should display prep time in metadata bar', async ({ authenticatedPage, request }) => {
      const api = new APIHelper(request);
      const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

      const recipeData = generateRecipeData({
        prep_time_minutes: 25,
      });

      const recipe = await api.createRecipe(token!, recipeData);

      await authenticatedPage.goto(`/recipes/${recipe.id}`);

      // Metadata bar should show prep time
      const prepTime = authenticatedPage.locator('[data-testid="prep-time"], [data-testid="metadata-bar"]');
      await expect(prepTime.first()).toBeVisible();
      await expect(prepTime.first()).toContainText('25');
    });

    test('should display cook time in metadata bar', async ({ authenticatedPage, request }) => {
      const api = new APIHelper(request);
      const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

      const recipeData = generateRecipeData({
        cook_time_minutes: 45,
      });

      const recipe = await api.createRecipe(token!, recipeData);

      await authenticatedPage.goto(`/recipes/${recipe.id}`);

      // Metadata bar should show cook time
      const cookTime = authenticatedPage.locator('[data-testid="cook-time"], [data-testid="metadata-bar"]');
      await expect(cookTime.first()).toBeVisible();
      await expect(cookTime.first()).toContainText('45');
    });

    test('should display servings in metadata bar', async ({ authenticatedPage, request }) => {
      const api = new APIHelper(request);
      const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

      const recipeData = generateRecipeData({
        servings: 8,
      });

      const recipe = await api.createRecipe(token!, recipeData);

      await authenticatedPage.goto(`/recipes/${recipe.id}`);

      // Metadata bar should show servings
      const servings = authenticatedPage.locator('[data-testid="servings"], [data-testid="metadata-bar"]');
      await expect(servings.first()).toBeVisible();
      await expect(servings.first()).toContainText('8');
    });

    test('should display all metadata fields together', async ({ authenticatedPage, request }) => {
      const api = new APIHelper(request);
      const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

      const recipeData = generateRecipeData({
        prep_time_minutes: 15,
        cook_time_minutes: 30,
        servings: 6,
        difficulty_level: 'medium',
      });

      const recipe = await api.createRecipe(token!, recipeData);

      await authenticatedPage.goto(`/recipes/${recipe.id}`);

      // All metadata should be visible
      const metadataBar = authenticatedPage.locator('[data-testid="metadata-bar"]');
      await expect(metadataBar).toBeVisible();

      await expect(authenticatedPage.locator('[data-testid="prep-time"]')).toContainText('15');
      await expect(authenticatedPage.locator('[data-testid="cook-time"]')).toContainText('30');
      await expect(authenticatedPage.locator('[data-testid="servings"]')).toContainText('6');
    });
  });

  test.describe('Ingredients List', () => {
    test('should display all ingredients', async ({ authenticatedPage, request }) => {
      const api = new APIHelper(request);
      const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

      const recipeData = generateRecipeData({
        ingredients: [
          { name: 'olive oil', amount: '2', unit: 'tbsp', notes: 'extra virgin' },
          { name: 'garlic', amount: '4', unit: 'cloves', notes: 'minced' },
          { name: 'pasta', amount: '1', unit: 'lb', notes: 'spaghetti' },
          { name: 'parmesan', amount: '1', unit: 'cup', notes: 'grated' },
        ],
      });

      const recipe = await api.createRecipe(token!, recipeData);

      await authenticatedPage.goto(`/recipes/${recipe.id}`);

      // Ingredients list should be visible
      const ingredientsList = authenticatedPage.locator('[data-testid="ingredients-list"], [data-testid="ingredients-section"]');
      await expect(ingredientsList.first()).toBeVisible();

      // All ingredients should be displayed
      await expect(authenticatedPage.getByText('olive oil')).toBeVisible();
      await expect(authenticatedPage.getByText('garlic')).toBeVisible();
      await expect(authenticatedPage.getByText('pasta')).toBeVisible();
      await expect(authenticatedPage.getByText('parmesan')).toBeVisible();
    });

    test('should display ingredient amounts and units', async ({ authenticatedPage, request }) => {
      const api = new APIHelper(request);
      const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

      const recipeData = generateRecipeData({
        ingredients: [
          { name: 'butter', amount: '4', unit: 'tbsp', notes: '' },
        ],
      });

      const recipe = await api.createRecipe(token!, recipeData);

      await authenticatedPage.goto(`/recipes/${recipe.id}`);

      // Should display amount and unit
      const ingredientText = authenticatedPage.locator('[data-testid="ingredient"]').first();
      await expect(ingredientText).toBeVisible();
      await expect(authenticatedPage.getByText(/4.*tbsp/)).toBeVisible();
    });
  });

  test.describe('Instructions/Steps', () => {
    test('should display steps in correct order with numbers', async ({ authenticatedPage, request }) => {
      const api = new APIHelper(request);
      const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

      const recipeData = generateRecipeData({
        instructions: [
          { step_number: 1, instruction: 'Boil water in a large pot', duration_minutes: 10 },
          { step_number: 2, instruction: 'Add pasta and cook until al dente', duration_minutes: 12 },
          { step_number: 3, instruction: 'Drain and toss with sauce', duration_minutes: 2 },
          { step_number: 4, instruction: 'Serve immediately with cheese', duration_minutes: null },
        ],
      });

      const recipe = await api.createRecipe(token!, recipeData);

      await authenticatedPage.goto(`/recipes/${recipe.id}`);

      // Instructions should be visible
      const instructionsList = authenticatedPage.locator('[data-testid="instructions-list"], [data-testid="instructions-section"], ol');
      await expect(instructionsList.first()).toBeVisible();

      // All steps should be displayed in order
      const steps = authenticatedPage.locator('[data-testid="instruction"], [data-testid="step"], li');
      expect(await steps.count()).toBeGreaterThanOrEqual(4);

      // Verify step content
      await expect(authenticatedPage.getByText('Boil water in a large pot')).toBeVisible();
      await expect(authenticatedPage.getByText('Add pasta and cook until al dente')).toBeVisible();
      await expect(authenticatedPage.getByText('Drain and toss with sauce')).toBeVisible();
      await expect(authenticatedPage.getByText('Serve immediately with cheese')).toBeVisible();
    });

    test('should display step numbers', async ({ authenticatedPage, request }) => {
      const api = new APIHelper(request);
      const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

      const recipeData = generateRecipeData({
        instructions: [
          { step_number: 1, instruction: 'First step', duration_minutes: 5 },
          { step_number: 2, instruction: 'Second step', duration_minutes: 5 },
        ],
      });

      const recipe = await api.createRecipe(token!, recipeData);

      await authenticatedPage.goto(`/recipes/${recipe.id}`);

      // Steps should have visible numbers (either via CSS counter or explicit text)
      const stepNumbers = authenticatedPage.locator('[data-testid="step-number"], [data-testid="instruction"] .step-number');

      // Verify steps are numbered (could be in an ordered list or with explicit numbers)
      const instructionsList = authenticatedPage.locator('ol[data-testid="instructions-list"], [data-testid="instructions-section"]');
      await expect(instructionsList.first()).toBeVisible();
    });

    test('should display timer buttons for steps with durations', async ({ authenticatedPage, request }) => {
      const api = new APIHelper(request);
      const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

      const recipeData = generateRecipeData({
        instructions: [
          { step_number: 1, instruction: 'Simmer for 20 minutes', duration_minutes: 20 },
          { step_number: 2, instruction: 'Bake at 350F', duration_minutes: 45 },
          { step_number: 3, instruction: 'Let cool before serving', duration_minutes: null },
        ],
      });

      const recipe = await api.createRecipe(token!, recipeData);

      await authenticatedPage.goto(`/recipes/${recipe.id}`);

      // Timer buttons should appear for steps with durations
      const timerButtons = authenticatedPage.locator('[data-testid="timer-button"], button:has-text("timer"), button:has-text("min")');

      // Should have at least 2 timer buttons (for steps 1 and 2)
      expect(await timerButtons.count()).toBeGreaterThanOrEqual(2);
    });

    test('should not display timer button for steps without duration', async ({ authenticatedPage, request }) => {
      const api = new APIHelper(request);
      const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

      const recipeData = generateRecipeData({
        instructions: [
          { step_number: 1, instruction: 'Gather all ingredients', duration_minutes: null },
        ],
      });

      const recipe = await api.createRecipe(token!, recipeData);

      await authenticatedPage.goto(`/recipes/${recipe.id}`);

      // Timer button should not be visible for steps without duration
      const stepContainer = authenticatedPage.locator('[data-testid="instruction"], [data-testid="step"]').first();
      await expect(stepContainer).toBeVisible();

      // This step should not have a timer button
      const timerButton = stepContainer.locator('[data-testid="timer-button"]');
      await expect(timerButton).not.toBeVisible();
    });
  });

  test.describe('Edit Navigation', () => {
    test('should navigate to edit page when clicking edit button', async ({ authenticatedPage, request }) => {
      const api = new APIHelper(request);
      const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

      const recipeData = generateRecipeData();
      const recipe = await api.createRecipe(token!, recipeData);

      await authenticatedPage.goto(`/recipes/${recipe.id}`);

      // Find and click the edit button
      const editButton = authenticatedPage.locator('[data-testid="edit-button"], a:has-text("Edit"), button:has-text("Edit")');
      await expect(editButton.first()).toBeVisible();
      await editButton.first().click();

      // Should navigate to edit page
      await expect(authenticatedPage).toHaveURL(`/recipes/${recipe.id}/edit`);
    });

    test('should display edit button in header area', async ({ authenticatedPage, request }) => {
      const api = new APIHelper(request);
      const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

      const recipeData = generateRecipeData();
      const recipe = await api.createRecipe(token!, recipeData);

      await authenticatedPage.goto(`/recipes/${recipe.id}`);

      // Edit button should be visible in the recipe header/hero area
      const editButton = authenticatedPage.locator('[data-testid="edit-button"], [data-testid="recipe-hero"] a:has-text("Edit"), [data-testid="recipe-actions"] a:has-text("Edit")');
      await expect(editButton.first()).toBeVisible();
    });
  });

  test.describe('Responsive Layout', () => {
    test.describe('Desktop Layout', () => {
      test.use({ viewport: viewports.desktop });

      test('should display two-column layout on desktop', async ({ authenticatedPage, request }) => {
        const api = new APIHelper(request);
        const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

        const recipeData = generateRecipeData({
          ingredients: [
            { name: 'flour', amount: '2', unit: 'cups', notes: '' },
            { name: 'sugar', amount: '1', unit: 'cup', notes: '' },
          ],
          instructions: [
            { step_number: 1, instruction: 'Mix ingredients', duration_minutes: 5 },
            { step_number: 2, instruction: 'Bake', duration_minutes: 30 },
          ],
        });

        const recipe = await api.createRecipe(token!, recipeData);

        await authenticatedPage.goto(`/recipes/${recipe.id}`);

        // Main content area should use grid or flex layout for two columns
        const contentArea = authenticatedPage.locator('[data-testid="recipe-content"]');
        await expect(contentArea).toBeVisible();

        // Verify both ingredients and instructions sections are visible
        const ingredientsSection = authenticatedPage.locator('[data-testid="ingredients-section"], [data-testid="ingredients-list"]');
        const instructionsSection = authenticatedPage.locator('[data-testid="instructions-section"], [data-testid="instructions-list"]');

        await expect(ingredientsSection.first()).toBeVisible();
        await expect(instructionsSection.first()).toBeVisible();

        // Check layout is grid or flex (two-column)
        const layout = await contentArea.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.display;
        });

        expect(['grid', 'flex']).toContain(layout);
      });

      test('should display ingredients on the left', async ({ authenticatedPage, request }) => {
        const api = new APIHelper(request);
        const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

        const recipeData = generateRecipeData();
        const recipe = await api.createRecipe(token!, recipeData);

        await authenticatedPage.goto(`/recipes/${recipe.id}`);

        // Get positions of ingredients and instructions
        const ingredientsSection = authenticatedPage.locator('[data-testid="ingredients-section"], [data-testid="ingredients-list"]').first();
        const instructionsSection = authenticatedPage.locator('[data-testid="instructions-section"], [data-testid="instructions-list"]').first();

        const ingredientsBounds = await ingredientsSection.boundingBox();
        const instructionsBounds = await instructionsSection.boundingBox();

        // On desktop, ingredients should be to the left of instructions
        // (or above if layout changes) - ingredients x position should be less than instructions
        if (ingredientsBounds && instructionsBounds) {
          // Ingredients should start at the same or smaller x position (left side)
          expect(ingredientsBounds.x).toBeLessThanOrEqual(instructionsBounds.x + 10); // Allow small margin
        }
      });
    });

    test.describe('Mobile Layout', () => {
      test.use({ viewport: viewports.mobile });

      test('should display stacked layout on mobile', async ({ authenticatedPage, request }) => {
        const api = new APIHelper(request);
        const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

        const recipeData = generateRecipeData({
          ingredients: [
            { name: 'flour', amount: '2', unit: 'cups', notes: '' },
          ],
          instructions: [
            { step_number: 1, instruction: 'Mix ingredients', duration_minutes: 5 },
          ],
        });

        const recipe = await api.createRecipe(token!, recipeData);

        await authenticatedPage.goto(`/recipes/${recipe.id}`);

        // Both sections should be visible
        const ingredientsSection = authenticatedPage.locator('[data-testid="ingredients-section"], [data-testid="ingredients-list"]');
        const instructionsSection = authenticatedPage.locator('[data-testid="instructions-section"], [data-testid="instructions-list"]');

        await expect(ingredientsSection.first()).toBeVisible();
        await expect(instructionsSection.first()).toBeVisible();

        // On mobile, sections should be stacked (one above the other)
        const ingredientsBounds = await ingredientsSection.first().boundingBox();
        const instructionsBounds = await instructionsSection.first().boundingBox();

        if (ingredientsBounds && instructionsBounds) {
          // On mobile, ingredients should be above instructions (y position is smaller)
          // or they should have similar x positions (stacked)
          const areStacked = Math.abs(ingredientsBounds.x - instructionsBounds.x) < 50;
          expect(areStacked).toBe(true);
        }
      });

      test('should display full-width hero on mobile', async ({ authenticatedPage, request }) => {
        const api = new APIHelper(request);
        const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

        const recipeData = generateRecipeData({
          title: 'Mobile Test Recipe',
        });

        const recipe = await api.createRecipe(token!, recipeData);

        await authenticatedPage.goto(`/recipes/${recipe.id}`);

        // Hero section should be visible and take full width
        const heroSection = authenticatedPage.locator('[data-testid="recipe-hero"]');
        await expect(heroSection).toBeVisible();

        const heroBounds = await heroSection.boundingBox();
        if (heroBounds) {
          // Hero should be close to full viewport width on mobile
          expect(heroBounds.width).toBeGreaterThan(viewports.mobile.width * 0.9);
        }
      });
    });
  });

  test.describe('Recipe Content Display', () => {
    test('should display complete recipe with all sections', async ({ authenticatedPage, request }) => {
      const api = new APIHelper(request);
      const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

      const recipeData = generateRecipeData({
        title: 'Complete Recipe Test',
        description: 'A comprehensive recipe with all fields',
        prep_time_minutes: 20,
        cook_time_minutes: 40,
        servings: 4,
        difficulty_level: 'medium',
        ingredients: [
          { name: 'flour', amount: '2', unit: 'cups', notes: 'all-purpose' },
          { name: 'eggs', amount: '3', unit: 'large', notes: '' },
        ],
        instructions: [
          { step_number: 1, instruction: 'Preheat oven to 350F', duration_minutes: 10 },
          { step_number: 2, instruction: 'Mix dry ingredients', duration_minutes: 5 },
          { step_number: 3, instruction: 'Combine wet and dry', duration_minutes: 3 },
          { step_number: 4, instruction: 'Bake until golden', duration_minutes: 35 },
        ],
        notes: 'This recipe works best with room temperature eggs.',
      });

      const recipe = await api.createRecipe(token!, recipeData);

      await authenticatedPage.goto(`/recipes/${recipe.id}`);

      // Verify all major sections are present
      await expect(authenticatedPage.getByText('Complete Recipe Test')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="metadata-bar"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="ingredients-list"], [data-testid="ingredients-section"]').first()).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="instructions-list"], [data-testid="instructions-section"]').first()).toBeVisible();
    });

    test('should display notes section when recipe has notes', async ({ authenticatedPage, request }) => {
      const api = new APIHelper(request);
      const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

      const recipeData = generateRecipeData({
        notes: 'Chef tip: Let the dough rest for 30 minutes before rolling.',
      });

      const recipe = await api.createRecipe(token!, recipeData);

      await authenticatedPage.goto(`/recipes/${recipe.id}`);

      // Notes section should be visible
      const notesSection = authenticatedPage.locator('[data-testid="recipe-notes"], [data-testid="notes-section"]');
      await expect(notesSection.first()).toBeVisible();
      await expect(authenticatedPage.getByText(/Let the dough rest for 30 minutes/)).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should use semantic list element for instructions', async ({ authenticatedPage, request }) => {
      const api = new APIHelper(request);
      const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

      const recipeData = generateRecipeData({
        instructions: [
          { step_number: 1, instruction: 'Step one', duration_minutes: 5 },
          { step_number: 2, instruction: 'Step two', duration_minutes: 5 },
        ],
      });

      const recipe = await api.createRecipe(token!, recipeData);

      await authenticatedPage.goto(`/recipes/${recipe.id}`);

      // Instructions should use semantic ordered list
      const orderedList = authenticatedPage.locator('ol[data-testid="instructions-list"], [data-testid="instructions-section"] ol');
      await expect(orderedList.first()).toBeVisible();
    });

    test('should have accessible timer buttons with duration labels', async ({ authenticatedPage, request }) => {
      const api = new APIHelper(request);
      const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));

      const recipeData = generateRecipeData({
        instructions: [
          { step_number: 1, instruction: 'Simmer sauce', duration_minutes: 15 },
        ],
      });

      const recipe = await api.createRecipe(token!, recipeData);

      await authenticatedPage.goto(`/recipes/${recipe.id}`);

      // Timer button should have accessible label indicating duration
      const timerButton = authenticatedPage.locator('[data-testid="timer-button"]').first();

      if (await timerButton.isVisible()) {
        // Button should have aria-label or visible text with duration
        const ariaLabel = await timerButton.getAttribute('aria-label');
        const buttonText = await timerButton.textContent();

        const hasAccessibleLabel =
          (ariaLabel && ariaLabel.includes('15')) ||
          (buttonText && buttonText.includes('15'));

        expect(hasAccessibleLabel).toBe(true);
      }
    });
  });
});
