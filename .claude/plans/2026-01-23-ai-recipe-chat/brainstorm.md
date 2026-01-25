# Brainstorm: AI Recipe Chat

**Date:** 2026-01-23
**Feature:** AI-powered chat side panel for recipe creation and editing
**Branch:** feature/ai-recipe-chat

---

## Problem / Motivation

Users currently create and edit recipes entirely manually through form fields. An AI chat interface would let users describe what they want conversationally ("make me a quick weeknight pasta that's gluten-free") and receive structured recipe suggestions they can apply to the form. This supports both creation from scratch and modification of existing recipes.

---

## Key Decisions

### Scope & Mode
- **Both creation and editing** — Chat works on both Create and Edit recipe pages
- **AI Assist mode first** — AI suggests changes, user reviews and applies/rejects
- **Either-path creation** — User can start from the chat (empty form) or start filling the form and use chat to refine

### UI Placement
- **Side panel** — Chat opens as a right-side drawer next to the existing recipe form
- **Mobile** — Full-screen overlay with back button to return to form
- **Toggle button** on recipe pages to open/close the panel

### Change Approval
- **All-or-nothing** — AI proposes a batch of changes, user applies all or rejects all
- Changes displayed as a summary card in the chat (what will change)
- User can follow up conversationally to refine ("actually, keep the original cook time")

### Persistence
- **Session-only** — Chat state stored in React state + sessionStorage (per-tab)
- Survives page refresh within same tab, lost on tab close
- Keyed by page type + recipe_id

### LLM Integration
- **LiteLLM** as the provider abstraction layer — unified API, built-in cost/token tracking
- **Single centrally-configured provider** — users don't manage API keys
- **Batch responses** — no streaming, wait for complete response
- **JSON output format** — AI returns conversational text + full updated recipe as JSON
- Model/provider configured server-side (e.g., "gpt-4o", "claude-3-5-sonnet", "ollama/llama3")
- Eventually a paid service — monitoring needed from day one

### Context Sent to AI
- **Current recipe state** — full form state sent with each message (can be empty/partial for creation)
- **User preferences** — dietary restrictions, skill level, default servings (new fields on user model)
- **Library summary** — titles + cuisine types of user's last 20 recipes

---

## Chosen Approach: Architecture

### Backend

#### LLM Layer (`backend/app/ai/`)
- **`llm_client.py`** — Thin wrapper around LiteLLM's `completion()`. Configures model, temperature, max_tokens from app settings.
- **`prompts.py`** — System prompt builder. Injects current recipe state, user preferences, and library summary. Instructs AI to respond with conversational text + a JSON block containing the full updated recipe state.
- **`chat_service.py`** — Orchestration: gathers context (preferences from DB, library summary), builds messages array with system prompt, calls LLM client, parses response into text + recipe JSON.
- **`schemas.py`** — Request/response models:
  - `ChatRequest`: messages[], current_recipe (nullable), recipe_id (optional)
  - `ChatResponse`: message (string), proposed_recipe (full recipe object or null)

#### Config Additions (`backend/app/config.py`)
- `llm_model`: string (e.g., "gpt-4o", "claude-3-5-sonnet", "ollama/llama3")
- `llm_temperature`: float (default 0.7)
- `llm_max_tokens`: int (default 2000)
- LiteLLM reads provider API keys from environment variables

#### New Endpoint
- **`POST /api/v1/chat`** — Separate router (not under /recipes)
- Authenticated via `CurrentUser` dependency
- Validates `ChatRequest`, calls `chat_service.chat()`, returns `ChatResponse`

#### User Preferences (DB Migration)
- Add to `users` table:
  - `dietary_restrictions`: JSON array (e.g., ["vegetarian", "gluten-free"])
  - `skill_level`: String, nullable (beginner / intermediate / advanced)
  - `default_servings`: Integer, nullable
- New schemas: `UserPreferencesUpdate`
- New endpoint: `PATCH /api/v1/users/me/preferences`

### Frontend

#### Form Refactor
- **Lift state up** — Move recipe form state from `RecipeForm` internal useState to parent pages (`CreateRecipePage`, `EditRecipePage`)
- `RecipeForm` becomes a controlled component: receives `value` + `onChange` props
- Parent pages manage state, pass it to both Form and ChatPanel

#### New Components
- **`ChatPanel.tsx`** — Right-side drawer panel. Contains message list, text input, send button. Toggle button on recipe pages.
- **`ChatMessage.tsx`** — Renders individual messages (user/AI). AI messages with proposed changes show a summary card with "Apply" / "Reject" buttons.
- **`ChangeSummary.tsx`** — Displays what the proposed recipe changes are (added ingredients, modified times, etc.) by diffing current vs proposed state.

#### New Service
- **`chatApi.ts`** — `sendMessage(request: ChatRequest): Promise<ChatResponse>`

#### State Management
- Chat messages in React state + sessionStorage backup
- On "Apply": parent page replaces form state with proposed recipe
- Chat input disabled while waiting for AI response
- After apply, subsequent messages automatically include updated recipe state

### Data Flow

```
User types message
  → Frontend sends {messages, current_recipe, recipe_id?} to POST /api/v1/chat
  → Backend gathers context:
      - current_recipe (from request)
      - user preferences (from DB)
      - library summary: last 20 recipe titles + cuisines (from DB)
  → Backend builds system prompt + message history
  → Backend calls LiteLLM completion()
  → LLM returns text with embedded JSON recipe block
  → Backend parses into ChatResponse {message, proposed_recipe}
  → Frontend displays AI message
  → If proposed_recipe is present: show ChangeSummary card
  → User clicks "Apply" → form state updates to proposed_recipe
       or "Reject" → no change, continue chatting
```

### Error Handling
- LLM provider unavailable → error message in chat ("AI service unavailable")
- Malformed LLM response (can't parse JSON) → retry once, then show error
- Empty/partial recipe context → AI treats as creation from scratch
- Concurrent form submission while chat pending → chat input disabled during AI call

### Monitoring (via LiteLLM)
- Per-request cost tracking (automatic)
- Token usage per call
- Provider latency
- Error rates
- Can later add LiteLLM proxy mode for dashboard, or pipe to observability stack

---

## Independent Review — Additional Questions & Answers

**Q: How does the AI know valid values for fields like difficulty_level or dietary_tags?**
A: The system prompt will include the valid enum values and field constraints. This is part of prompt engineering in the /plan phase.

**Q: What happens if the user has no recipes yet (empty library context)?**
A: Library context is simply omitted from the prompt. AI works with preferences + current recipe only.

**Q: What about the existing ai_provider/api_key config fields?**
A: These will be replaced by LiteLLM configuration. LiteLLM reads keys from environment variables (OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.) and model is specified as a string.

**Q: RecipeForm refactor — is this a breaking change?**
A: Yes, this is a significant refactor. The form becomes controlled. Existing tests will need updating. This should be handled in the /migrate phase.

**Q: What timeout for LLM calls?**
A: LiteLLM supports configurable timeouts. Default to 30 seconds for the API call. Frontend shows a loading/thinking indicator during this time.

---

## Open Questions (for /plan phase)

- Exact system prompt wording and JSON output schema definition
- How to handle very long conversations (token budget for message history — likely keep last N messages)
- Specific LiteLLM configuration and environment variable naming
- Migration strategy for RecipeForm controlled component refactor
- E2E test strategy: stub LLM responses via mock provider or MSW
- Whether to add a user preferences UI page now or just the API endpoint
