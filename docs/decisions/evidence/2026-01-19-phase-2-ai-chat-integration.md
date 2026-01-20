# State of the Union: Phase 2 AI Chat Integration Documentation Needs

## Metadata
- **Date**: 2026-01-19
- **Author**: Claude (AI assistant)
- **Trigger Type**: code-change (planned)

## Trigger Event

### What Happened
A design plan for Phase 2 AI Chat Integration has been created and committed. This introduces significant new architecture:
- LLM service layer with LiteLLM provider abstraction
- Chat API endpoints with tool-calling pattern
- Tool executor framework with confirmation flow
- Frontend chat components with contextual integration
- Docker Compose deployment with Ollama

### Reference
- Design document: `docs/plans/2026-01-19-ai-chat-integration-design.md`
- Branch: `feature/ai-chat`
- Beads: 21 tasks created under epic `CookingAssistant-0u2`

## Evidence

### Planned Code Changes

**Backend additions:**
- `backend/app/services/llm/` - New LLM service layer
- `backend/app/api/v1/chat.py` - New chat endpoints
- New environment variables: `LLM_MODEL`, `OLLAMA_API_BASE`
- New dependency: `litellm`

**Frontend additions:**
- `frontend/src/components/chat/` - ChatPanel, ChatInput, ToolConfirmation
- `frontend/src/contexts/ChatContext.tsx` - Chat state management
- Integration into 4 pages: Recipe Detail, Edit, Create, List

**Infrastructure additions:**
- `docker-compose.yml` - Multi-container deployment
- Dockerfiles for backend and frontend
- Ollama integration for local LLM

### Current Documentation State

**backend/CLAUDE.md:**
- Project structure shows `app/ai/` directory (line 20) - design uses `app/services/llm/` instead
- No mention of LLM services or tool patterns
- No mention of chat API conventions

**frontend/CLAUDE.md:**
- No mention of chat components
- No mention of ChatContext/ChatProvider
- No mention of streaming response patterns

**docs/TESTING.md:**
- Testing pyramid exists but no mention of LLM smoke tests
- No guidance on mocking LLM services
- No mention of manual quality testing for AI responses

**Root CLAUDE.md:**
- "Three Modes" principle documented (Manual, AI Assist, AI Automation)
- No indication of which modes are currently implemented
- No Docker deployment guidance

### Observations

1. **Directory structure conflict**: Backend CLAUDE.md shows `app/ai/` but design uses `app/services/llm/`. Need to decide which pattern to follow or reconcile.

2. **New architectural patterns not documented**:
   - Tool executor pattern (confirmation gating)
   - Provider abstraction via LiteLLM
   - Contextual UI integration (chat appearing on multiple pages)
   - Streaming response handling

3. **Testing gap**: LLM smoke tests are a new category not covered by existing testing documentation. The distinction between "functional tests (mocked)" and "smoke tests (real LLM)" needs documentation.

4. **Deployment documentation missing**: No existing Docker deployment guide. This will be needed for tester onboarding.

5. **Three Modes principle**: Design explicitly implements "AI Assist" mode. Documentation could be updated to reflect this is now available.

## Potentially Affected Documentation

- [ ] `backend/CLAUDE.md` - Project structure, new service patterns, env vars
- [ ] `frontend/CLAUDE.md` - New components, contexts, patterns
- [ ] `docs/TESTING.md` - LLM smoke tests, mocking strategy
- [ ] `CLAUDE.md` (root) - Three Modes status, deployment reference
- [ ] New: Docker deployment documentation
- [ ] New: Environment variable reference

## Gate 1 Evaluation
- **Decision**: YES
- **Evaluator**: User (ajmartin94)
- **Date**: 2026-01-19
- **AD Number**: AD-0105
- **Rationale**: Documentation gaps identified for new LLM service layer, chat components, testing patterns, and deployment need formal tracking through the ADR process.
