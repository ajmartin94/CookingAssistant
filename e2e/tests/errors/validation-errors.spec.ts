import { test, expect } from '@playwright/test';
import { RegisterPage } from '../../pages/register.page';
import { LoginPage } from '../../pages/login.page';
import { CreateRecipePage } from '../../pages/create-recipe.page';
import { generateUniqueUsername, generateUniqueEmail } from '../../utils/test-data';

test.describe('Validation Error Handling', () => {
  test.describe('Registration Validation', () => {
    let registerPage: RegisterPage;

    test.beforeEach(async ({ page }) => {
      registerPage = new RegisterPage(page);
      await registerPage.goto();
    });

    test('should validate empty registration form', async () => {
      // Try to submit without filling fields
      await registerPage.registerButton.click();

      // Should stay on registration page
      await expect(registerPage.page).toHaveURL(/\/login/);

      // May show validation errors (depends on implementation)
      // At minimum, should not crash or redirect to recipes
    });

    test('should validate invalid email format', async () => {
      await registerPage.usernameInput.fill(generateUniqueUsername());
      await registerPage.emailInput.fill('invalid-email-format');
      await registerPage.passwordInput.fill('ValidPassword123!');

      await registerPage.registerButton.click();

      // Should show validation error or stay on page
      await expect(registerPage.page).toHaveURL(/\/login/);
    });

    test('should validate password requirements', async () => {
      await registerPage.usernameInput.fill(generateUniqueUsername());
      await registerPage.emailInput.fill(generateUniqueEmail());
      await registerPage.passwordInput.fill('weak'); // Too short, no special chars

      await registerPage.registerButton.click();

      // Should show password validation error or stay on page
      // The exact behavior depends on frontend validation
      await expect(registerPage.page).toHaveURL(/\/login/);
    });

    test('should validate username length', async () => {
      await registerPage.usernameInput.fill('ab'); // Too short
      await registerPage.emailInput.fill(generateUniqueEmail());
      await registerPage.passwordInput.fill('ValidPassword123!');

      await registerPage.registerButton.click();

      // Should show validation error
      await expect(registerPage.page).toHaveURL(/\/login/);
    });
  });

  test.describe('Login Validation', () => {
    let loginPage: LoginPage;

    test.beforeEach(async ({ page }) => {
      loginPage = new LoginPage(page);
      await loginPage.goto();
    });

    test('should validate empty login form', async () => {
      // Try to submit without credentials
      await loginPage.loginButton.click();

      // Should stay on login page
      await expect(loginPage.page).toHaveURL(/\/login/);
    });

    test('should show error for nonexistent user', async () => {
      await loginPage.login('nonexistent_user_12345', 'password123');

      // Should show error message
      const hasError = await loginPage.hasError();
      expect(hasError).toBe(true);

      // Should stay on login page
      await expect(loginPage.page).toHaveURL(/\/login/);
    });

    test('should show error for wrong password', async ({ page }) => {
      // First register a user
      const username = generateUniqueUsername();
      const email = generateUniqueEmail();
      const password = 'CorrectPassword123!';

      const registerPage = new RegisterPage(page);
      await registerPage.goto();
      await registerPage.register(username, email, password);

      // Now logout
      await page.goto('/login');
      await page.evaluate(() => localStorage.clear());

      // Try to login with wrong password
      await loginPage.goto();
      await loginPage.login(username, 'WrongPassword123!');

      // Should show error
      const hasError = await loginPage.hasError();
      expect(hasError).toBe(true);

      // Should stay on login page
      await expect(loginPage.page).toHaveURL(/\/login/);
    });
  });

  test.describe('Recipe Creation Validation', () => {
    let createRecipePage: CreateRecipePage;

    test.beforeEach(async ({ page }) => {
      // Register and login first
      const registerPage = new RegisterPage(page);
      await registerPage.goto();
      await registerPage.register(
        generateUniqueUsername(),
        generateUniqueEmail(),
        'TestPassword123!'
      );

      await expect(page).toHaveURL(/\/recipes/, { timeout: 10000 });

      createRecipePage = new CreateRecipePage(page);
      await createRecipePage.goto();
    });

    test('should validate empty recipe form', async () => {
      // Try to submit without filling anything
      await createRecipePage.submit();

      // Should stay on create page
      await expect(createRecipePage.page).toHaveURL(/\/create/);

      // Should show validation errors
      const hasErrors = await createRecipePage.hasValidationErrors();
      expect(hasErrors).toBe(true);
    });

    test('should require recipe title', async () => {
      // Fill everything except title
      await createRecipePage.descriptionInput.fill('A description');
      await createRecipePage.prepTimeInput.fill('10');
      await createRecipePage.cookTimeInput.fill('20');
      await createRecipePage.servingsInput.fill('4');

      await createRecipePage.addIngredient('flour', '2', 'cups');
      await createRecipePage.addInstruction('Mix ingredients', 5);

      await createRecipePage.submit();

      // Should show validation error for missing title
      await expect(createRecipePage.page).toHaveURL(/\/create/);

      const hasErrors = await createRecipePage.hasValidationErrors();
      expect(hasErrors).toBe(true);
    });

    test('should require at least one ingredient', async () => {
      await createRecipePage.titleInput.fill('Test Recipe');
      await createRecipePage.descriptionInput.fill('Description');
      await createRecipePage.prepTimeInput.fill('10');
      await createRecipePage.cookTimeInput.fill('20');
      await createRecipePage.servingsInput.fill('4');

      // Add instruction but no ingredients
      await createRecipePage.addInstruction('Cook it', 30);

      await createRecipePage.submit();

      // Should show validation error
      await expect(createRecipePage.page).toHaveURL(/\/create/);

      const hasErrors = await createRecipePage.hasValidationErrors();
      expect(hasErrors).toBe(true);
    });

    test('should require at least one instruction', async () => {
      await createRecipePage.titleInput.fill('Test Recipe');
      await createRecipePage.descriptionInput.fill('Description');
      await createRecipePage.prepTimeInput.fill('10');
      await createRecipePage.cookTimeInput.fill('20');
      await createRecipePage.servingsInput.fill('4');

      // Add ingredient but no instructions
      await createRecipePage.addIngredient('flour', '2', 'cups');

      await createRecipePage.submit();

      // Should show validation error
      await expect(createRecipePage.page).toHaveURL(/\/create/);

      const hasErrors = await createRecipePage.hasValidationErrors();
      expect(hasErrors).toBe(true);
    });

    test('should validate numeric fields', async () => {
      await createRecipePage.titleInput.fill('Test Recipe');
      await createRecipePage.descriptionInput.fill('Description');

      // Try to enter negative numbers
      await createRecipePage.prepTimeInput.fill('-10');
      await createRecipePage.cookTimeInput.fill('-20');
      await createRecipePage.servingsInput.fill('-4');

      await createRecipePage.addIngredient('flour', '2', 'cups');
      await createRecipePage.addInstruction('Cook', 30);

      await createRecipePage.submit();

      // Should validate that numbers are positive
      // Behavior depends on frontend validation (HTML5 or custom)
      await expect(createRecipePage.page).toHaveURL(/\/create/);
    });

    test('should validate ingredient fields', async () => {
      await createRecipePage.titleInput.fill('Test Recipe');
      await createRecipePage.descriptionInput.fill('Description');
      await createRecipePage.prepTimeInput.fill('10');
      await createRecipePage.cookTimeInput.fill('20');
      await createRecipePage.servingsInput.fill('4');

      // Try to add ingredient with missing fields
      await createRecipePage.addIngredientButton.click();
      // Leave ingredient name empty

      await createRecipePage.addInstruction('Cook', 30);

      await createRecipePage.submit();

      // Should show validation error
      await expect(createRecipePage.page).toHaveURL(/\/create/);

      const hasErrors = await createRecipePage.hasValidationErrors();
      expect(hasErrors).toBe(true);
    });

    test('should validate instruction text is not empty', async () => {
      await createRecipePage.titleInput.fill('Test Recipe');
      await createRecipePage.descriptionInput.fill('Description');
      await createRecipePage.prepTimeInput.fill('10');
      await createRecipePage.cookTimeInput.fill('20');
      await createRecipePage.servingsInput.fill('4');

      await createRecipePage.addIngredient('flour', '2', 'cups');

      // Add instruction button but leave text empty
      await createRecipePage.addInstructionButton.click();

      await createRecipePage.submit();

      // Should show validation error
      await expect(createRecipePage.page).toHaveURL(/\/create/);

      const hasErrors = await createRecipePage.hasValidationErrors();
      expect(hasErrors).toBe(true);
    });

    test('should display user-friendly validation messages', async () => {
      // Submit empty form
      await createRecipePage.submit();

      // Check for error messages
      const errorMessages = createRecipePage.page.locator('.error, .validation-error, [role="alert"]');
      const errorCount = await errorMessages.count();

      // Should have at least one error message
      expect(errorCount).toBeGreaterThan(0);

      // Error messages should be visible
      if (errorCount > 0) {
        const firstError = errorMessages.first();
        await expect(firstError).toBeVisible();

        // Error text should not be empty
        const errorText = await firstError.textContent();
        expect(errorText?.trim().length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Recipe Edit Validation', () => {
    test('should prevent clearing required fields during edit', async ({ page }) => {
      // Register and create a recipe first
      const registerPage = new RegisterPage(page);
      await registerPage.goto();
      const username = generateUniqueUsername();
      const email = generateUniqueEmail();
      await registerPage.register(username, email, 'TestPassword123!');

      await expect(page).toHaveURL(/\/recipes/, { timeout: 10000 });

      const createRecipePage = new CreateRecipePage(page);
      await createRecipePage.goto();

      // Create a recipe
      await createRecipePage.titleInput.fill('Original Recipe');
      await createRecipePage.descriptionInput.fill('Description');
      await createRecipePage.prepTimeInput.fill('10');
      await createRecipePage.cookTimeInput.fill('20');
      await createRecipePage.servingsInput.fill('4');
      await createRecipePage.addIngredient('flour', '2', 'cups');
      await createRecipePage.addInstruction('Mix', 5);
      await createRecipePage.submit();

      await expect(page).toHaveURL(/\/recipes\/[^/]+/, { timeout: 10000 });

      // Navigate to edit
      const editButton = page.locator('a:has-text("Edit"), button:has-text("Edit")');
      await editButton.click();

      // Try to clear the title
      const titleInput = page.locator('input[name="title"]');
      await titleInput.clear();

      // Try to submit
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Should stay on edit page with validation error
      await expect(page).toHaveURL(/\/edit/);

      const errorMessages = page.locator('.error, .validation-error, [role="alert"]');
      await expect(errorMessages.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test('should handle server-side validation errors', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    // Try to register with a username that might trigger server validation
    await registerPage.usernameInput.fill('a'); // Too short for server
    await registerPage.emailInput.fill(generateUniqueEmail());
    await registerPage.passwordInput.fill('ValidPassword123!');

    await registerPage.registerButton.click();

    // Should either show client-side error or server-side error
    // Either way, should stay on registration page
    await expect(page).toHaveURL(/\/login/);
  });
});
