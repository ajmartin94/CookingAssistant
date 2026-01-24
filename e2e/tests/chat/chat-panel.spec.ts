import { test, expect } from '../../fixtures/auth.fixture';
import { APIHelper } from '../../utils/api';
import { generateRecipeData } from '../../utils/test-data';

test.describe('Feature: AI Chat Panel', () => {
  test.describe('Smoke: Chat panel visibility', () => {
    test('user sees chat toggle button on create recipe page', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/recipes/create');

      // Chat toggle button should be visible on the create page
      const chatToggle = authenticatedPage.getByRole('button', { name: /ai chat/i });
      await expect(chatToggle).toBeVisible({ timeout: 10000 });
    });

    test('user sees chat toggle button on edit recipe page', async ({ authenticatedPage, request }) => {
      const api = new APIHelper(request);
      const token = await authenticatedPage.evaluate(() =>
        localStorage.getItem('auth_token')
      );

      // Create a recipe via API to have something to edit
      const recipeData = generateRecipeData();
      const recipe = await api.createRecipe(token!, {
        title: recipeData.title,
        description: recipeData.description,
        ingredients: recipeData.ingredients,
        instructions: recipeData.instructions,
        prep_time_minutes: recipeData.prep_time_minutes,
        cook_time_minutes: recipeData.cook_time_minutes,
        servings: recipeData.servings,
      });

      // Navigate to edit page
      await authenticatedPage.goto(`/recipes/${recipe.id}/edit`);

      // Chat toggle button should be visible on the edit page
      const chatToggle = authenticatedPage.getByRole('button', { name: /ai chat/i });
      await expect(chatToggle).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Flow: Chat messaging', () => {
    test('user opens chat, sends message, and receives AI response', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/recipes/create');

      // Open the chat panel
      const chatToggle = authenticatedPage.getByRole('button', { name: /ai chat/i });
      await chatToggle.click();

      // Chat panel should be visible with a message input
      const messageInput = authenticatedPage.getByRole('textbox', { name: /message/i });
      await expect(messageInput).toBeVisible({ timeout: 10000 });

      // Send a conversational message (no creation keywords -> text response)
      await messageInput.fill('How do I store fresh herbs?');
      const sendButton = authenticatedPage.getByRole('button', { name: /send/i });

      // Wait for the AI response from the backend
      const responsePromise = authenticatedPage.waitForResponse(
        resp => resp.url().includes('/api/v1/chat') && resp.status() === 200
      );
      await sendButton.click();
      await responsePromise;

      // Verify AI response appears in the chat (from test provider: herb storage tips)
      const aiMessage = authenticatedPage.locator('[data-testid="chat-message-ai"]').last();
      await expect(aiMessage).toBeVisible({ timeout: 30000 });

      // Verify the response contains expected content from the test provider
      const responseText = await aiMessage.textContent();
      expect(responseText!.length).toBeGreaterThan(50);
      expect(responseText).toContain('fresh herbs');
    });

    test('user sends recipe request, receives proposal, clicks Apply, and form is updated', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/recipes/create');

      // Open the chat panel
      const chatToggle = authenticatedPage.getByRole('button', { name: /ai chat/i });
      await chatToggle.click();

      // Send a message with creation keyword to trigger recipe proposal
      const messageInput = authenticatedPage.getByRole('textbox', { name: /message/i });
      await expect(messageInput).toBeVisible({ timeout: 10000 });
      await messageInput.fill('Create a chocolate cake recipe');
      const sendButton = authenticatedPage.getByRole('button', { name: /send/i });

      // Wait for the AI response
      const responsePromise = authenticatedPage.waitForResponse(
        resp => resp.url().includes('/api/v1/chat') && resp.status() === 200
      );
      await sendButton.click();
      await responsePromise;

      // Verify a proposal card with Apply/Reject buttons appears
      const applyButton = authenticatedPage.getByRole('button', { name: /apply/i });
      await expect(applyButton).toBeVisible({ timeout: 30000 });

      const rejectButton = authenticatedPage.getByRole('button', { name: /reject/i });
      await expect(rejectButton).toBeVisible();

      // Click Apply to populate the form
      await applyButton.click();

      // Verify form fields are updated with proposed recipe values from test provider
      // The test provider returns "Classic Chocolate Cake" with specific values
      const titleInput = authenticatedPage.locator('input[name="title"]');
      await expect(titleInput).toHaveValue('Classic Chocolate Cake', { timeout: 10000 });

      const prepTimeInput = authenticatedPage.locator('input[name="prep_time_minutes"]');
      await expect(prepTimeInput).toHaveValue('15');

      const cookTimeInput = authenticatedPage.locator('input[name="cook_time_minutes"]');
      await expect(cookTimeInput).toHaveValue('35');

      const servingsInput = authenticatedPage.locator('input[name="servings"]');
      await expect(servingsInput).toHaveValue('8');
    });

    test('user sends recipe request, receives proposal, clicks Reject, and form is unchanged', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/recipes/create');

      // Pre-fill the title so we can verify it stays unchanged after reject
      const titleInput = authenticatedPage.locator('input[name="title"]');
      await titleInput.waitFor({ state: 'visible' });
      await titleInput.fill('My Original Title');

      // Open the chat panel
      const chatToggle = authenticatedPage.getByRole('button', { name: /ai chat/i });
      await chatToggle.click();

      // Send a message with creation keyword to trigger recipe proposal
      const messageInput = authenticatedPage.getByRole('textbox', { name: /message/i });
      await expect(messageInput).toBeVisible({ timeout: 10000 });
      await messageInput.fill('Make me a pasta recipe');
      const sendButton = authenticatedPage.getByRole('button', { name: /send/i });

      // Wait for the AI response
      const responsePromise = authenticatedPage.waitForResponse(
        resp => resp.url().includes('/api/v1/chat') && resp.status() === 200
      );
      await sendButton.click();
      await responsePromise;

      // Verify proposal card appears
      const rejectButton = authenticatedPage.getByRole('button', { name: /reject/i });
      await expect(rejectButton).toBeVisible({ timeout: 30000 });

      // Click Reject
      await rejectButton.click();

      // Verify form fields are NOT changed - title should still be the original
      await expect(titleInput).toHaveValue('My Original Title');

      // Verify the proposal card is dismissed
      await expect(rejectButton).not.toBeVisible({ timeout: 5000 });
    });

    test('user sends message, refreshes page, and chat history is restored from sessionStorage', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/recipes/create');

      // Open the chat panel
      const chatToggle = authenticatedPage.getByRole('button', { name: /ai chat/i });
      await chatToggle.click();

      // Send a conversational message
      const messageInput = authenticatedPage.getByRole('textbox', { name: /message/i });
      await expect(messageInput).toBeVisible({ timeout: 10000 });
      await messageInput.fill('How do I store fresh herbs?');
      const sendButton = authenticatedPage.getByRole('button', { name: /send/i });

      // Wait for the AI response
      const responsePromise = authenticatedPage.waitForResponse(
        resp => resp.url().includes('/api/v1/chat') && resp.status() === 200
      );
      await sendButton.click();
      await responsePromise;

      // Wait for the AI response to appear
      const aiMessage = authenticatedPage.locator('[data-testid="chat-message-ai"]').last();
      await expect(aiMessage).toBeVisible({ timeout: 30000 });

      // Verify sessionStorage has chat history before reload
      const storedHistory = await authenticatedPage.evaluate(() => {
        // Chat history is keyed by page type + recipe ID
        const keys = Object.keys(sessionStorage);
        return keys.find(key => key.includes('chat'));
      });
      expect(storedHistory).toBeTruthy();

      // Refresh the page
      await authenticatedPage.reload();

      // Re-open the chat panel
      const chatToggleAfterReload = authenticatedPage.getByRole('button', { name: /ai chat/i });
      await expect(chatToggleAfterReload).toBeVisible({ timeout: 10000 });
      await chatToggleAfterReload.click();

      // Verify chat history is restored - user message should still be visible
      const userMessage = authenticatedPage.locator('[data-testid="chat-message-user"]');
      await expect(userMessage.first()).toBeVisible({ timeout: 10000 });
      await expect(userMessage.first()).toContainText('How do I store fresh herbs?');

      // Verify AI response is also restored
      const restoredAiMessage = authenticatedPage.locator('[data-testid="chat-message-ai"]');
      await expect(restoredAiMessage.first()).toBeVisible({ timeout: 10000 });
      const restoredText = await restoredAiMessage.first().textContent();
      expect(restoredText!.length).toBeGreaterThan(50);
    });
  });
});
