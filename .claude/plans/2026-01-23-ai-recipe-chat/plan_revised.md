# Plan: AI Recipe Chat (Revised)

## Overview

Transform the AI Recipe Chat brainstorm into 5 user-story-aligned features, each delivered as a vertical slice. Features are sized for one TDD round and end at verifiable user outcomes.

## Feature Order

1. **User configures cooking preferences** (no dependencies)
2. **User creates a recipe through AI chat** (depends on 1)
3. **User rejects AI suggestion and continues** (depends on 2)
4. **User modifies existing recipe with AI** (depends on 2)
5. **Chat history survives page refresh** (depends on 2)

---

## Feature 1: User configures cooking preferences

### User Story

As a cook, I need to set my dietary restrictions and skill level, so that the AI gives me relevant suggestions.

### Summary

Add user preference fields (dietary restrictions, skill level, default servings) and a settings page where users can configure them. These preferences will be sent to the AI in subsequent features to personalize recipe suggestions.

### Layers

[E2E, Backend, Frontend]

### E2E Acceptance Criteria

- [ ] User navigates to settings page → sets dietary restrictions (vegetarian, gluten-free) → saves → refreshes page → **preferences are still selected (verified via API GET /users/me)**
- [ ] User sets skill level to "beginner" → saves → **user record in DB has skill_level="beginner" (verified via API)**
- [ ] User updates only dietary restrictions → **other fields (skill_level, default_servings) remain unchanged (verified via API)**

### Backend

**Tests:**
- Integration: PATCH /api/v1/users/me/preferences with valid data returns 200, updates user record
- Integration: GET /api/v1/users/me returns preference fields in response
- Integration: Partial update (only dietary_restrictions) leaves other fields unchanged
- Integration: Invalid skill_level returns 422
- Integration: Invalid dietary tag returns 422
- Integration: Unauthenticated request returns 401

**Implementation:**
- Alembic migration: add `dietary_restrictions` (JSON), `skill_level` (String), `default_servings` (Integer) to users table
- Update User model with new columns
- New schema: `UserPreferencesUpdate` with validation
- New endpoint: `PATCH /api/v1/users/me/preferences`
- Update `UserResponse` to include new fields

### Frontend

**Tests:**
- Component: Settings page renders preference controls
- Component: Saving preferences calls API with correct payload
- Component: Success message shown after save
- Integration: Full save/reload cycle shows persisted values

**Implementation:**
- New page: `SettingsPage.tsx` at route `/settings`
- Dietary restrictions: checkbox group
- Skill level: radio group (beginner/intermediate/advanced)
- Default servings: number input
- Add navigation link in sidebar

### Infrastructure

- Alembic migration for new user columns

### Test Fixture Requirements

None — this feature doesn't use mock providers.

### Breaking Changes

None — new fields with nullable defaults.

---

## Feature 2: User creates a recipe through AI chat

### User Story

As a cook, I need to ask the AI for a recipe and save its suggestion, so that I can quickly add new recipes without manual data entry.

### Summary

The core chat experience: user opens a chat panel on the Create Recipe page, asks for a recipe, receives a suggestion, applies it to the form, and saves the recipe. This is the main vertical slice that delivers the AI chat capability end-to-end.

### Layers

[E2E, Backend, Frontend]

### E2E Acceptance Criteria

- [ ] User opens chat on Create Recipe page → sends "make me a spaghetti recipe" → receives AI response with recipe proposal → clicks Apply → clicks Create Recipe → **recipe exists in database with title containing "spaghetti" (verified via API GET /recipes)**
- [ ] User opens chat → sends message → **AI response appears in chat panel within 30 seconds**
- [ ] User applies proposal → **all form fields are populated (title, description, ingredients, instructions visible in UI)**

### Backend

**Tests:**
- Unit: System prompt builder includes recipe state, user preferences, library summary
- Unit: System prompt builder includes valid enum values (dietary tags, difficulty levels)
- Unit: System prompt instructs AI to include description field in JSON schema
- Unit: Response parser extracts text and JSON recipe from well-formed response
- Unit: Response parser validates required fields: title, description, ingredients, instructions
- Unit: Response parser returns error for malformed JSON
- Integration: POST /api/v1/chat returns 200 with message
- Integration: POST /api/v1/chat includes proposed_recipe when AI suggests recipe
- Integration: Chat endpoint constructs LLMClient with settings from config (model, temperature, timeout)
- Integration: User preferences are included in prompt context
- Integration: LLM timeout returns 503
- Integration: Test provider returns deterministic response for creation prompts

**Implementation:**
- `backend/app/ai/llm_client.py`: LiteLLM wrapper with configurable model/temperature/timeout
- `backend/app/ai/test_provider.py`: Deterministic provider for E2E testing
- `backend/app/ai/prompts.py`: System prompt builder with schema instructions
- `backend/app/ai/response_parser.py`: Extract text + JSON, validate completeness
- `backend/app/ai/schemas.py`: ChatMessage, ChatRequest, ChatResponse
- `backend/app/api/chat.py`: POST /api/v1/chat endpoint
- Update config.py: llm_model, llm_temperature, llm_max_tokens, llm_timeout

### Frontend

**Tests:**
- Component: ChatPanel renders with input and send button
- Component: Sending message adds user message to list
- Component: AI response renders as assistant message
- Component: Apply button calls onApply with proposed recipe
- Component: Input disabled during API call
- Integration: CreateRecipePage shows chat toggle
- Integration: Apply updates form state with all fields (title, description, ingredients, instructions)
- Integration: After apply, form can be submitted successfully

**Implementation:**
- Refactor RecipeForm to controlled component (receives value/onChange props)
- `ChatPanel.tsx`: Right-side drawer with message list and input
- `ChatMessage.tsx`: Renders user/assistant messages
- `ChangeSummary.tsx`: Shows proposed recipe title with Apply/Reject buttons
- `chatApi.ts`: sendChatMessage() with request/response transformation
- `useChatSession.ts`: Hook managing chat state
- Update CreateRecipePage: lift form state, integrate ChatPanel

### Infrastructure

- LLM client layer (llm_client.py, prompts.py, response_parser.py)
- Test provider for deterministic E2E testing
- RecipeForm controlled component refactor
- Config additions for LLM settings

### Test Fixture Requirements

The test provider (`LLM_MODEL=test`) MUST return a response that:
- Includes ALL required fields: title, **description**, ingredients, instructions
- Includes optional fields: cuisine_type, difficulty_level, prep_time_minutes, cook_time_minutes, servings
- Passes form validation so the recipe can be submitted
- Returns content relevant to "creation" keywords in user message

Example canned response structure:
```json
{
  "title": "Classic Spaghetti Bolognese",
  "description": "A hearty Italian pasta dish with rich meat sauce.",
  "ingredients": [{"name": "spaghetti", "amount": "400", "unit": "g"}, ...],
  "instructions": [{"step_number": 1, "instruction": "Boil pasta..."}, ...],
  "cuisine_type": "Italian",
  "difficulty_level": "medium",
  "prep_time_minutes": 15,
  "cook_time_minutes": 30,
  "servings": 4
}
```

### Breaking Changes

- RecipeForm becomes controlled — existing RecipeForm tests will need updates
- CreateRecipePage state management changes — existing page tests may need updates

---

## Feature 3: User rejects AI suggestion and continues

### User Story

As a cook, I need to reject a suggestion and ask for something different, so that I can iterate until I get a recipe I like.

### Summary

Add the reject flow: user can dismiss a proposal without applying it, and continue the conversation to get different suggestions.

### Layers

[E2E, Frontend]

### E2E Acceptance Criteria

- [ ] User receives proposal → clicks Reject → **form fields remain unchanged (verified: title input still empty or has original value)**
- [ ] User rejects proposal → sends new message "make it vegetarian" → **receives new AI response**
- [ ] User rejects proposal → **proposal card is dismissed, chat input is re-enabled**

### Backend

No backend changes — reject is purely frontend state management.

### Frontend

**Tests:**
- Component: Reject button dismisses proposal card
- Component: After reject, currentProposal is null
- Component: Form state unchanged after reject
- Integration: Can send new message after rejecting proposal

**Implementation:**
- Add rejectChanges() to useChatSession hook
- Wire Reject button to rejectChanges()
- Clear currentProposal state on reject

### Infrastructure

None.

### Test Fixture Requirements

Uses same test provider from Feature 2.

### Breaking Changes

None.

---

## Feature 4: User modifies existing recipe with AI

### User Story

As a cook, I need to chat about changes to an existing recipe and save them, so that I can improve my recipes with AI assistance.

### Summary

Extend chat to the Edit Recipe page. The AI receives the existing recipe as context and can suggest modifications. User applies changes and saves the updated recipe.

### Layers

[E2E, Backend, Frontend]

### E2E Acceptance Criteria

- [ ] User navigates to Edit Recipe page for existing recipe → opens chat → sends "make it gluten-free" → applies suggestion → clicks Save → **recipe in database is updated (verified via API GET /recipes/{id})**
- [ ] User on Edit page → chat context includes existing recipe title and ingredients → **AI response references existing recipe content**

### Backend

**Tests:**
- Integration: POST /api/v1/chat with recipe_id includes existing recipe in context
- Integration: POST /api/v1/chat with non-existent recipe_id returns 404
- Integration: POST /api/v1/chat with other user's recipe_id returns 403

**Implementation:**
- Update chat endpoint to fetch recipe by ID if provided
- Verify ownership before including recipe in context
- Include full recipe state in prompt

### Frontend

**Tests:**
- Integration: EditRecipePage shows chat toggle
- Integration: Chat on edit page sends recipe_id with requests
- Integration: Apply updates form, save persists to API

**Implementation:**
- Update EditRecipePage: lift form state, integrate ChatPanel
- Pass recipeId prop to ChatPanel
- Include recipe_id in chat API requests

### Infrastructure

None — uses existing LLM infrastructure from Feature 2.

### Test Fixture Requirements

Uses same test provider from Feature 2. Test provider should handle modification requests (keywords like "modify", "change", "make it") by returning an updated recipe.

### Breaking Changes

- EditRecipePage state management changes — existing edit page tests may need updates

---

## Feature 5: Chat history survives page refresh

### User Story

As a cook, I need my chat conversation to persist across page refreshes, so that I don't lose context if I accidentally navigate away.

### Summary

Persist chat messages to sessionStorage so the conversation survives page refresh within the same browser tab.

### Layers

[E2E, Frontend]

### E2E Acceptance Criteria

- [ ] User sends chat message → receives response → refreshes page → **opens chat → previous messages are visible**
- [ ] User on Create page sends messages → navigates to Edit page → **Create page chat history is separate from Edit page (keyed by page)**

### Backend

No backend changes — persistence is client-side only.

### Frontend

**Tests:**
- Component: Chat messages saved to sessionStorage on new message
- Component: Chat messages loaded from sessionStorage on mount
- Component: Max 50 messages stored (oldest trimmed)
- Integration: Refresh page, reopen chat, history visible

**Implementation:**
- Update useChatSession to read/write sessionStorage
- Key by page type + recipe ID: `chat_${pageType}_${recipeId || 'new'}`
- Truncate to max 50 messages before storing

### Infrastructure

None.

### Test Fixture Requirements

None — this feature tests persistence, not AI responses.

### Breaking Changes

None.

---

## Open Questions

1. **Message history token budget** — Resolved: Keep last 20 messages in LLM context (server-side truncation). Store up to 50 in sessionStorage (client-side).

2. **E2E LLM strategy** — Resolved: Test provider (`LLM_MODEL=test`) returns deterministic responses. E2E tests run against test provider. Test provider output must pass all form validation.

3. **RecipeForm migration** — Resolved: Refactor shipped as part of Feature 2. Existing tests updated in same PR.
