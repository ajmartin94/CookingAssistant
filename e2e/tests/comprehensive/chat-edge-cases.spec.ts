/**
 * Comprehensive Tier: Chat Edge Cases
 * Consolidated from: chat/chat-panel.spec.ts (edge case tests only)
 *
 * Covers:
 * - Chat history persists across page refresh
 * - Chat history is keyed by page (create vs edit are separate)
 * - Rejected proposal leaves form unchanged (pre-filled fields)
 * - Rejected proposal leaves empty form empty
 *
 * Core chat flows (send message, apply proposal, full create/edit via chat)
 * are covered in core/chat.spec.ts.
 */

import { test, expect } from '../../fixtures/auth.fixture';
import { APIHelper } from '../../utils/api';
import { generateRecipeData } from '../../utils/test-data';

test.describe('Comprehensive: Chat History Persistence', () => {
  test('chat messages survive page refresh', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes/create');

    // Open chat and send a message
    const chatToggle = authenticatedPage.getByRole('button', { name: /ai chat/i });
    await chatToggle.click();

    const messageInput = authenticatedPage.getByRole('textbox', { name: /message/i });
    await expect(messageInput).toBeVisible({ timeout: 10000 });
    await messageInput.fill('How do I store fresh herbs?');
    const sendButton = authenticatedPage.getByRole('button', { name: /send/i });

    const responsePromise = authenticatedPage.waitForResponse(
      resp => resp.url().includes('/api/v1/chat') && resp.status() === 200
    );
    await sendButton.click();
    await responsePromise;

    // Wait for AI response
    const aiMessage = authenticatedPage.locator('[data-testid="chat-message-ai"]').last();
    await expect(aiMessage).toBeVisible({ timeout: 30000 });

    // Close chat, refresh, reopen
    const closeChatButton = authenticatedPage.getByRole('button', { name: 'Close chat' });
    await closeChatButton.click();
    const chatPanel = authenticatedPage.locator('[role="complementary"][aria-label="AI Recipe Chat"]');
    await expect(chatPanel).not.toBeVisible({ timeout: 5000 });

    await authenticatedPage.reload();

    const chatToggleAfterReload = authenticatedPage.getByRole('button', { name: /ai chat/i });
    await expect(chatToggleAfterReload).toBeVisible({ timeout: 10000 });
    await chatToggleAfterReload.click();

    // Previous messages should be visible
    const userMessage = authenticatedPage.locator('[data-testid="chat-message-user"]');
    await expect(userMessage.first()).toBeVisible({ timeout: 10000 });
    await expect(userMessage.first()).toContainText('How do I store fresh herbs?');

    const restoredAiMessage = authenticatedPage.locator('[data-testid="chat-message-ai"]');
    await expect(restoredAiMessage.first()).toBeVisible({ timeout: 10000 });
  });

  test('create page and edit page have separate chat histories', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );

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

    // Send a message on Create page
    await authenticatedPage.goto('/recipes/create');
    const chatToggle = authenticatedPage.getByRole('button', { name: /ai chat/i });
    await chatToggle.click();

    const messageInput = authenticatedPage.getByRole('textbox', { name: /message/i });
    await expect(messageInput).toBeVisible({ timeout: 10000 });
    await messageInput.fill('Create page message: suggest a breakfast recipe');
    const sendButton = authenticatedPage.getByRole('button', { name: /send/i });

    const createResponsePromise = authenticatedPage.waitForResponse(
      resp => resp.url().includes('/api/v1/chat') && resp.status() === 200
    );
    await sendButton.click();
    await createResponsePromise;

    const createPageUserMessage = authenticatedPage.locator('[data-testid="chat-message-user"]');
    await expect(createPageUserMessage.first()).toBeVisible({ timeout: 30000 });

    // Close chat and navigate to Edit page
    const closeChatButton = authenticatedPage.getByRole('button', { name: 'Close chat' });
    await closeChatButton.click();

    await authenticatedPage.goto(`/recipes/${recipe.id}/edit`);

    const editChatToggle = authenticatedPage.getByRole('button', { name: /ai chat/i });
    await expect(editChatToggle).toBeVisible({ timeout: 10000 });
    await editChatToggle.click();

    // Edit page chat should be empty (no messages from Create page)
    const editPageUserMessage = authenticatedPage.locator('[data-testid="chat-message-user"]');
    await expect(editPageUserMessage).toHaveCount(0, { timeout: 5000 });
  });
});

test.describe('Comprehensive: Chat Rejection Edge Cases', () => {
  test('rejecting proposal keeps pre-filled form values unchanged', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes/create');

    // Pre-fill the title
    const titleInput = authenticatedPage.locator('input[name="title"]');
    await titleInput.waitFor({ state: 'visible' });
    await titleInput.fill('My Original Title');

    // Open chat and get a proposal
    const chatToggle = authenticatedPage.getByRole('button', { name: /ai chat/i });
    await chatToggle.click();

    const messageInput = authenticatedPage.getByRole('textbox', { name: /message/i });
    await expect(messageInput).toBeVisible({ timeout: 10000 });
    await messageInput.fill('Make me a pasta recipe');
    const sendButton = authenticatedPage.getByRole('button', { name: /send/i });

    const responsePromise = authenticatedPage.waitForResponse(
      resp => resp.url().includes('/api/v1/chat') && resp.status() === 200
    );
    await sendButton.click();
    await responsePromise;

    const rejectButton = authenticatedPage.getByRole('button', { name: /reject/i });
    await expect(rejectButton).toBeVisible({ timeout: 30000 });

    await rejectButton.click();

    // Title should still be the original value
    await expect(titleInput).toHaveValue('My Original Title');
  });

  test('rejecting proposal keeps empty form empty', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes/create');

    const titleInput = authenticatedPage.locator('input[name="title"]');
    await titleInput.waitFor({ state: 'visible' });
    await expect(titleInput).toHaveValue('');

    // Open chat and get a proposal
    const chatToggle = authenticatedPage.getByRole('button', { name: /ai chat/i });
    await chatToggle.click();

    const messageInput = authenticatedPage.getByRole('textbox', { name: /message/i });
    await expect(messageInput).toBeVisible({ timeout: 10000 });
    await messageInput.fill('Create a soup recipe');
    const sendButton = authenticatedPage.getByRole('button', { name: /send/i });

    const responsePromise = authenticatedPage.waitForResponse(
      resp => resp.url().includes('/api/v1/chat') && resp.status() === 200
    );
    await sendButton.click();
    await responsePromise;

    const rejectButton = authenticatedPage.getByRole('button', { name: /reject/i });
    await expect(rejectButton).toBeVisible({ timeout: 30000 });

    await rejectButton.click();

    // Form fields should remain empty
    await expect(titleInput).toHaveValue('');

    const descriptionInput = authenticatedPage.locator('textarea[name="description"]');
    await expect(descriptionInput).toHaveValue('');
  });
});
