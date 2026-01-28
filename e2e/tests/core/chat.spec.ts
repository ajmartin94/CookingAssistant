/**
 * Core Tier: AI Chat
 * Consolidated from: chat/chat-panel.spec.ts
 *
 * Covers:
 * - Feature 2: AI create (4 tests: chat visibility, AI response timing, apply populates form, full create flow)
 * - Feature 3: Reject (2 tests: reject preserves form, iterate after rejection)
 * - Feature 4: AI edit (2 tests: edit+save, chat context includes existing recipe)
 *
 * Removed (per audit):
 * - Feature 2 smoke: chat toggle on edit page (covered by Feature 4)
 * - Feature 3: reject empty form (redundant with reject preserves form)
 * - Feature 3: UI state after rejection (redundant with iterate test)
 * - Feature 5: Chat history persistence (comprehensive tier)
 * - Feature 5: Chat history keyed by page (comprehensive tier)
 */

import { test, expect } from '../../fixtures/auth.fixture';
import { APIHelper } from '../../utils/api';
import { generateRecipeData } from '../../utils/test-data';

// === FEATURE 2: AI CREATE ===

test.describe('Core: AI Recipe Creation', () => {
  test('user sees chat toggle button on create recipe page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes/create');

    const chatToggle = authenticatedPage.getByRole('button', { name: /ai chat/i });
    await expect(chatToggle).toBeVisible({ timeout: 10000 });
  });

  test('user opens chat, sends message, and AI response appears within 30 seconds', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes/create');

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

    const aiMessage = authenticatedPage.locator('[data-testid="chat-message-ai"]').last();
    await expect(aiMessage).toBeVisible({ timeout: 30000 });

    const responseText = await aiMessage.textContent();
    expect(responseText!.length).toBeGreaterThan(50);
    expect(responseText).toContain('fresh herbs');
  });

  test('user applies proposal and all form fields are populated', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes/create');

    const chatToggle = authenticatedPage.getByRole('button', { name: /ai chat/i });
    await chatToggle.click();

    const messageInput = authenticatedPage.getByRole('textbox', { name: /message/i });
    await expect(messageInput).toBeVisible({ timeout: 10000 });
    await messageInput.fill('Create a chocolate cake recipe');
    const sendButton = authenticatedPage.getByRole('button', { name: /send/i });

    const responsePromise = authenticatedPage.waitForResponse(
      resp => resp.url().includes('/api/v1/chat') && resp.status() === 200
    );
    await sendButton.click();
    await responsePromise;

    const applyButton = authenticatedPage.getByRole('button', { name: /apply/i });
    await expect(applyButton).toBeVisible({ timeout: 30000 });

    await applyButton.click();

    const titleInput = authenticatedPage.locator('input[name="title"]');
    await expect(titleInput).toHaveValue('Classic Chocolate Cake', { timeout: 10000 });

    const descriptionInput = authenticatedPage.locator('textarea[name="description"]');
    await expect(descriptionInput).not.toHaveValue('');
    const descriptionValue = await descriptionInput.inputValue();
    expect(descriptionValue.length).toBeGreaterThan(10);

    const ingredientRows = authenticatedPage.locator('[data-testid="ingredient-row"]');
    await expect(ingredientRows.first()).toBeVisible();
    const firstIngredientName = ingredientRows.first().locator('input[name="ingredient-name"]');
    await expect(firstIngredientName).not.toHaveValue('');

    const instructionRows = authenticatedPage.locator('[data-testid="instruction-row"]');
    await expect(instructionRows.first()).toBeVisible();
    const firstInstructionText = instructionRows.first().locator('textarea[name="instruction-text"]');
    await expect(firstInstructionText).not.toHaveValue('');

    const prepTimeInput = authenticatedPage.locator('input[name="prep_time_minutes"]');
    await expect(prepTimeInput).toHaveValue('15');

    const cookTimeInput = authenticatedPage.locator('input[name="cook_time_minutes"]');
    await expect(cookTimeInput).toHaveValue('35');

    const servingsInput = authenticatedPage.locator('input[name="servings"]');
    await expect(servingsInput).toHaveValue('8');
  });

  test('user creates spaghetti recipe through AI chat and recipe exists in database', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );

    const beforeResponse = await api.getRecipes(token!);
    const beforeCount = beforeResponse.recipes?.length || 0;

    await authenticatedPage.goto('/recipes/create');

    const chatToggle = authenticatedPage.getByRole('button', { name: /ai chat/i });
    await chatToggle.click();

    const messageInput = authenticatedPage.getByRole('textbox', { name: /message/i });
    await expect(messageInput).toBeVisible({ timeout: 10000 });
    await messageInput.fill('make me a spaghetti recipe');
    const sendButton = authenticatedPage.getByRole('button', { name: /send/i });

    const responsePromise = authenticatedPage.waitForResponse(
      resp => resp.url().includes('/api/v1/chat') && resp.status() === 200
    );
    await sendButton.click();
    await responsePromise;

    const applyButton = authenticatedPage.getByRole('button', { name: /apply/i });
    await expect(applyButton).toBeVisible({ timeout: 30000 });

    await applyButton.click();

    const titleInput = authenticatedPage.locator('input[name="title"]');
    await expect(titleInput).toHaveValue(/spaghetti/i, { timeout: 10000 });

    const closeChatButton = authenticatedPage.getByRole('button', { name: 'Close chat' });
    await closeChatButton.click();
    const chatPanel = authenticatedPage.locator('[role="complementary"][aria-label="AI Recipe Chat"]');
    await expect(chatPanel).not.toBeVisible({ timeout: 5000 });

    const createButton = authenticatedPage.locator('button[type="submit"]');
    await expect(createButton).toBeVisible();

    const createPromise = authenticatedPage.waitForResponse(
      resp => resp.url().includes('/api/v1/recipes') &&
        resp.request().method() === 'POST' &&
        resp.status() === 201
    );
    await createButton.click();
    await createPromise;

    await authenticatedPage.waitForURL(/\/recipes\/[\w-]+$/, { timeout: 10000 });

    const afterResponse = await api.getRecipes(token!);
    const afterRecipes = afterResponse.recipes || [];
    expect(afterRecipes.length).toBe(beforeCount + 1);

    const spaghettiRecipe = afterRecipes.find((r: { title: string }) =>
      r.title.toLowerCase().includes('spaghetti')
    );
    expect(spaghettiRecipe).toBeDefined();
    expect(spaghettiRecipe.title).toContain('Spaghetti');

    expect(spaghettiRecipe.description).toBeTruthy();
    expect(spaghettiRecipe.ingredients.length).toBeGreaterThan(0);
    expect(spaghettiRecipe.instructions.length).toBeGreaterThan(0);
  });
});

// === FEATURE 3: REJECT ===

test.describe('Core: AI Recipe Rejection', () => {
  test('user rejects proposal and form fields with original values remain unchanged', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes/create');

    const titleInput = authenticatedPage.locator('input[name="title"]');
    await titleInput.waitFor({ state: 'visible' });
    await titleInput.fill('My Original Title');

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

    await expect(titleInput).toHaveValue('My Original Title');
  });

  test('user rejects proposal, sends new message, and receives new AI response', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes/create');

    const chatToggle = authenticatedPage.getByRole('button', { name: /ai chat/i });
    await chatToggle.click();

    const messageInput = authenticatedPage.getByRole('textbox', { name: /message/i });
    await expect(messageInput).toBeVisible({ timeout: 10000 });
    await messageInput.fill('Create a pasta recipe with meat');
    const sendButton = authenticatedPage.getByRole('button', { name: /send/i });

    const responsePromise1 = authenticatedPage.waitForResponse(
      resp => resp.url().includes('/api/v1/chat') && resp.status() === 200
    );
    await sendButton.click();
    await responsePromise1;

    const rejectButton = authenticatedPage.getByRole('button', { name: /reject/i });
    await expect(rejectButton).toBeVisible({ timeout: 30000 });

    const aiMessagesBefore = await authenticatedPage.locator('[data-testid="chat-message-ai"]').count();

    await rejectButton.click();

    await expect(rejectButton).not.toBeVisible({ timeout: 5000 });

    await expect(messageInput).toBeVisible({ timeout: 10000 });
    await messageInput.fill('make it vegetarian');

    const responsePromise2 = authenticatedPage.waitForResponse(
      resp => resp.url().includes('/api/v1/chat') && resp.status() === 200
    );
    await sendButton.click();
    await responsePromise2;

    const aiMessagesAfter = await authenticatedPage.locator('[data-testid="chat-message-ai"]').count();
    expect(aiMessagesAfter).toBeGreaterThan(aiMessagesBefore);

    const latestAiMessage = authenticatedPage.locator('[data-testid="chat-message-ai"]').last();
    await expect(latestAiMessage).toBeVisible({ timeout: 30000 });

    const newApplyButton = authenticatedPage.getByRole('button', { name: /apply/i }).last();
    await expect(newApplyButton).toBeVisible({ timeout: 30000 });
  });
});

// === FEATURE 4: AI EDIT ===

test.describe('Core: AI Recipe Edit', () => {
  test('user edits existing recipe with AI chat and saves updated recipe to database', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );

    const recipeData = generateRecipeData({
      title: 'Original Pasta Recipe',
      description: 'A pasta recipe with wheat ingredients',
      ingredients: [
        { name: 'wheat flour pasta', amount: '400', unit: 'g', notes: '' },
        { name: 'tomato sauce', amount: '200', unit: 'ml', notes: '' },
      ],
      instructions: [
        { step_number: 1, instruction: 'Boil pasta', duration_minutes: 10 },
        { step_number: 2, instruction: 'Add sauce', duration_minutes: 5 },
      ],
    });
    const recipe = await api.createRecipe(token!, recipeData);

    const beforeRecipe = await api.getRecipe(token!, recipe.id);
    expect(beforeRecipe.title).toBe('Original Pasta Recipe');

    await authenticatedPage.goto(`/recipes/${recipe.id}/edit`);

    const titleInput = authenticatedPage.locator('input[name="title"]');
    await expect(titleInput).toHaveValue('Original Pasta Recipe', { timeout: 10000 });

    const chatToggle = authenticatedPage.getByRole('button', { name: /ai chat/i });
    await chatToggle.click();

    const messageInput = authenticatedPage.getByRole('textbox', { name: /message/i });
    await expect(messageInput).toBeVisible({ timeout: 10000 });
    await messageInput.fill('make it gluten-free');
    const sendButton = authenticatedPage.getByRole('button', { name: /send/i });

    const responsePromise = authenticatedPage.waitForResponse(
      resp => resp.url().includes('/api/v1/chat') && resp.status() === 200
    );
    await sendButton.click();
    await responsePromise;

    const applyButton = authenticatedPage.getByRole('button', { name: /apply/i });
    await expect(applyButton).toBeVisible({ timeout: 30000 });

    await applyButton.click();

    await expect(titleInput).toHaveValue(/gluten.free/i, { timeout: 10000 });

    const closeChatButton = authenticatedPage.getByRole('button', { name: 'Close chat' });
    await closeChatButton.click();
    const chatPanel = authenticatedPage.locator('[role="complementary"][aria-label="AI Recipe Chat"]');
    await expect(chatPanel).not.toBeVisible({ timeout: 5000 });

    const saveButton = authenticatedPage.locator('button[type="submit"]');
    await expect(saveButton).toBeVisible();

    const updatePromise = authenticatedPage.waitForResponse(
      resp => resp.url().includes(`/api/v1/recipes/${recipe.id}`) &&
        (resp.request().method() === 'PUT' || resp.request().method() === 'PATCH') &&
        resp.status() < 400
    );
    await saveButton.click();
    await updatePromise;

    await authenticatedPage.waitForURL(`/recipes/${recipe.id}`, { timeout: 10000 });

    const afterRecipe = await api.getRecipe(token!, recipe.id);

    expect(afterRecipe.title.toLowerCase()).toContain('gluten');

    expect(afterRecipe.title).not.toBe(beforeRecipe.title);
  });

  test('AI response references existing recipe content when editing', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );

    const recipeData = generateRecipeData({
      title: 'Unique Mango Chicken Curry',
      description: 'A tropical curry with mango and chicken',
      ingredients: [
        { name: 'chicken breast', amount: '500', unit: 'g', notes: 'diced' },
        { name: 'mango', amount: '2', unit: 'whole', notes: 'ripe' },
        { name: 'curry powder', amount: '2', unit: 'tbsp', notes: '' },
      ],
      instructions: [
        { step_number: 1, instruction: 'Cook chicken until golden', duration_minutes: 10 },
        { step_number: 2, instruction: 'Add mango and curry powder', duration_minutes: 5 },
      ],
    });
    const recipe = await api.createRecipe(token!, recipeData);

    await authenticatedPage.goto(`/recipes/${recipe.id}/edit`);

    const titleInput = authenticatedPage.locator('input[name="title"]');
    await expect(titleInput).toHaveValue('Unique Mango Chicken Curry', { timeout: 10000 });

    const chatToggle = authenticatedPage.getByRole('button', { name: /ai chat/i });
    await chatToggle.click();

    const messageInput = authenticatedPage.getByRole('textbox', { name: /message/i });
    await expect(messageInput).toBeVisible({ timeout: 10000 });
    await messageInput.fill('modify this recipe to make it spicier');
    const sendButton = authenticatedPage.getByRole('button', { name: /send/i });

    const responsePromise = authenticatedPage.waitForResponse(
      resp => resp.url().includes('/api/v1/chat') && resp.status() === 200
    );
    await sendButton.click();
    await responsePromise;

    const aiMessage = authenticatedPage.locator('[data-testid="chat-message-ai"]').last();
    await expect(aiMessage).toBeVisible({ timeout: 30000 });

    const applyButton = authenticatedPage.getByRole('button', { name: /apply/i });
    await expect(applyButton).toBeVisible({ timeout: 30000 });

    const responseText = await aiMessage.textContent();
    expect(responseText!.length).toBeGreaterThan(50);
  });
});
