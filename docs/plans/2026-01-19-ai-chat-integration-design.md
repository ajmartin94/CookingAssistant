# AI Chat Integration Design

**Date:** 2026-01-19
**Status:** Draft
**Phase:** 2 (AI Recipe Builder - Partial)

---

## Summary

Add a conversational AI interface to the Cooking Assistant that allows users to create and edit recipes through natural language. The chat appears contextually on relevant pages, understands what the user is looking at, and can take actions (with confirmation) on their behalf.

---

## Goals

- **Conversation-first UX**: Users interact with AI like ChatGPT/Claude, not forms
- **Tool-based architecture**: AI has structured tools (`create_recipe`, `edit_recipe`, etc.) that execute with user confirmation
- **Provider-agnostic**: LLM provider is an infrastructure decision, swappable via config
- **Local-first**: Start with Ollama for zero API costs; cloud providers optional later
- **Deployable for testers**: Docker Compose + Cloudflare Tunnel for early access

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Recipe List │  │Recipe Detail│  │ Create Page │     │
│  │   + Chat    │  │   + Chat    │  │   + Chat    │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
│         └────────────────┼────────────────┘            │
│                          ▼                              │
│              ┌─────────────────────┐                   │
│              │  Chat Panel (shared)│                   │
│              │  - context-aware    │                   │
│              │  - tool confirmations│                  │
│              └──────────┬──────────┘                   │
└─────────────────────────┼───────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│                      Backend                            │
│  ┌──────────────────┐    ┌──────────────────┐          │
│  │ Chat API         │───▶│ LLM Service      │          │
│  │ /api/v1/chat     │    │ (LiteLLM)        │          │
│  └────────┬─────────┘    └──────────────────┘          │
│           │                        │                    │
│           ▼                        ▼                    │
│  ┌──────────────────┐    ┌──────────────────┐          │
│  │ Tool Executor    │───▶│ Recipe Service   │          │
│  │ (with confirm)   │    │ (existing)       │          │
│  └──────────────────┘    └──────────────────┘          │
└─────────────────────────────────────────────────────────┘
```

**Key principles:**
- LLM service is a thin wrapper over LiteLLM (provider abstraction)
- Tool definitions are cooking-domain-specific
- Existing recipe service stays unchanged - tools call into it
- All tool executions require user confirmation (AI Assist mode)

---

## Backend Design

### LLM Service (LiteLLM)

```python
# backend/app/services/llm/service.py
from litellm import acompletion

class LLMService:
    def __init__(self):
        self.model = settings.LLM_MODEL  # e.g., "ollama/llama3.1:8b"

    async def chat(
        self,
        messages: list[dict],
        tools: list[dict] | None = None,
        stream: bool = True,
    ) -> AsyncIterator[dict]:
        response = await acompletion(
            model=self.model,
            messages=messages,
            tools=tools,
            stream=stream,
        )
        async for chunk in response:
            yield chunk
```

**Configuration:**

```bash
# .env - Local development (Ollama)
LLM_MODEL=ollama/llama3.1:8b

# .env - Cloud (when needed)
LLM_MODEL=anthropic/claude-3-haiku-20240307
ANTHROPIC_API_KEY=sk-...
```

Switching providers = changing one env var.

### Chat API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/v1/chat` | Send message, receive response + pending tool calls |
| `POST /api/v1/chat/confirm` | Approve or reject a pending tool call |

**Conversation flow:**

```
User: "Make this recipe dairy-free"
         │
         ▼
    POST /api/v1/chat
    { "message": "...", "context": { "page": "recipe_detail", "recipe_id": "abc" } }
         │
         ▼
    LLM responds with tool call (status: pending_confirmation)
         │
         ▼
    User sees preview, clicks "Approve"
         │
         ▼
    POST /api/v1/chat/confirm
    { "tool_call_id": "call_123", "approved": true }
         │
         ▼
    Tool executes → Recipe updated → LLM confirms completion
```

**Conversation persistence:** None for MVP. Conversations are ephemeral - cleared on page refresh or navigation.

### Tool Definitions (MVP)

Three tools for MVP scope:

**1. create_recipe**
- Creates a new recipe and saves to user's library
- Parameters: title, description, ingredients, instructions, prep_time, cook_time, servings, cuisine, dietary_tags
- Required: title, ingredients, instructions
- **Requires confirmation**

**2. edit_recipe**
- Modifies an existing recipe
- Parameters: recipe_id + any fields to change
- **Requires confirmation**

**3. suggest_substitutions**
- Suggests ingredient substitutions without modifying the recipe
- Parameters: recipe_id, substitutions (array of original/replacement/reason)
- **No confirmation needed** (read-only, displays suggestions)

---

## Frontend Design

### Contextual Chat Panel

Chat appears on relevant pages with context pre-loaded:

| Page | Context passed |
|------|----------------|
| Recipe Detail | `{ page: "recipe_detail", recipe_id, recipe_title }` |
| Recipe Edit | `{ page: "recipe_edit", recipe_id, recipe_title }` |
| Recipe Create | `{ page: "recipe_create" }` |
| Recipe List | `{ page: "recipe_list", filters }` |

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  Recipe Detail Page                                     │
│ ┌─────────────────────────────────┬───────────────────┐ │
│ │                                 │  Chat Panel       │ │
│ │   Recipe Content                │ ─────────────────  │ │
│ │   - Title, image               │ "Make this dairy-  │ │
│ │   - Ingredients                │  free"             │ │
│ │   - Instructions               │                    │ │
│ │                                 │ ● ● ● thinking... │ │
│ │                                 │                    │ │
│ │                                 │ ┌────────────────┐ │ │
│ │                                 │ │ Tool Preview   │ │ │
│ │                                 │ │ Edit Recipe    │ │ │
│ │                                 │ │[Approve][Reject]│ │ │
│ │                                 │ └────────────────┘ │ │
│ │                                 │                    │ │
│ │                                 │ [Type message...] │ │
│ └─────────────────────────────────┴───────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
<ChatProvider>           // Manages conversation state (ephemeral)
  <ChatPanel>            // Collapsible panel UI
    <MessageList>        // Chat history
    <ToolConfirmation>   // Approval UI for pending tools
    <ChatInput>          // Message input with streaming indicator
  </ChatPanel>
</ChatProvider>
```

### Feedback Collection

- Thumbs up/down on AI messages
- Optional "what went wrong?" on thumbs down
- Stored for later analysis / eval set building

---

## Testing Strategy

### Functional Tests (TDD - written first)

**Backend:**
- LLM service tests (mocked provider)
- Chat API endpoint tests
- Tool executor tests (parsing, execution loop)
- Individual tool tests (each calls correct service methods)

**Frontend:**
- ChatPanel component tests (renders, collapses, shows messages)
- ToolConfirmation component tests (preview display, approve/reject)
- ChatInput component tests (input, streaming indicator)
- ChatProvider context tests (state management)

**E2E:**
- Open chat panel, send message, see response
- Tool preview appears, confirm, see result applied
- Context passed correctly per page

### LLM Smoke Tests (separate, can be slow)

- Model returns valid response structure
- Model uses tools correctly when prompted
- Basic recipe generation produces valid structure

### Quality Testing (manual)

- Feedback collection from testers (thumbs up/down)
- Build eval set from real usage patterns
- Revisit formal evals when failure patterns emerge

---

## Deployment

### Docker Compose

```yaml
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=sqlite:///./data/cooking.db
      - LLM_MODEL=ollama/llama3.1:8b
      - OLLAMA_API_BASE=http://ollama:11434
    volumes:
      - ./data:/app/data
    depends_on:
      - ollama

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:8000

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama

volumes:
  ollama_data:
```

### First-run Setup

```bash
docker compose up -d ollama
docker compose exec ollama ollama pull llama3.1:8b
docker compose up -d
```

### Exposing to Testers (Cloudflare Tunnel)

```bash
cloudflared tunnel --url http://localhost:3000
```

Provides HTTPS URL like `https://random-words.trycloudflare.com`.

### Hardware Requirements

- 8GB RAM minimum (llama3.1:8b)
- 16GB+ recommended
- GPU optional but improves response time

---

## Implementation Phases

### Phase 2a: LLM Infrastructure

1. Write tests for LLM service (mocked provider)
2. Write tests for chat API endpoints
3. Implement LLM service with LiteLLM
4. Implement chat API (`/chat`, `/chat/confirm`)
5. Add `litellm` dependency

### Phase 2b: Tool Framework

1. Write tests for tool executor (parsing, execution loop)
2. Write tests for each tool (calls correct service methods)
3. Implement tool executor
4. Implement `create_recipe`, `edit_recipe`, `suggest_substitutions` tools
5. Write smoke tests (model responds, uses tools)

### Phase 2c: Chat UI

1. Write component tests for ChatPanel, ToolConfirmation, ChatInput
2. Write context tests for ChatProvider
3. Implement components
4. Integrate into pages (Detail, Edit, Create, List)
5. Write E2E tests for chat flows

### Phase 2d: Deployment & Feedback

1. Docker setup (backend, frontend, Ollama)
2. Cloudflare Tunnel documentation
3. Add feedback UI (thumbs up/down)
4. Tester onboarding guide

---

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| LLM abstraction | LiteLLM | Lightweight, provider-agnostic, avoids framework churn |
| Initial provider | Ollama (local) | Zero cost, privacy-focused, good for indie dev |
| Provider config | Admin-controlled (env vars) | Users don't configure; simplifies UX |
| Confirmation model | Tool calls with approval | Matches "AI Assist" mode; safe for MVP |
| Chat location | Contextual (per-page) | Better UX than dedicated page; context-aware |
| Conversation persistence | None (ephemeral) | Simplifies MVP; revisit based on feedback |
| Error handling | Generic messages | Polish later based on real usage |
| System prompt | Iterate based on feedback | Don't over-engineer before tester data |

---

## Out of Scope (for this phase)

- Full CRUD via chat (delete recipes, manage libraries, sharing)
- Semantic search / RAG
- Conversation history persistence
- User-configurable LLM settings
- AI Automation mode (auto-approve)
- Cooking mode / step-by-step guidance
- Meal planning / grocery lists

---

## Open Questions

- What model size works well on typical tester hardware?
- How much system prompt tuning is needed for good tool use?
- Will streaming responses work well with tool calls mid-stream?

These will be answered through implementation and tester feedback.
