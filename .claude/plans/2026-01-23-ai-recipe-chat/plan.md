# Plan: AI Recipe Chat

## Overview

Transform the AI Recipe Chat brainstorm into 5 independently executable features, each sized for one TDD round. The features build on each other sequentially: user preferences → form refactor → LLM backend → chat API → chat frontend.

## Feature Order

1. **User Preferences** (no dependencies) — Backend: new fields, migration, API endpoint; Frontend: settings page; E2E: settings flow
2. **RecipeForm Controlled Refactor** (no dependencies) — Lift form state to parent pages, make RecipeForm controlled; E2E: verify no regression
3. **LLM Client Layer** (no dependencies) — LiteLLM integration, prompt builder, response parser, test provider
4. **Chat API Endpoint** (depends on 1, 3) — POST /api/v1/chat with context assembly and LLM orchestration
5. **Chat Frontend Panel** (depends on 2, 4) — Side panel UI, sessionStorage persistence, apply/reject flow, accessibility

---

## Feature 1: User Preferences

### Summary

Add dietary_restrictions, skill_level, and default_servings fields to the user model. Create a PATCH endpoint for updating preferences and a simple settings page in the frontend.

### Layers

[E2E, Backend, Frontend]

### Acceptance Criteria

- [ ] User can navigate to a settings page from the app nav
- [ ] User can set dietary restrictions (multi-select from predefined tags)
- [ ] User can set skill level (beginner/intermediate/advanced)
- [ ] User can set default servings (number input, min 1, max 100)
- [ ] Preferences persist across sessions (saved to DB)
- [ ] Settings page shows current saved preferences on load
- [ ] Partial updates work (setting only dietary_restrictions leaves other fields unchanged)

### Backend

**Tests:**
- Integration: PATCH /api/v1/users/me/preferences updates user record
- Integration: GET /api/v1/users/me returns preference fields in response
- Integration: Partial update (only dietary_restrictions) leaves other fields unchanged
- Integration: Invalid skill_level value returns 422
- Integration: dietary_restrictions validates against allowed tag values
- Integration: dietary_restrictions rejects duplicates
- Integration: default_servings validates range (1-100)
- Integration: Unauthenticated request returns 401
- Integration: updated_at is bumped after preferences update

**Implementation:**
- Alembic migration: add `dietary_restrictions` (JSON, default null), `skill_level` (String, nullable), `default_servings` (Integer, nullable) to users table
- Update User model with new columns
- New schema: `UserPreferencesUpdate` (all fields optional)
  - `dietary_restrictions`: Optional[list[str]], validate values against allowed tags, enforce uniqueness
  - `skill_level`: Optional[str], validate against Literal["beginner", "intermediate", "advanced"]
  - `default_servings`: Optional[int], ge=1, le=100
- Update `UserResponse` to include new fields (all Optional, default None)
- New endpoint: `PATCH /api/v1/users/me/preferences` on users router
- Allowed dietary tags: vegetarian, vegan, gluten-free, dairy-free, keto, paleo, low-carb, nut-free, soy-free

### Frontend

**Tests:**
- Component: Settings page renders with empty defaults for new user
- Component: Settings page loads and displays existing preferences
- Component: Submitting preferences calls API with correct payload
- Component: Validation prevents invalid servings (< 1 or > 100)
- Component: Success message shown after save
- Integration: Full save/reload cycle shows persisted values (MSW)

**Implementation:**
- New page: `SettingsPage.tsx` at route `/settings`
- Add route to `App.tsx` router configuration
- Dietary restrictions: checkbox group (vegetarian, vegan, gluten-free, dairy-free, keto, paleo, low-carb, nut-free, soy-free)
- Skill level: radio group (beginner, intermediate, advanced)
- Default servings: number input (min 1, max 100)
- Save button calls `PATCH /api/v1/users/me/preferences`
- Success/error feedback toast or inline message
- Add navigation link to settings in app header/nav
- Update `User` type in `frontend/src/types/index.ts` to include `dietaryRestrictions`, `skillLevel`, `defaultServings`
- Add `updatePreferences()` to existing `authApi.ts` (keep user-related calls in one file)
- Update MSW handlers and `mockUser()` factory in test mocks to include preference fields
- MSW handler for PATCH preferences endpoint

### E2E Tests

- Flow: Navigate to settings, set preferences, save, refresh page, verify values persist
- Flow: Partial update (change only skill level), verify other preferences unchanged

### Breaking Changes

- UserResponse schema adds new optional fields — existing frontend code unaffected (fields are nullable)
- `mockUser()` test factory and MSW handlers need updating to include new fields (migration concern)
- `.env.example` should document that no new env vars are needed for this feature

---

## Feature 2: RecipeForm Controlled Refactor

### Summary

Refactor RecipeForm from an uncontrolled component (internal useState) to a controlled component that receives form state and onChange from its parent. Add a `mode` prop to distinguish create vs edit. This enables the chat panel to update form state externally.

### Layers

[E2E, Frontend]

### Acceptance Criteria

- [ ] Create Recipe page works identically to before (user can fill form, submit, navigate to detail)
- [ ] Edit Recipe page works identically to before (loads existing recipe, user can edit, submit)
- [ ] Submit button shows "Create Recipe" in create mode and "Update Recipe" in edit mode
- [ ] All existing RecipeForm tests pass (adapted to new props interface)
- [ ] Form validation still works on submit
- [ ] Dynamic ingredient/instruction add/remove still works
- [ ] Existing E2E recipe tests pass without modification

### Frontend

**Tests:**
- Component: RecipeForm renders with provided value prop
- Component: RecipeForm shows "Create Recipe" button when mode is "create"
- Component: RecipeForm shows "Update Recipe" button when mode is "edit"
- Component: RecipeForm calls onChange when user types in title
- Component: RecipeForm calls onChange when user adds/removes ingredient
- Component: RecipeForm calls onChange when user adds/removes instruction
- Component: RecipeForm calls onChange when user toggles dietary tag
- Component: Validation errors display on submit with invalid data
- Component: onSubmit called with current value when form is valid
- Integration: CreateRecipePage manages state and passes value/onChange to RecipeForm
- Integration: EditRecipePage fetches recipe, manages state, passes value/onChange to RecipeForm

**Implementation:**
- Change RecipeForm props:
  ```typescript
  interface RecipeFormProps {
    value: RecipeFormData;
    onChange: (data: RecipeFormData) => void;
    onSubmit: (data: RecipeFormData) => Promise<void>;
    onCancel: () => void;
    mode: 'create' | 'edit';
    isSubmitting?: boolean;
  }
  ```
- Remove all internal useState for form fields from RecipeForm — derive everything from `value` prop
- Replace setState calls with `onChange({...value, [field]: newValue})` calls
- Use `mode` prop for submit button text: `mode === 'create' ? 'Create Recipe' : 'Update Recipe'`
- Keep validation logic inside RecipeForm (validate on submit, display errors via local error state)
- Create `DEFAULT_RECIPE_FORM_DATA` constant in `types/index.ts`:
  ```typescript
  export const DEFAULT_RECIPE_FORM_DATA: RecipeFormData = {
    title: '', description: '', ingredients: [{ name: '', amount: '', unit: '' }],
    instructions: [{ stepNumber: 1, instruction: '' }], prepTimeMinutes: 0,
    cookTimeMinutes: 0, servings: 4, cuisineType: '', dietaryTags: [],
    difficultyLevel: 'easy', sourceUrl: '', sourceName: '', notes: ''
  };
  ```
- Update CreateRecipePage:
  - Add `const [formData, setFormData] = useState<RecipeFormData>(DEFAULT_RECIPE_FORM_DATA)`
  - Pass `value={formData} onChange={setFormData} mode="create"` to RecipeForm
- Update EditRecipePage:
  - Convert fetched recipe to RecipeFormData state
  - Pass `value={formData} onChange={setFormData} mode="edit"` to RecipeForm

### E2E Tests

- Regression: Run existing recipe create E2E test — verify form still works end-to-end
- Regression: Run existing recipe edit E2E test — verify form still works end-to-end

### Breaking Changes

- **RecipeForm props interface changes** — `initialData` prop removed, replaced with `value` + `onChange` + `mode`
- **RecipeForm.test.tsx** — All ~38 tests need updating to provide `value` + `onChange` + `mode` instead of `initialData`. Tests that check `toHaveValue` after user interaction now need to verify `onChange` was called with correct data (since value is controlled externally, the test wrapper must wire onChange back to state).
- **CreateRecipePage.test.tsx** — Needs updates for controlled form pattern
- **EditRecipePage.test.tsx** — Needs updates for controlled form pattern
- **E2E recipe tests** — Should NOT break (they test via UI interactions, not component props)

**Migration note:** The `/migrate` step for this feature will be substantial (~38 tests in RecipeForm.test.tsx alone). The test wrapper for RecipeForm tests should use a helper that manages controlled state:
```typescript
function renderRecipeForm(props?: Partial<RecipeFormProps>) {
  const Wrapper = () => {
    const [value, setValue] = useState(props?.value ?? DEFAULT_RECIPE_FORM_DATA);
    return <RecipeForm value={value} onChange={setValue} mode="create" onSubmit={mockSubmit} onCancel={mockCancel} {...props} />;
  };
  return render(<Wrapper />);
}
```

---

## Feature 3: LLM Client Layer

### Summary

Build the provider-agnostic LLM integration layer using LiteLLM. This includes the client wrapper, system prompt builder, response parser, and a test provider for deterministic E2E testing. No API endpoint yet — just the internal service layer.

### Layers

[Backend]

### Acceptance Criteria

- [ ] LLM client can be configured with model name, temperature, max_tokens, timeout
- [ ] System prompt correctly includes recipe state, user preferences, and library context
- [ ] System prompt maps skill_level (beginner/intermediate/advanced) to difficulty guidance for the AI
- [ ] Response parser extracts conversational text and JSON recipe block from LLM output
- [ ] Parser handles responses with no recipe changes (text-only)
- [ ] Parser handles malformed JSON gracefully (returns error, not crash)
- [ ] Parser validates that extracted recipe contains all required fields (title, ingredients, instructions)
- [ ] Config validates LLM settings on startup
- [ ] Test provider returns deterministic canned responses when `llm_model=test`

### Backend

**Tests:**
- Unit: System prompt builder includes current recipe state when provided
- Unit: System prompt builder includes user preferences when provided
- Unit: System prompt builder includes library summary (titles + cuisines)
- Unit: System prompt builder omits empty sections (no recipe, no prefs, no library)
- Unit: System prompt includes valid field values (dietary tags enum, difficulty levels)
- Unit: System prompt maps skill_level to recipe difficulty guidance
- Unit: Response parser extracts text and JSON recipe from well-formed response
- Unit: Response parser returns text-only when no JSON block present
- Unit: Response parser returns error when JSON is malformed
- Unit: Response parser validates completeness — rejects recipe missing required fields (title, ingredients, instructions)
- Unit: Response parser accepts valid partial-optional-fields recipe (no sourceUrl is fine)
- Integration: LLM client calls LiteLLM completion with correct parameters (mock litellm)
- Integration: LLM client respects timeout configuration
- Integration: LLM client handles provider errors gracefully (timeout, auth, rate limit)
- Integration: Test provider returns canned recipe response for creation prompts
- Integration: Test provider returns canned text-only response for conversational prompts

**Implementation:**
- `backend/app/ai/llm_client.py`:
  - `LLMClient` class wrapping `litellm.acompletion()`
  - Configurable: model, temperature, max_tokens, timeout
  - Returns raw completion text
  - Handles LiteLLM exceptions → raises domain-specific errors (`LLMError`, `LLMTimeoutError`, `LLMAuthError`)
  - Test mode: if `model == "test"`, use `TestProvider` instead of LiteLLM
- `backend/app/ai/test_provider.py`:
  - `TestProvider` class with `complete(messages)` method
  - Returns deterministic canned responses based on message content keywords
  - "create" → returns a full recipe JSON response
  - "suggest" / "modify" → returns a modified recipe JSON response
  - conversational → returns text-only response
  - Enables E2E testing without a real LLM
- `backend/app/ai/prompts.py`:
  - `build_system_prompt(recipe_state, preferences, library_summary)` → str
  - System prompt instructs AI to respond with conversational text, then optionally a ```json block with the COMPLETE recipe (all required fields)
  - Includes valid enum values for difficulty, dietary tags
  - Maps skill_level to guidance: beginner → suggest easy recipes with detailed instructions, advanced → can suggest complex techniques
  - Includes recipe schema field descriptions and constraints
- `backend/app/ai/response_parser.py`:
  - `parse_chat_response(raw_text)` → `ParsedResponse(message: str, proposed_recipe: dict | None, error: str | None)`
  - Extracts text before/around JSON block as message
  - Extracts JSON block (```json...```) as proposed_recipe
  - Validates completeness: title (str), ingredients (list, len >= 1), instructions (list, len >= 1) all required
  - Returns ParsedResponse with error if JSON is malformed or incomplete
- `backend/app/ai/schemas.py`:
  - `ChatMessage`: role (Literal["user", "assistant"]), content (str, max_length=5000)
  - `ChatRequest`: messages (list[ChatMessage], min 1, max 50), current_recipe (dict | None), recipe_id (str | None)
  - `ChatResponse`: message (str), proposed_recipe (dict | None)
- `backend/app/ai/exceptions.py`:
  - `LLMError`, `LLMTimeoutError`, `LLMAuthError`, `LLMRateLimitError`
- Update `backend/app/config.py`:
  - Replace `ai_provider`, `openai_api_key`, `anthropic_api_key`, `ollama_base_url` with:
    - `llm_model`: str (default "test") — e.g., "gpt-4o", "claude-3-5-sonnet-20241022", "ollama/llama3", "test"
    - `llm_temperature`: float (default 0.7)
    - `llm_max_tokens`: int (default 2000)
    - `llm_timeout`: int (default 30)
  - Keep `vector_db_*` fields as-is (Phase 2, unrelated)
- Add `litellm` to requirements.txt (pin to specific version found at implementation time)
- Create `backend/app/ai/py.typed` stub file for litellm:
  - Minimal .pyi stub covering `acompletion()` signature and response types used
  - Add to mypy config if needed

### Breaking Changes

- `config.py` removes `ai_provider`, `openai_api_key`, `anthropic_api_key`, `ollama_base_url` fields — replaced with `llm_model`, `llm_temperature`, `llm_max_tokens`, `llm_timeout`
- No existing code references the old AI config fields (verified: ai/ directory contains only `__init__.py`)
- Update `.env.example` to show new LLM config vars and remove old ones

---

## Feature 4: Chat API Endpoint

### Summary

Create the POST /api/v1/chat endpoint that orchestrates the chat flow: gathers user context (preferences, library), builds the prompt, calls the LLM client, and returns the parsed response.

### Layers

[Backend]

### Acceptance Criteria

- [ ] POST /api/v1/chat accepts messages + current_recipe + recipe_id
- [ ] Response includes AI message text
- [ ] Response includes proposed_recipe when AI suggests changes
- [ ] Response includes no proposed_recipe for conversational-only responses
- [ ] Endpoint requires authentication
- [ ] User preferences are included in LLM context
- [ ] Last 20 recipe titles/cuisines are included in LLM context
- [ ] Invalid request body returns 422
- [ ] Non-existent recipe_id returns 404
- [ ] Other user's recipe_id returns 403
- [ ] LLM errors return 503 with user-friendly message

### Backend

**Tests:**
- Integration: POST /api/v1/chat with valid request returns 200 with message (mock LLM)
- Integration: POST /api/v1/chat includes proposed_recipe when LLM suggests changes (mock LLM)
- Integration: Unauthenticated request returns 401
- Integration: Request with empty messages array returns 422
- Integration: Request with messages exceeding max count (50) returns 422
- Integration: Request with recipe_id for non-existent recipe returns 404
- Integration: Request with recipe_id verifies ownership (403 for other user's recipe)
- Integration: User preferences are passed to prompt builder (verify via mock)
- Integration: User with no preferences — context built without preferences section
- Integration: User with no recipes — context built without library section
- Integration: Library summary includes up to 20 most recent recipes (verify via mock)
- Integration: LLM timeout returns 503 with appropriate error message
- Integration: LLM auth error returns 503
- Integration: Malformed LLM response triggers retry, then returns error message in 200 response
- Unit: Chat service assembles correct context from DB data
- Unit: Chat service truncates message history to last 20 user/assistant messages

**Implementation:**
- `backend/app/ai/chat_service.py`:
  - `ChatService` class with `async chat(request: ChatRequest, user: User, db: AsyncSession) -> ChatResponse`
  - Fetches user preferences from DB (dietary_restrictions, skill_level, default_servings)
  - Fetches last 20 recipes (title + cuisine_type only, ordered by created_at desc) for library context
  - If recipe_id provided: verify ownership via existing `check_recipe_ownership()`, fetch full recipe
  - Builds system prompt via `prompts.build_system_prompt()`
  - Constructs messages array: [system_prompt] + last 20 user/assistant messages from request
  - Calls LLMClient.complete()
  - Parses response via response_parser
  - On parse failure: retry once with same input, then return ChatResponse with error in message field
  - Returns ChatResponse
- `backend/app/api/chat.py`:
  - New router: `router = APIRouter(prefix="/chat", tags=["chat"])` (note: just `/chat`, main.py adds `/api/v1`)
  - `POST /` endpoint: depends on `CurrentUser` + `get_db`
  - Validates ChatRequest body
  - Instantiates ChatService, calls chat()
  - Returns ChatResponse
  - Error handling: catches `LLMError` subclasses → HTTPException(503, detail="AI service temporarily unavailable")
- Register chat router in `backend/app/main.py`: `app.include_router(chat.router, prefix="/api/v1")`
- Update `backend/app/api/__init__.py` to import chat module

### Breaking Changes

- None — new endpoint, no changes to existing routes

---

## Feature 5: Chat Frontend Panel

### Summary

Build the chat side panel UI component, integrate it into Create/Edit recipe pages, and wire it to the chat API. Includes sessionStorage persistence, loading states, apply/reject flow, and accessibility.

### Layers

[E2E, Frontend]

### Acceptance Criteria

- [ ] Chat panel toggle button visible on Create Recipe page
- [ ] Chat panel toggle button visible on Edit Recipe page
- [ ] Clicking toggle opens side panel with message input
- [ ] User can type a message and send it
- [ ] AI response displays in the chat panel
- [ ] When AI proposes changes, a summary card appears with Apply/Reject buttons
- [ ] Clicking Apply replaces the recipe form state with the proposed recipe (full replacement)
- [ ] Clicking Reject dismisses the proposal, chat continues
- [ ] Chat input is disabled while waiting for AI response
- [ ] Loading indicator shows during AI request
- [ ] Error messages display in chat when API fails
- [ ] Chat history persists across page refresh (sessionStorage, max 50 messages stored)
- [ ] On mobile, chat panel opens as full-screen overlay
- [ ] Chat panel has a close/back button
- [ ] New messages announced to screen readers (ARIA live region)
- [ ] Focus moves to chat panel on open, returns to toggle button on close
- [ ] Send button disabled when input is empty

### Frontend

**Tests:**
- Component: ChatPanel renders with input field and send button
- Component: Sending message adds user message to list
- Component: AI response renders as assistant message
- Component: ChangeSummary card renders when proposed_recipe is present
- Component: Apply button calls onApply with proposed recipe data (transformed to camelCase)
- Component: Reject button dismisses the proposal
- Component: Input disabled and loading indicator shown during API call
- Component: Send button disabled when input is empty
- Component: Error message renders when API call fails
- Component: Chat history loads from sessionStorage on mount
- Component: Chat history saves to sessionStorage on new message
- Component: Chat history truncates to max 50 messages in sessionStorage
- Component: ARIA live region announces new AI messages
- Component: Focus moves to input on panel open
- Integration: CreateRecipePage shows chat toggle button
- Integration: EditRecipePage shows chat toggle button
- Integration: Apply updates parent form state with full replacement
- Integration: Form reflects applied changes (title, ingredients, instructions all update)
- Integration: After Apply, next chat message includes the updated recipe state

**Implementation:**
- `frontend/src/components/chat/ChatPanel.tsx`:
  - Right-side drawer (fixed position, slides in/out via CSS transform)
  - Props: `isOpen`, `onClose`, `currentRecipe: RecipeFormData`, `onApply: (recipe: RecipeFormData) => void`, `recipeId?: string`
  - Uses `useChatSession` hook for state management
  - Message list (scrollable, auto-scrolls to bottom on new message)
  - Text input + send button at bottom
  - Close button at top
  - ARIA: `role="complementary"`, `aria-label="AI Recipe Chat"`
  - ARIA live region (`aria-live="polite"`) for new AI messages
  - Focus management: `useEffect` to focus input on open, return focus on close
  - Responsive: at viewport < 768px, panel becomes full-screen overlay with position fixed + inset 0
- `frontend/src/components/chat/ChatMessage.tsx`:
  - Renders user messages (right-aligned, user-colored bubble)
  - Renders AI messages (left-aligned, AI-colored bubble)
  - AI messages with proposed_recipe show ChangeSummary inline below the text
- `frontend/src/components/chat/ChangeSummary.tsx`:
  - Props: `currentRecipe: RecipeFormData`, `proposedRecipe: RecipeFormData`, `onApply`, `onReject`
  - Computes diff between current and proposed (changed fields, added/removed ingredients, modified instructions)
  - Displays human-readable summary list
  - "Apply All" and "Reject" buttons
- `frontend/src/services/chatApi.ts`:
  - Types: `ChatMessage { role: 'user' | 'assistant'; content: string }`, `ChatRequest`, `ChatResponse`
  - `sendChatMessage(request)`: transforms `current_recipe` from camelCase RecipeFormData to snake_case via `transformFormToBackend`, calls POST /api/v1/chat
  - Response: transforms `proposed_recipe` from snake_case back to camelCase RecipeFormData via `transformRecipeToFrontend`
  - Timeout: 35 seconds (5s buffer over backend's 30s LLM timeout)
- `frontend/src/hooks/useChatSession.ts`:
  - Manages chat messages state: `ChatMessage[]`
  - sessionStorage read/write (keyed by `chat-${pageType}-${recipeId || 'new'}`)
  - Max 50 messages stored in sessionStorage (oldest trimmed)
  - `sendMessage(text, currentRecipe)` — appends user message, calls chatApi, appends response
  - `currentProposal: RecipeFormData | null` — set when AI response includes proposed_recipe
  - `applyChanges()` — returns currentProposal, clears it
  - `rejectChanges()` — clears currentProposal
  - `isLoading` state (disables input during API call)
  - `error` state
  - Debounce: ignores rapid double-sends while isLoading is true
- Update `CreateRecipePage.tsx`:
  - Add chat toggle button (e.g., AI chat icon button in page header)
  - Add `const [chatOpen, setChatOpen] = useState(false)`
  - Render `<ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} currentRecipe={formData} onApply={setFormData} />`
- Update `EditRecipePage.tsx`:
  - Same as CreateRecipePage additions
  - Pass `recipeId={id}` to ChatPanel
- MSW handler: POST /api/v1/chat — returns canned ChatResponse (one with proposed_recipe, one text-only) based on request content
- Add mock data for chat responses in `test/mocks/data.ts`

### E2E Tests

- Smoke: Chat toggle button visible on create page
- Smoke: Chat toggle button visible on edit page
- Flow: Open chat, send message, receive response (uses test LLM provider for deterministic output)
- Flow: Receive proposal, click Apply, verify form fields updated with proposed recipe values
- Flow: Receive proposal, click Reject, verify form fields unchanged
- Flow: Send message, refresh page, verify chat history restored from sessionStorage

**E2E Note:** The backend must be configured with `LLM_MODEL=test` in the E2E test environment. The test provider (built in Feature 3) returns deterministic responses that the E2E tests can assert against.

### Breaking Changes

- CreateRecipePage and EditRecipePage get additional UI elements (chat button + panel) — existing E2E tests should still pass as the form behavior is unchanged
- None that break existing functionality

---

## Open Questions (Resolved)

1. ~~E2E LLM stubbing strategy~~ → Resolved: test provider built into Feature 3, configured via `LLM_MODEL=test`
2. **Message history truncation** — Using last 20 messages in LLM context (server-side) and max 50 messages in sessionStorage (client-side). Token counting deferred to future optimization.
3. **LiteLLM version** — Pin to latest stable at implementation time.
