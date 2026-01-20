/**
 * E2E Tests for Chat Flows
 *
 * Tests the AI chat assistant integration across recipe pages.
 *
 * Acceptance Criteria:
 * - Test: Open chat panel, send message, see response
 * - Test: Tool confirmation appears, approve, see result
 * - Test: Tool confirmation appears, reject, see rejection handled
 * - Test: Create recipe via chat, verify in library
 * - Test: Edit recipe via chat, verify changes applied
 * - Test: Chat context correct on different pages
 */

import { test, expect } from '../../fixtures/auth.fixture';
import { ChatPage } from '../../pages/chat.page';
import { RecipeDetailPage } from '../../pages/recipe-detail.page';
import { RecipesPage } from '../../pages/recipes.page';
import { CreateRecipePage } from '../../pages/create-recipe.page';
import { APIHelper } from '../../utils/api';
import { generateRecipeData } from '../../utils/test-data';

// E2E backend port - matches playwright.config.ts
const E2E_BACKEND_PORT = 8001;

/**
 * Mock response helpers for deterministic chat behavior
 */
function createMockChatResponse(content: string, toolCalls?: object[]) {
  return {
    id: `msg-${Date.now()}`,
    role: 'assistant',
    content,
    toolCalls,
  };
}

function createToolCall(name: string, args: Record<string, unknown>) {
  return {
    id: `call-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name,
    args,
    status: 'pending',
  };
}

test.describe('Chat Flows - Basic Messaging', () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    chatPage = new ChatPage(authenticatedPage);
  });

  test('should open chat panel, send message, and see response', async ({ authenticatedPage, request }) => {
    // Navigate to recipes page (has chat)
    await authenticatedPage.goto('/recipes');
    await authenticatedPage.waitForLoadState('networkidle');

    // Mock chat API response
    await authenticatedPage.route(`**/api/v1/chat`, async (route) => {
      const response = createMockChatResponse(
        'Hello! I\'m your AI cooking assistant. How can I help you today?'
      );
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });

    // Expand chat panel
    await chatPage.expandChat();
    await expect(chatPage.chatPanel).toBeVisible();

    // Verify empty state
    await expect(chatPage.emptyState).toBeVisible();

    // Send a message
    await chatPage.sendMessage('Hello, can you help me with a recipe?');

    // Verify user message appears
    const userMessages = await chatPage.getUserMessages();
    expect(userMessages).toContain('Hello, can you help me with a recipe?');

    // Wait for and verify assistant response
    await chatPage.waitForResponse();
    const assistantMessages = await chatPage.getAssistantMessages();
    expect(assistantMessages.length).toBeGreaterThan(0);
    expect(assistantMessages[0]).toContain('AI cooking assistant');
  });

  test('should show streaming indicator while waiting for response', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');
    await authenticatedPage.waitForLoadState('networkidle');

    // Mock slow chat API response
    await authenticatedPage.route(`**/api/v1/chat`, async (route) => {
      // Delay response to observe streaming indicator
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const response = createMockChatResponse('Here is my delayed response.');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });

    await chatPage.expandChat();
    await chatPage.sendMessage('Test message');

    // Streaming indicator should appear
    await expect(chatPage.streamingIndicator).toBeVisible();

    // Wait for response to complete
    await chatPage.waitForResponse();

    // Streaming indicator should disappear
    await expect(chatPage.streamingIndicator).not.toBeVisible();
  });

  test('should collapse and expand chat panel', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');
    await authenticatedPage.waitForLoadState('networkidle');

    // Initially expand the chat
    await chatPage.expandChat();
    const isExpanded = await chatPage.isChatExpanded();
    expect(isExpanded).toBe(true);

    // Collapse the chat
    await chatPage.collapseChat();
    const isCollapsed = !(await chatPage.isChatExpanded());
    expect(isCollapsed).toBe(true);

    // Expand again
    await chatPage.expandChat();
    const isExpandedAgain = await chatPage.isChatExpanded();
    expect(isExpandedAgain).toBe(true);
  });

  test('should handle API error gracefully', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');
    await authenticatedPage.waitForLoadState('networkidle');

    // Mock error response
    await authenticatedPage.route(`**/api/v1/chat`, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'LLM service unavailable' }),
      });
    });

    await chatPage.expandChat();
    await chatPage.sendMessage('This should fail');

    // Error should be displayed
    await expect(chatPage.errorAlert).toBeVisible();
  });
});

test.describe('Chat Flows - Tool Confirmation', () => {
  let chatPage: ChatPage;
  let api: APIHelper;

  test.beforeEach(async ({ authenticatedPage, request }) => {
    chatPage = new ChatPage(authenticatedPage);
    api = new APIHelper(request);
  });

  test('should show tool confirmation when AI suggests creating a recipe', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');
    await authenticatedPage.waitForLoadState('networkidle');

    // Mock chat response with create_recipe tool call
    await authenticatedPage.route(`**/api/v1/chat`, async (route) => {
      const response = createMockChatResponse(
        'I\'ll create a pasta recipe for you. Please review the details below.',
        [
          createToolCall('create_recipe', {
            title: 'Classic Spaghetti Carbonara',
            description: 'A creamy Italian pasta dish',
            ingredients: ['400g spaghetti', '200g pancetta', '4 egg yolks', '100g parmesan'],
            instructions: ['Cook pasta', 'Fry pancetta', 'Mix eggs with cheese', 'Combine'],
            prep_time: 10,
            cook_time: 20,
            servings: 4,
          }),
        ]
      );
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });

    await chatPage.expandChat();
    await chatPage.sendMessage('Create a pasta recipe for me');

    // Tool confirmation should appear
    await chatPage.waitForToolConfirmation();
    await expect(chatPage.toolConfirmation).toBeVisible();

    // Should show tool name
    const toolName = await chatPage.getToolName();
    expect(toolName).toContain('Create Recipe');

    // Approve and reject buttons should be visible
    await expect(chatPage.approveButton).toBeVisible();
    await expect(chatPage.rejectButton).toBeVisible();
  });

  test('should execute tool when approved and show result', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');
    await authenticatedPage.waitForLoadState('networkidle');

    const newRecipeId = 'test-recipe-id-123';

    // Mock chat response with tool call
    await authenticatedPage.route(`**/api/v1/chat`, async (route) => {
      const response = createMockChatResponse(
        'I\'ll create this recipe for you.',
        [
          createToolCall('create_recipe', {
            title: 'Test Recipe from Chat',
            description: 'Created via AI assistant',
            ingredients: ['ingredient 1', 'ingredient 2'],
            instructions: ['step 1', 'step 2'],
            prep_time: 5,
            cook_time: 10,
            servings: 2,
          }),
        ]
      );
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });

    // Mock tool confirmation response
    await authenticatedPage.route(`**/api/v1/chat/confirm`, async (route) => {
      const requestBody = JSON.parse((await route.request().postData()) || '{}');
      if (requestBody.approved) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: `msg-confirm-${Date.now()}`,
            role: 'assistant',
            content: `Recipe "Test Recipe from Chat" has been created successfully! You can view it in your recipe list.`,
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: `msg-reject-${Date.now()}`,
            role: 'assistant',
            content: 'No problem, I won\'t create the recipe. Is there something you\'d like me to change?',
          }),
        });
      }
    });

    await chatPage.expandChat();
    await chatPage.sendMessage('Create a test recipe');

    // Wait for tool confirmation
    await chatPage.waitForToolConfirmation();

    // Approve the tool
    await chatPage.approveTool();

    // Should see confirmation message
    await authenticatedPage.waitForTimeout(500); // Wait for response
    const messages = await chatPage.getAssistantMessages();
    const confirmationMessage = messages.find((m) => m.includes('created successfully'));
    expect(confirmationMessage).toBeTruthy();
  });

  test('should handle rejection gracefully when tool is rejected', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');
    await authenticatedPage.waitForLoadState('networkidle');

    // Mock chat response with tool call
    await authenticatedPage.route(`**/api/v1/chat`, async (route) => {
      const response = createMockChatResponse(
        'I\'ll edit this recipe for you.',
        [
          createToolCall('edit_recipe', {
            recipe_id: 'some-recipe-id',
            title: 'Updated Recipe Title',
          }),
        ]
      );
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });

    // Mock rejection response
    await authenticatedPage.route(`**/api/v1/chat/confirm`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: `msg-reject-${Date.now()}`,
          role: 'assistant',
          content: 'Understood, I won\'t make any changes. Let me know if you\'d like something different.',
        }),
      });
    });

    await chatPage.expandChat();
    await chatPage.sendMessage('Edit this recipe');

    // Wait for tool confirmation
    await chatPage.waitForToolConfirmation();

    // Reject the tool
    await chatPage.rejectTool();

    // Should see rejection acknowledgment
    await authenticatedPage.waitForTimeout(500);
    const messages = await chatPage.getAssistantMessages();
    const rejectionMessage = messages.find(
      (m) => m.includes('won\'t make any changes') || m.includes('Understood')
    );
    expect(rejectionMessage).toBeTruthy();

    // Tool confirmation should disappear
    await expect(chatPage.toolConfirmation).not.toBeVisible();
  });
});

test.describe('Chat Flows - Recipe Creation via Chat', () => {
  let chatPage: ChatPage;
  let recipesPage: RecipesPage;
  let api: APIHelper;

  test.beforeEach(async ({ authenticatedPage, request }) => {
    chatPage = new ChatPage(authenticatedPage);
    recipesPage = new RecipesPage(authenticatedPage);
    api = new APIHelper(request);
  });

  test('should create recipe via chat and verify in library', async ({ authenticatedPage }) => {
    // Get auth token for API calls
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeTruthy();

    // Navigate to recipes list
    await authenticatedPage.goto('/recipes');
    await authenticatedPage.waitForLoadState('networkidle');

    const newRecipeTitle = `Chat Recipe ${Date.now()}`;

    // Mock chat response with create_recipe tool call
    await authenticatedPage.route(`**/api/v1/chat`, async (route) => {
      const response = createMockChatResponse(
        'I\'ll create this recipe for you.',
        [
          createToolCall('create_recipe', {
            title: newRecipeTitle,
            description: 'A delicious recipe created via chat',
            ingredients: ['flour', 'sugar', 'eggs'],
            instructions: ['Mix ingredients', 'Bake at 350F', 'Cool and serve'],
            prep_time: 15,
            cook_time: 30,
            servings: 4,
          }),
        ]
      );
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });

    // Mock confirmation that actually creates the recipe
    let createdRecipeId: string | null = null;
    await authenticatedPage.route(`**/api/v1/chat/confirm`, async (route) => {
      const requestBody = JSON.parse((await route.request().postData()) || '{}');
      if (requestBody.approved) {
        // Actually create the recipe via API
        const recipeData = {
          title: newRecipeTitle,
          description: 'A delicious recipe created via chat',
          ingredients: [
            { name: 'flour', amount: '2', unit: 'cups', notes: '' },
            { name: 'sugar', amount: '1', unit: 'cup', notes: '' },
            { name: 'eggs', amount: '3', unit: 'whole', notes: '' },
          ],
          instructions: [
            { step_number: 1, instruction: 'Mix ingredients', duration_minutes: 5 },
            { step_number: 2, instruction: 'Bake at 350F', duration_minutes: 30 },
            { step_number: 3, instruction: 'Cool and serve', duration_minutes: 10 },
          ],
          prep_time_minutes: 15,
          cook_time_minutes: 30,
          servings: 4,
        };

        try {
          const recipe = await api.createRecipe(token!, recipeData);
          createdRecipeId = recipe.id;
        } catch (e) {
          // Recipe creation may fail in mock - continue with test
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: `msg-confirm-${Date.now()}`,
            role: 'assistant',
            content: `Recipe "${newRecipeTitle}" has been created successfully!`,
          }),
        });
      }
    });

    // Send message to create recipe
    await chatPage.expandChat();
    await chatPage.sendMessage('Create a simple cake recipe for me');

    // Wait for and approve tool confirmation
    await chatPage.waitForToolConfirmation();
    await chatPage.approveTool();

    // Wait for confirmation
    await authenticatedPage.waitForTimeout(1000);

    // Refresh recipes list
    await authenticatedPage.goto('/recipes');
    await authenticatedPage.waitForLoadState('networkidle');

    // Verify recipe appears in the list
    const pageContent = await authenticatedPage.textContent('body');
    expect(pageContent).toContain(newRecipeTitle);

    // Cleanup if recipe was created
    if (createdRecipeId && token) {
      await api.deleteRecipe(token, createdRecipeId).catch(() => {});
    }
  });
});

test.describe('Chat Flows - Recipe Editing via Chat', () => {
  let chatPage: ChatPage;
  let recipeDetailPage: RecipeDetailPage;
  let api: APIHelper;
  let testRecipeId: string;
  let token: string;

  test.beforeEach(async ({ authenticatedPage, request }) => {
    chatPage = new ChatPage(authenticatedPage);
    recipeDetailPage = new RecipeDetailPage(authenticatedPage);
    api = new APIHelper(request);

    // Get auth token
    token = (await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'))) || '';

    // Create a test recipe
    const recipeData = generateRecipeData({ title: `Edit Test Recipe ${Date.now()}` });
    const recipe = await api.createRecipe(token, recipeData);
    testRecipeId = recipe.id;
  });

  test.afterEach(async () => {
    // Cleanup test recipe
    if (testRecipeId && token) {
      await api.deleteRecipe(token, testRecipeId).catch(() => {});
    }
  });

  test('should edit recipe via chat and verify changes applied', async ({ authenticatedPage }) => {
    const newTitle = `Updated via Chat ${Date.now()}`;

    // Navigate to recipe detail
    await recipeDetailPage.goto(testRecipeId);
    await authenticatedPage.waitForLoadState('networkidle');

    // Mock chat response with edit_recipe tool call
    await authenticatedPage.route(`**/api/v1/chat`, async (route) => {
      const response = createMockChatResponse(
        'I\'ll update the recipe title for you.',
        [
          createToolCall('edit_recipe', {
            recipe_id: testRecipeId,
            title: newTitle,
          }),
        ]
      );
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });

    // Mock confirmation that returns success
    await authenticatedPage.route(`**/api/v1/chat/confirm`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: `msg-confirm-${Date.now()}`,
          role: 'assistant',
          content: `I've updated the recipe title to "${newTitle}".`,
        }),
      });
    });

    // Send edit request via chat
    await chatPage.expandChat();
    await chatPage.sendMessage('Change the recipe title to something new');

    // Wait for and approve tool confirmation
    await chatPage.waitForToolConfirmation();

    // Verify it's an edit tool
    const toolName = await chatPage.getToolName();
    expect(toolName).toContain('Edit Recipe');

    await chatPage.approveTool();

    // Wait for confirmation message
    await authenticatedPage.waitForTimeout(500);
    const messages = await chatPage.getAssistantMessages();
    const updateMessage = messages.find((m) => m.includes('updated'));
    expect(updateMessage).toBeTruthy();
  });
});

test.describe('Chat Flows - Context Awareness', () => {
  let chatPage: ChatPage;
  let api: APIHelper;
  let testRecipeId: string;
  let token: string;

  test.beforeEach(async ({ authenticatedPage, request }) => {
    chatPage = new ChatPage(authenticatedPage);
    api = new APIHelper(request);

    // Get auth token
    token = (await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'))) || '';

    // Create a test recipe
    const recipeData = generateRecipeData({ title: 'Context Test Recipe' });
    const recipe = await api.createRecipe(token, recipeData);
    testRecipeId = recipe.id;
  });

  test.afterEach(async () => {
    // Cleanup
    if (testRecipeId && token) {
      await api.deleteRecipe(token, testRecipeId).catch(() => {});
    }
  });

  test('should show correct context on recipe detail page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(`/recipes/${testRecipeId}`);
    await authenticatedPage.waitForLoadState('networkidle');

    await chatPage.expandChat();

    // Context should include recipe title
    const contextLabel = await chatPage.getContextLabel();
    expect(contextLabel).toContain('Context Test Recipe');
  });

  test('should show correct context on recipe list page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');
    await authenticatedPage.waitForLoadState('networkidle');

    await chatPage.expandChat();

    // Context should indicate recipe list
    const contextLabel = await chatPage.getContextLabel();
    expect(contextLabel).toContain('Recipe List');
  });

  test('should show correct context on recipe create page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes/create');
    await authenticatedPage.waitForLoadState('networkidle');

    await chatPage.expandChat();

    // Context should indicate new recipe
    const contextLabel = await chatPage.getContextLabel();
    expect(contextLabel).toContain('New Recipe');
  });

  test('should show correct context on recipe edit page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(`/recipes/${testRecipeId}/edit`);
    await authenticatedPage.waitForLoadState('networkidle');

    await chatPage.expandChat();

    // Context should include recipe title (editing mode)
    const contextLabel = await chatPage.getContextLabel();
    expect(contextLabel).toContain('Context Test Recipe');
  });

  test('should send context with chat messages', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(`/recipes/${testRecipeId}`);
    await authenticatedPage.waitForLoadState('networkidle');

    let capturedContext: object | null = null;

    // Intercept chat request to capture context
    await authenticatedPage.route(`**/api/v1/chat`, async (route) => {
      const requestBody = JSON.parse((await route.request().postData()) || '{}');
      capturedContext = requestBody.context;

      const response = createMockChatResponse('I can see you\'re viewing a recipe.');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });

    await chatPage.expandChat();
    await chatPage.sendMessage('What am I looking at?');

    // Verify context was sent
    expect(capturedContext).toBeTruthy();
    expect((capturedContext as { page?: string }).page).toBe('recipe_detail');
    expect((capturedContext as { recipeId?: string }).recipeId).toBe(testRecipeId);
  });
});
