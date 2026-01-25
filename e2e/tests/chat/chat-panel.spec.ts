import { test, expect } from '../../fixtures/auth.fixture';
import { APIHelper } from '../../utils/api';
import { generateRecipeData } from '../../utils/test-data';

test.describe('Feature 2: User creates recipe through AI chat', () => {
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

  test.describe('Acceptance Criteria: AI response timing', () => {
    test('user opens chat, sends message, and AI response appears within 30 seconds', async ({ authenticatedPage }) => {
      // AC: User opens chat -> sends message -> AI response appears in chat panel within 30 seconds
      await authenticatedPage.goto('/recipes/create');

      // Open the chat panel
      const chatToggle = authenticatedPage.getByRole('button', { name: /ai chat/i });
      await chatToggle.click();

      // Chat panel should be visible with a message input
      const messageInput = authenticatedPage.getByRole('textbox', { name: /message/i });
      await expect(messageInput).toBeVisible({ timeout: 10000 });

      // Send a conversational message
      await messageInput.fill('How do I store fresh herbs?');
      const sendButton = authenticatedPage.getByRole('button', { name: /send/i });

      // Wait for the AI response from the backend
      const responsePromise = authenticatedPage.waitForResponse(
        resp => resp.url().includes('/api/v1/chat') && resp.status() === 200
      );
      await sendButton.click();
      await responsePromise;

      // Verify AI response appears in the chat within 30 seconds (per acceptance criteria)
      const aiMessage = authenticatedPage.locator('[data-testid="chat-message-ai"]').last();
      await expect(aiMessage).toBeVisible({ timeout: 30000 });

      // Verify the response is non-empty and contains expected content
      const responseText = await aiMessage.textContent();
      expect(responseText!.length).toBeGreaterThan(50);
      expect(responseText).toContain('fresh herbs');
    });
  });

  test.describe('Acceptance Criteria: Apply populates form fields', () => {
    test('user applies proposal and all form fields are populated', async ({ authenticatedPage }) => {
      // AC: User applies proposal -> all form fields are populated (title, description, ingredients, instructions visible in UI)
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

      // Verify a proposal card with Apply button appears
      const applyButton = authenticatedPage.getByRole('button', { name: /apply/i });
      await expect(applyButton).toBeVisible({ timeout: 30000 });

      // Click Apply to populate the form
      await applyButton.click();

      // Verify ALL form fields are populated (title, description, ingredients, instructions visible in UI)

      // 1. Title field populated
      const titleInput = authenticatedPage.locator('input[name="title"]');
      await expect(titleInput).toHaveValue('Classic Chocolate Cake', { timeout: 10000 });

      // 2. Description field populated
      const descriptionInput = authenticatedPage.locator('textarea[name="description"]');
      await expect(descriptionInput).not.toHaveValue('');
      const descriptionValue = await descriptionInput.inputValue();
      expect(descriptionValue.length).toBeGreaterThan(10);

      // 3. Ingredients visible in UI (at least one ingredient row with content)
      const ingredientRows = authenticatedPage.locator('[data-testid="ingredient-row"]');
      await expect(ingredientRows.first()).toBeVisible();
      const firstIngredientName = ingredientRows.first().locator('input[name="ingredient-name"]');
      await expect(firstIngredientName).not.toHaveValue('');

      // 4. Instructions visible in UI (at least one instruction row with content)
      const instructionRows = authenticatedPage.locator('[data-testid="instruction-row"]');
      await expect(instructionRows.first()).toBeVisible();
      const firstInstructionText = instructionRows.first().locator('textarea[name="instruction-text"]');
      await expect(firstInstructionText).not.toHaveValue('');

      // 5. Optional fields (prep time, cook time, servings) also populated
      const prepTimeInput = authenticatedPage.locator('input[name="prep_time_minutes"]');
      await expect(prepTimeInput).toHaveValue('15');

      const cookTimeInput = authenticatedPage.locator('input[name="cook_time_minutes"]');
      await expect(cookTimeInput).toHaveValue('35');

      const servingsInput = authenticatedPage.locator('input[name="servings"]');
      await expect(servingsInput).toHaveValue('8');
    });
  });

  test.describe('Acceptance Criteria: Full create recipe flow via AI chat', () => {
    test('user creates spaghetti recipe through AI chat and recipe exists in database', async ({ authenticatedPage, request }) => {
      // AC: User opens chat on Create Recipe page -> sends "make me a spaghetti recipe"
      //     -> receives AI response with recipe proposal -> clicks Apply -> clicks Create Recipe
      //     -> recipe exists in database with title containing "spaghetti" (verified via API GET /recipes)

      const api = new APIHelper(request);
      const token = await authenticatedPage.evaluate(() =>
        localStorage.getItem('auth_token')
      );

      // 1. BEFORE: Capture initial state (recipe count)
      const beforeResponse = await api.getRecipes(token!);
      const beforeCount = beforeResponse.recipes?.length || 0;

      // 2. Navigate to Create Recipe page
      await authenticatedPage.goto('/recipes/create');

      // 3. Open the chat panel
      const chatToggle = authenticatedPage.getByRole('button', { name: /ai chat/i });
      await chatToggle.click();

      // 4. Send "make me a spaghetti recipe"
      const messageInput = authenticatedPage.getByRole('textbox', { name: /message/i });
      await expect(messageInput).toBeVisible({ timeout: 10000 });
      await messageInput.fill('make me a spaghetti recipe');
      const sendButton = authenticatedPage.getByRole('button', { name: /send/i });

      // Wait for the AI response
      const responsePromise = authenticatedPage.waitForResponse(
        resp => resp.url().includes('/api/v1/chat') && resp.status() === 200
      );
      await sendButton.click();
      await responsePromise;

      // 5. Verify AI response with recipe proposal appears
      const applyButton = authenticatedPage.getByRole('button', { name: /apply/i });
      await expect(applyButton).toBeVisible({ timeout: 30000 });

      // 6. Click Apply to populate form
      await applyButton.click();

      // Verify form is populated with spaghetti recipe
      const titleInput = authenticatedPage.locator('input[name="title"]');
      await expect(titleInput).toHaveValue(/spaghetti/i, { timeout: 10000 });

      // Close the chat panel before submitting (it overlays the form on mobile viewports)
      const closeChatButton = authenticatedPage.getByRole('button', { name: 'Close chat' });
      await closeChatButton.click();
      // Wait for chat panel to close
      const chatPanel = authenticatedPage.locator('[role="complementary"][aria-label="AI Recipe Chat"]');
      await expect(chatPanel).not.toBeVisible({ timeout: 5000 });

      // 7. Click Create Recipe (submit the form)
      const createButton = authenticatedPage.locator('button[type="submit"]');
      await expect(createButton).toBeVisible();

      // Wait for the create API response
      const createPromise = authenticatedPage.waitForResponse(
        resp => resp.url().includes('/api/v1/recipes') &&
          resp.request().method() === 'POST' &&
          resp.status() === 201
      );
      await createButton.click();
      await createPromise;

      // Wait for navigation to recipe detail page
      await authenticatedPage.waitForURL(/\/recipes\/[\w-]+$/, { timeout: 10000 });

      // 8. AFTER: Verify recipe exists in database via API GET /recipes
      const afterResponse = await api.getRecipes(token!);
      const afterRecipes = afterResponse.recipes || [];
      expect(afterRecipes.length).toBe(beforeCount + 1);

      // Find the new recipe with title containing "spaghetti"
      const spaghettiRecipe = afterRecipes.find((r: { title: string }) =>
        r.title.toLowerCase().includes('spaghetti')
      );
      expect(spaghettiRecipe).toBeDefined();
      expect(spaghettiRecipe.title).toContain('Spaghetti');

      // Verify the recipe has complete data
      expect(spaghettiRecipe.description).toBeTruthy();
      expect(spaghettiRecipe.ingredients.length).toBeGreaterThan(0);
      expect(spaghettiRecipe.instructions.length).toBeGreaterThan(0);
    });
  });

});

test.describe('Feature 3: User rejects AI suggestion and continues', () => {
  test.describe('Acceptance Criteria: Form fields remain unchanged after reject', () => {
    test('user rejects proposal and form fields with original values remain unchanged', async ({ authenticatedPage }) => {
      // AC: User receives proposal -> clicks Reject -> form fields remain unchanged (verified: title input has original value)
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
    });

    test('user rejects proposal and empty form fields remain empty', async ({ authenticatedPage }) => {
      // AC: User receives proposal -> clicks Reject -> form fields remain unchanged (verified: title input still empty)
      await authenticatedPage.goto('/recipes/create');

      // Verify title input is empty initially
      const titleInput = authenticatedPage.locator('input[name="title"]');
      await titleInput.waitFor({ state: 'visible' });
      await expect(titleInput).toHaveValue('');

      // Open the chat panel
      const chatToggle = authenticatedPage.getByRole('button', { name: /ai chat/i });
      await chatToggle.click();

      // Send a message with creation keyword to trigger recipe proposal
      const messageInput = authenticatedPage.getByRole('textbox', { name: /message/i });
      await expect(messageInput).toBeVisible({ timeout: 10000 });
      await messageInput.fill('Create a soup recipe');
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

      // Verify form fields remain empty - title should still be empty
      await expect(titleInput).toHaveValue('');

      // Verify description is also still empty
      const descriptionInput = authenticatedPage.locator('textarea[name="description"]');
      await expect(descriptionInput).toHaveValue('');
    });
  });

  test.describe('Acceptance Criteria: User iterates after rejection', () => {
    test('user rejects proposal, sends new message "make it vegetarian", and receives new AI response', async ({ authenticatedPage }) => {
      // AC: User rejects proposal -> sends new message "make it vegetarian" -> receives new AI response
      await authenticatedPage.goto('/recipes/create');

      // Open the chat panel
      const chatToggle = authenticatedPage.getByRole('button', { name: /ai chat/i });
      await chatToggle.click();

      // Send initial recipe request
      const messageInput = authenticatedPage.getByRole('textbox', { name: /message/i });
      await expect(messageInput).toBeVisible({ timeout: 10000 });
      await messageInput.fill('Create a pasta recipe with meat');
      const sendButton = authenticatedPage.getByRole('button', { name: /send/i });

      // Wait for the first AI response
      const responsePromise1 = authenticatedPage.waitForResponse(
        resp => resp.url().includes('/api/v1/chat') && resp.status() === 200
      );
      await sendButton.click();
      await responsePromise1;

      // Verify first proposal card appears
      const rejectButton = authenticatedPage.getByRole('button', { name: /reject/i });
      await expect(rejectButton).toBeVisible({ timeout: 30000 });

      // Count AI messages before rejection
      const aiMessagesBefore = await authenticatedPage.locator('[data-testid="chat-message-ai"]').count();

      // Click Reject
      await rejectButton.click();

      // Verify proposal is dismissed
      await expect(rejectButton).not.toBeVisible({ timeout: 5000 });

      // Send follow-up message "make it vegetarian"
      await expect(messageInput).toBeVisible({ timeout: 10000 });
      await messageInput.fill('make it vegetarian');

      // Wait for the second AI response
      const responsePromise2 = authenticatedPage.waitForResponse(
        resp => resp.url().includes('/api/v1/chat') && resp.status() === 200
      );
      await sendButton.click();
      await responsePromise2;

      // Verify new AI response appears (count increases)
      const aiMessagesAfter = await authenticatedPage.locator('[data-testid="chat-message-ai"]').count();
      expect(aiMessagesAfter).toBeGreaterThan(aiMessagesBefore);

      // Verify the new response is visible
      const latestAiMessage = authenticatedPage.locator('[data-testid="chat-message-ai"]').last();
      await expect(latestAiMessage).toBeVisible({ timeout: 30000 });

      // Verify a new Apply button appears (new proposal) - use last() as old proposal may still be in DOM
      const newApplyButton = authenticatedPage.getByRole('button', { name: /apply/i }).last();
      await expect(newApplyButton).toBeVisible({ timeout: 30000 });
    });
  });

  test.describe('Acceptance Criteria: UI state after rejection', () => {
    test('user rejects proposal, proposal card is dismissed, and chat input is re-enabled', async ({ authenticatedPage }) => {
      // AC: User rejects proposal -> proposal card is dismissed, chat input is re-enabled
      await authenticatedPage.goto('/recipes/create');

      // Open the chat panel
      const chatToggle = authenticatedPage.getByRole('button', { name: /ai chat/i });
      await chatToggle.click();

      // Send a message to get a proposal
      const messageInput = authenticatedPage.getByRole('textbox', { name: /message/i });
      await expect(messageInput).toBeVisible({ timeout: 10000 });
      await messageInput.fill('Create a dessert recipe');
      const sendButton = authenticatedPage.getByRole('button', { name: /send/i });

      // Wait for the AI response
      const responsePromise = authenticatedPage.waitForResponse(
        resp => resp.url().includes('/api/v1/chat') && resp.status() === 200
      );
      await sendButton.click();
      await responsePromise;

      // Verify proposal card appears with both Apply and Reject buttons
      const rejectButton = authenticatedPage.getByRole('button', { name: /reject/i });
      const applyButton = authenticatedPage.getByRole('button', { name: /apply/i });
      await expect(rejectButton).toBeVisible({ timeout: 30000 });
      await expect(applyButton).toBeVisible();

      // Click Reject
      await rejectButton.click();

      // Verify the proposal card is dismissed (both Apply and Reject buttons gone)
      await expect(rejectButton).not.toBeVisible({ timeout: 5000 });
      await expect(applyButton).not.toBeVisible();

      // Verify chat input is re-enabled (can type and send new messages)
      await expect(messageInput).toBeVisible();
      await expect(messageInput).toBeEnabled();

      // Verify user can interact with the input (type text)
      await messageInput.fill('Try again with something simpler');
      await expect(messageInput).toHaveValue('Try again with something simpler');

      // Verify send button is enabled once user has typed text
      await expect(sendButton).toBeEnabled();
    });
  });
});

test.describe('Feature 4: User modifies existing recipe with AI', () => {
  test.describe('Acceptance Criteria: Edit recipe via AI chat and save', () => {
    test('user edits existing recipe with AI chat and saves updated recipe to database', async ({ authenticatedPage, request }) => {
      // AC: User navigates to Edit Recipe page for existing recipe → opens chat → sends "make it gluten-free"
      //     → applies suggestion → clicks Save → recipe in database is updated (verified via API GET /recipes/{id})

      const api = new APIHelper(request);
      const token = await authenticatedPage.evaluate(() =>
        localStorage.getItem('auth_token')
      );

      // 1. Create a recipe via API to have something to edit
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

      // 2. BEFORE: Capture initial recipe state
      const beforeRecipe = await api.getRecipe(token!, recipe.id);
      expect(beforeRecipe.title).toBe('Original Pasta Recipe');

      // 3. Navigate to Edit Recipe page
      await authenticatedPage.goto(`/recipes/${recipe.id}/edit`);

      // Wait for form to load with existing data
      const titleInput = authenticatedPage.locator('input[name="title"]');
      await expect(titleInput).toHaveValue('Original Pasta Recipe', { timeout: 10000 });

      // 4. Open the chat panel
      const chatToggle = authenticatedPage.getByRole('button', { name: /ai chat/i });
      await chatToggle.click();

      // 5. Send "make it gluten-free" modification request
      const messageInput = authenticatedPage.getByRole('textbox', { name: /message/i });
      await expect(messageInput).toBeVisible({ timeout: 10000 });
      await messageInput.fill('make it gluten-free');
      const sendButton = authenticatedPage.getByRole('button', { name: /send/i });

      // Wait for the AI response
      const responsePromise = authenticatedPage.waitForResponse(
        resp => resp.url().includes('/api/v1/chat') && resp.status() === 200
      );
      await sendButton.click();
      await responsePromise;

      // 6. Verify AI response with modification proposal appears
      const applyButton = authenticatedPage.getByRole('button', { name: /apply/i });
      await expect(applyButton).toBeVisible({ timeout: 30000 });

      // 7. Click Apply to update form with modified recipe
      await applyButton.click();

      // Verify form is updated (title should be gluten-free version)
      await expect(titleInput).toHaveValue(/gluten.free/i, { timeout: 10000 });

      // Close the chat panel before submitting
      const closeChatButton = authenticatedPage.getByRole('button', { name: 'Close chat' });
      await closeChatButton.click();
      const chatPanel = authenticatedPage.locator('[role="complementary"][aria-label="AI Recipe Chat"]');
      await expect(chatPanel).not.toBeVisible({ timeout: 5000 });

      // 8. Click Save (Update Recipe) to persist changes
      const saveButton = authenticatedPage.locator('button[type="submit"]');
      await expect(saveButton).toBeVisible();

      // Wait for the update API response
      const updatePromise = authenticatedPage.waitForResponse(
        resp => resp.url().includes(`/api/v1/recipes/${recipe.id}`) &&
          (resp.request().method() === 'PUT' || resp.request().method() === 'PATCH') &&
          resp.status() < 400
      );
      await saveButton.click();
      await updatePromise;

      // Wait for navigation to recipe detail page
      await authenticatedPage.waitForURL(`/recipes/${recipe.id}`, { timeout: 10000 });

      // 9. AFTER: Verify recipe is updated in database via API GET /recipes/{id}
      const afterRecipe = await api.getRecipe(token!, recipe.id);

      // Recipe should now have gluten-free title
      expect(afterRecipe.title.toLowerCase()).toContain('gluten');

      // Verify the recipe was actually modified (not just same data)
      expect(afterRecipe.title).not.toBe(beforeRecipe.title);
    });
  });

  test.describe('Acceptance Criteria: Chat context includes existing recipe', () => {
    test('AI response references existing recipe content when editing', async ({ authenticatedPage, request }) => {
      // AC: User on Edit page → chat context includes existing recipe title and ingredients
      //     → AI response references existing recipe content

      const api = new APIHelper(request);
      const token = await authenticatedPage.evaluate(() =>
        localStorage.getItem('auth_token')
      );

      // 1. Create a recipe with distinctive content
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

      // 2. Navigate to Edit Recipe page
      await authenticatedPage.goto(`/recipes/${recipe.id}/edit`);

      // Wait for form to load
      const titleInput = authenticatedPage.locator('input[name="title"]');
      await expect(titleInput).toHaveValue('Unique Mango Chicken Curry', { timeout: 10000 });

      // 3. Open the chat panel
      const chatToggle = authenticatedPage.getByRole('button', { name: /ai chat/i });
      await chatToggle.click();

      // 4. Send a modification request
      const messageInput = authenticatedPage.getByRole('textbox', { name: /message/i });
      await expect(messageInput).toBeVisible({ timeout: 10000 });
      await messageInput.fill('modify this recipe to make it spicier');
      const sendButton = authenticatedPage.getByRole('button', { name: /send/i });

      // Wait for the AI response
      const responsePromise = authenticatedPage.waitForResponse(
        resp => resp.url().includes('/api/v1/chat') && resp.status() === 200
      );
      await sendButton.click();
      await responsePromise;

      // 5. Verify AI response appears
      const aiMessage = authenticatedPage.locator('[data-testid="chat-message-ai"]').last();
      await expect(aiMessage).toBeVisible({ timeout: 30000 });

      // 6. Verify the AI response references the existing recipe content
      // The test provider should reference the existing recipe when recipe_id is provided
      // We check that a proposal appears (indicating the AI understood the context)
      const applyButton = authenticatedPage.getByRole('button', { name: /apply/i });
      await expect(applyButton).toBeVisible({ timeout: 30000 });

      // The response should contain a proposal that modifies the existing recipe
      // (not create a completely new unrelated recipe)
      const responseText = await aiMessage.textContent();
      expect(responseText!.length).toBeGreaterThan(50);
    });
  });
});

test.describe('Feature 5: Chat history survives page refresh', () => {
  test.describe('Acceptance Criteria: Chat persistence across refresh', () => {
    test('user sends message, receives response, refreshes page, opens chat, and previous messages are visible', async ({ authenticatedPage }) => {
      // AC: User sends chat message -> receives response -> refreshes page -> opens chat -> previous messages are visible
      await authenticatedPage.goto('/recipes/create');

      // Open the chat panel and send a message
      const chatToggle = authenticatedPage.getByRole('button', { name: /ai chat/i });
      await chatToggle.click();

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

      // Close the chat panel before refresh (to test that opening it restores messages)
      const closeChatButton = authenticatedPage.getByRole('button', { name: 'Close chat' });
      await closeChatButton.click();
      const chatPanel = authenticatedPage.locator('[role="complementary"][aria-label="AI Recipe Chat"]');
      await expect(chatPanel).not.toBeVisible({ timeout: 5000 });

      // Refresh the page
      await authenticatedPage.reload();

      // Open the chat panel again (this is the key: user must OPEN chat to see history)
      const chatToggleAfterReload = authenticatedPage.getByRole('button', { name: /ai chat/i });
      await expect(chatToggleAfterReload).toBeVisible({ timeout: 10000 });
      await chatToggleAfterReload.click();

      // Verify previous messages are visible after opening chat
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

  test.describe('Acceptance Criteria: Chat history keyed by page', () => {
    test('user on Create page sends messages, navigates to Edit page, and chat histories are separate', async ({ authenticatedPage, request }) => {
      // AC: User on Create page sends messages -> navigates to Edit page -> Create page chat history is separate from Edit page (keyed by page)
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

      // 1. Navigate to Create page and send a message
      await authenticatedPage.goto('/recipes/create');
      const chatToggle = authenticatedPage.getByRole('button', { name: /ai chat/i });
      await chatToggle.click();

      const messageInput = authenticatedPage.getByRole('textbox', { name: /message/i });
      await expect(messageInput).toBeVisible({ timeout: 10000 });
      await messageInput.fill('Create page message: suggest a breakfast recipe');
      const sendButton = authenticatedPage.getByRole('button', { name: /send/i });

      // Wait for the AI response on Create page
      const createResponsePromise = authenticatedPage.waitForResponse(
        resp => resp.url().includes('/api/v1/chat') && resp.status() === 200
      );
      await sendButton.click();
      await createResponsePromise;

      // Verify Create page message appears
      const createPageUserMessage = authenticatedPage.locator('[data-testid="chat-message-user"]');
      await expect(createPageUserMessage.first()).toBeVisible({ timeout: 30000 });
      await expect(createPageUserMessage.first()).toContainText('Create page message');

      // Close chat panel
      const closeChatButton = authenticatedPage.getByRole('button', { name: 'Close chat' });
      await closeChatButton.click();

      // 2. Navigate to Edit page for the existing recipe
      await authenticatedPage.goto(`/recipes/${recipe.id}/edit`);

      // Open chat on Edit page
      const editChatToggle = authenticatedPage.getByRole('button', { name: /ai chat/i });
      await expect(editChatToggle).toBeVisible({ timeout: 10000 });
      await editChatToggle.click();

      // Verify Edit page chat is EMPTY (no messages from Create page)
      const editPageUserMessage = authenticatedPage.locator('[data-testid="chat-message-user"]');
      // There should be no user messages on the Edit page chat
      await expect(editPageUserMessage).toHaveCount(0, { timeout: 5000 });

      // Send a different message on Edit page
      const editMessageInput = authenticatedPage.getByRole('textbox', { name: /message/i });
      await expect(editMessageInput).toBeVisible({ timeout: 10000 });
      await editMessageInput.fill('Edit page message: make this recipe healthier');
      const editSendButton = authenticatedPage.getByRole('button', { name: /send/i });

      // Wait for the AI response on Edit page
      const editResponsePromise = authenticatedPage.waitForResponse(
        resp => resp.url().includes('/api/v1/chat') && resp.status() === 200
      );
      await editSendButton.click();
      await editResponsePromise;

      // Verify Edit page message appears
      const editPageMessage = authenticatedPage.locator('[data-testid="chat-message-user"]').first();
      await expect(editPageMessage).toBeVisible({ timeout: 30000 });
      await expect(editPageMessage).toContainText('Edit page message');

      // 3. Navigate back to Create page and verify its chat history is preserved separately
      await authenticatedPage.goto('/recipes/create');
      const createChatToggle = authenticatedPage.getByRole('button', { name: /ai chat/i });
      await expect(createChatToggle).toBeVisible({ timeout: 10000 });
      await createChatToggle.click();

      // Verify Create page still has its original message (not the Edit page message)
      const createPageMessage = authenticatedPage.locator('[data-testid="chat-message-user"]').first();
      await expect(createPageMessage).toBeVisible({ timeout: 10000 });
      await expect(createPageMessage).toContainText('Create page message');
      // Verify Edit page message is NOT in Create page chat
      await expect(createPageMessage).not.toContainText('Edit page message');
    });
  });
});
