# AD-0105: Phase 2 AI Chat Integration Documentation

## Status
Accepted

## Metadata
- **Author**: Claude (AI assistant)
- **Date**: 2026-01-19
- **Evidence Reference**: `docs/decisions/evidence/2026-01-19-phase-2-ai-chat-integration.md`
- **Trigger Type**: code-change (planned)

## Context

Phase 2 AI Chat Integration introduces significant new architectural patterns to the Cooking Assistant:

1. **LLM Service Layer** - A provider-agnostic abstraction using LiteLLM that can switch between Ollama (local), OpenAI, and Anthropic via configuration
2. **Tool Executor Pattern** - LLM tool calls that require user confirmation before execution (AI Assist mode)
3. **Chat API** - New endpoints for conversational interaction with streaming responses
4. **Contextual UI** - Chat panel that appears on multiple pages with page-specific context
5. **Docker Deployment** - Multi-container setup with Ollama for local LLM inference

The existing documentation does not cover these patterns. Additionally, there's a conflict between the documented `app/ai/` directory structure and the designed `app/services/llm/` location.

## Problem Statement

How should we document the Phase 2 AI Chat Integration architecture and conventions so that future development follows consistent patterns?

## Decision

We will update existing documentation files to incorporate AI chat conventions and create a new Docker deployment guide. Documentation updates will happen incrementally as each implementation phase completes, not all at once upfront.

## Alternatives Considered

### Option A: Incremental Documentation (Recommended)

**Description**: Update documentation files as each implementation phase completes. After Phase 2a (LLM Infrastructure), update backend/CLAUDE.md. After Phase 2c (Chat UI), update frontend/CLAUDE.md. Create Docker guide in Phase 2d.

**Pros**:
- Documentation stays synchronized with actual implementation
- Allows for design adjustments during implementation
- Reduces risk of documenting patterns that change
- Follows TDD spirit - document what's actually built

**Cons**:
- Requires discipline to update docs at each phase
- Temporary gap between code and docs during implementation

**Recommendation**: Selected

### Option B: Upfront Documentation

**Description**: Write all documentation updates now, before implementation begins.

**Pros**:
- Complete documentation from day one
- Forces design decisions to be finalized upfront

**Cons**:
- High risk of documentation becoming stale if design changes
- Duplicates information already in the design document
- May document patterns that don't survive implementation

**Recommendation**: Not selected — premature; design doc serves this purpose during implementation

### Option C: Status Quo (No Documentation Updates)

**Description**: Rely on the design document and code comments; don't update CLAUDE.md files.

**Pros**:
- No documentation maintenance burden
- Design doc already captures the patterns

**Cons**:
- CLAUDE.md files become incomplete/misleading
- New contributors won't find AI patterns in expected locations
- Violates project principle of keeping docs current

**Recommendation**: Not selected — contradicts project documentation standards

## Consequences

**What becomes easier:**
- Future AI feature development will have documented patterns to follow
- Onboarding to AI-related code will be straightforward
- Docker deployment will have clear instructions

**What becomes harder:**
- Each implementation phase requires a documentation checkpoint
- Must remember to update docs (beads tasks will track this)

**Trade-offs:**
- Accepting temporary doc/code drift during active implementation in exchange for accurate final documentation

## Affected Documentation

| File | Section | Change Required | When |
|------|---------|-----------------|------|
| `backend/CLAUDE.md` | Project Structure | Add `services/llm/` directory, remove/clarify `ai/` reference | After Phase 2a |
| `backend/CLAUDE.md` | New section | Add "LLM Service Conventions" (provider config, tool patterns) | After Phase 2b |
| `frontend/CLAUDE.md` | Project Structure | Add `components/chat/` directory | After Phase 2c |
| `frontend/CLAUDE.md` | New section | Add "Chat Component Conventions" (ChatProvider, streaming) | After Phase 2c |
| `docs/TESTING.md` | Testing Pyramid | Add LLM smoke tests as separate category | After Phase 2b |
| `docs/TESTING.md` | New section | Add "LLM Testing Patterns" (mocking, smoke tests) | After Phase 2b |
| `CLAUDE.md` (root) | Three Modes | Note that AI Assist mode is now implemented | After Phase 2c |
| New file | `docs/DOCKER_DEPLOYMENT.md` | Create Docker deployment guide | Phase 2d |
| New file | `docs/ENVIRONMENT_VARIABLES.md` or section | Document LLM_MODEL, OLLAMA_API_BASE | After Phase 2a |

## Implementation Notes

To ensure documentation updates happen, the following beads tasks should be created (or existing tasks amended):

1. **After Phase 2a completion**: Update backend/CLAUDE.md with LLM service structure
2. **After Phase 2b completion**: Update docs/TESTING.md with LLM testing patterns
3. **After Phase 2c completion**: Update frontend/CLAUDE.md with chat patterns; update root CLAUDE.md
4. **Phase 2d task (0u2.13)**: Already includes tester onboarding documentation

The propagation step (Step 3) of this ADR will be executed incrementally as each phase completes, rather than all at once.

## Gate 2 Approval
- **Decision**: APPROVE
- **Approver**: User (ajmartin94)
- **Date**: 2026-01-19
- **Notes**: Incremental documentation approach approved. Gate 3 will be evaluated after all phases complete and documentation updates are propagated.
