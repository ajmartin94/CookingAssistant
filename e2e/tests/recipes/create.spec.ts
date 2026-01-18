import { test, expect } from '../../fixtures/auth.fixture';
import { RecipesPage } from '../../pages/recipes.page';
import { CreateRecipePage } from '../../pages/create-recipe.page';
import { RecipeDetailPage } from '../../pages/recipe-detail.page';
import { generateRecipeData } from '../../utils/test-data';

test.describe('Recipe Creation', () => {
  let recipesPage: RecipesPage;
  let createRecipePage: CreateRecipePage;

  test.beforeEach(async ({ authenticatedPage }) => {
    recipesPage = new RecipesPage(authenticatedPage);
    createRecipePage = new CreateRecipePage(authenticatedPage);

    await recipesPage.goto();
  });

  test('should create recipe with all fields', async ({ authenticatedPage }) => {
    const recipeData = generateRecipeData();

    // Navigate to create recipe page
    await recipesPage.createRecipeButton.click();
    await expect(authenticatedPage).toHaveURL(/\/recipes\/create/);

    // Fill in recipe details
    await createRecipePage.fillBasicInfo(
      recipeData.title,
      recipeData.description,
      recipeData.prep_time_minutes,
      recipeData.cook_time_minutes,
      recipeData.servings
    );

    // Add ingredients
    for (const ingredient of recipeData.ingredients) {
      await createRecipePage.addIngredient(
        ingredient.name,
        ingredient.amount,
        ingredient.unit,
        ingredient.notes
      );
    }

    // Add instructions
    for (const instruction of recipeData.instructions) {
      await createRecipePage.addInstruction(
        instruction.instruction,
        instruction.duration_minutes
      );
    }

    // Set additional fields
    await createRecipePage.fillAdditionalInfo(
      recipeData.cuisine_type,
      recipeData.difficulty_level,
      recipeData.dietary_tags
    );

    // Submit the form
    await createRecipePage.submit();

    // Should redirect to recipe detail page
    await expect(authenticatedPage).toHaveURL(/\/recipes\/[^/]+/, { timeout: 10000 });

    // Verify recipe was created with correct data
    const detailPage = new RecipeDetailPage(authenticatedPage);
    await expect(detailPage.recipeTitle).toHaveText(recipeData.title);
    await expect(detailPage.recipeDescription).toContainText(recipeData.description);
  });

  test('should validate required fields', async ({ authenticatedPage }) => {
    // Navigate to create recipe page
    await recipesPage.createRecipeButton.click();
    await expect(authenticatedPage).toHaveURL(/\/recipes\/create/);

    // Try to submit without filling any fields
    await createRecipePage.submit();

    // Should stay on create page (validation failed)
    await expect(authenticatedPage).toHaveURL(/\/recipes\/create/);

    // Should show validation errors
    const hasErrors = await createRecipePage.hasValidationErrors();
    expect(hasErrors).toBe(true);
  });

  test('should require at least one ingredient', async ({ authenticatedPage }) => {
    const recipeData = generateRecipeData();

    await recipesPage.createRecipeButton.click();

    // Fill basic info but no ingredients
    await createRecipePage.fillBasicInfo(
      recipeData.title,
      recipeData.description,
      recipeData.prep_time_minutes,
      recipeData.cook_time_minutes,
      recipeData.servings
    );

    // Add instructions but no ingredients
    await createRecipePage.addInstruction(
      recipeData.instructions[0].instruction,
      recipeData.instructions[0].duration_minutes
    );

    await createRecipePage.submit();

    // Should show validation error for missing ingredients
    const hasErrors = await createRecipePage.hasValidationErrors();
    expect(hasErrors).toBe(true);
  });

  test('should require at least one instruction', async ({ authenticatedPage }) => {
    const recipeData = generateRecipeData();

    await recipesPage.createRecipeButton.click();

    // Fill basic info
    await createRecipePage.fillBasicInfo(
      recipeData.title,
      recipeData.description,
      recipeData.prep_time_minutes,
      recipeData.cook_time_minutes,
      recipeData.servings
    );

    // Add ingredients but no instructions
    await createRecipePage.addIngredient(
      recipeData.ingredients[0].name,
      recipeData.ingredients[0].amount,
      recipeData.ingredients[0].unit,
      recipeData.ingredients[0].notes
    );

    await createRecipePage.submit();

    // Should show validation error for missing instructions
    const hasErrors = await createRecipePage.hasValidationErrors();
    expect(hasErrors).toBe(true);
  });

  test('should persist recipe to database', async ({ authenticatedPage, context }) => {
    const recipeData = generateRecipeData();

    // Create recipe
    await recipesPage.createRecipeButton.click();
    await createRecipePage.fillBasicInfo(
      recipeData.title,
      recipeData.description,
      recipeData.prep_time_minutes,
      recipeData.cook_time_minutes,
      recipeData.servings
    );

    for (const ingredient of recipeData.ingredients) {
      await createRecipePage.addIngredient(
        ingredient.name,
        ingredient.amount,
        ingredient.unit,
        ingredient.notes
      );
    }

    for (const instruction of recipeData.instructions) {
      await createRecipePage.addInstruction(
        instruction.instruction,
        instruction.duration_minutes
      );
    }

    await createRecipePage.submit();
    await expect(authenticatedPage).toHaveURL(/\/recipes\/[^/]+/, { timeout: 10000 });

    // Get the recipe ID from URL
    const url = authenticatedPage.url();
    const recipeId = url.match(/\/recipes\/([^/]+)/)?.[1];
    expect(recipeId).toBeTruthy();

    // Open new page in same context (same auth)
    const newPage = await context.newPage();
    await newPage.goto(`/recipes/${recipeId}`);

    // Should still see the recipe (persisted to database)
    const detailPage = new RecipeDetailPage(newPage);
    await expect(detailPage.recipeTitle).toHaveText(recipeData.title);

    await newPage.close();
  });

  test('should allow removing ingredients before submission', async ({ authenticatedPage }) => {
    const recipeData = generateRecipeData();

    await recipesPage.createRecipeButton.click();

    // Add 3 ingredients
    await createRecipePage.addIngredient('flour', '2', 'cups', '');
    await createRecipePage.addIngredient('sugar', '1', 'cup', '');
    await createRecipePage.addIngredient('eggs', '3', 'whole', '');

    // Remove the second ingredient (sugar)
    await createRecipePage.removeIngredient(1);

    // Verify only 2 ingredients remain
    const ingredientCount = await createRecipePage.getIngredientCount();
    expect(ingredientCount).toBe(2);
  });

  test('should allow removing instructions before submission', async ({ authenticatedPage }) => {
    const recipeData = generateRecipeData();

    await recipesPage.createRecipeButton.click();

    // Add 3 instructions
    await createRecipePage.addInstruction('Mix ingredients', 5);
    await createRecipePage.addInstruction('Bake', 30);
    await createRecipePage.addInstruction('Cool', 10);

    // Remove the second instruction
    await createRecipePage.removeInstruction(1);

    // Verify only 2 instructions remain
    const instructionCount = await createRecipePage.getInstructionCount();
    expect(instructionCount).toBe(2);
  });
});
