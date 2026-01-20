# Frontend Development Guide

**Stack:** React 18, TypeScript, Vite
**Testing:** Vitest, React Testing Library, MSW

---

<!-- Per AD-0105 -->
## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── auth/
│   │   ├── recipes/
│   │   ├── libraries/
│   │   ├── chat/            # AI chat components
│   │   └── common/
│   ├── pages/               # Page-level components
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API client functions
│   ├── contexts/            # React Context providers (incl. ChatContext)
│   ├── types/               # TypeScript definitions
│   ├── utils/               # Helpers
│   ├── test/                # Test infrastructure
│   │   ├── setup.ts
│   │   ├── test-utils.tsx   # Custom render
│   │   └── mocks/           # MSW handlers
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── vite.config.ts
├── vitest.config.ts
└── tsconfig.json
```

---

## Key Principles

- **TypeScript strict**: Type all props, state, returns
- **Functional components**: Hooks only, no class components
- **Test user behavior**: Query by role/label, not implementation
- **Accessibility**: ARIA labels, semantic HTML, keyboard nav
- **Performance**: `useMemo`/`useCallback` for expensive ops

---

## Running Tests

```bash
# All tests
npm test

# Specific file
npm test -- --run RecipeForm.test.tsx

# With UI
npm run test:ui

# Coverage
npm run test:coverage

# E2E (Playwright)
npm run test:e2e
```

---

## Common Commands

```bash
# Dev server
npm run dev

# Build
npm run build

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

---

## Component Conventions

- **Props interface**: Always define `interface XxxProps`
- **Co-located tests**: `Component.test.tsx` next to `Component.tsx`
- **Custom hooks**: Extract stateful logic to `hooks/`
- **API calls**: Use `services/` functions, not inline fetch

---

<!-- Per AD-0100 -->
## API Conventions

- **Response transformation**: Backend uses snake_case (Python), frontend uses camelCase (TypeScript)
- Transform at service layer (see `services/recipeApi.ts:transformRecipe`)
- All API clients should follow this pattern for consistency

---

<!-- Per AD-0102 -->
## Navigation Patterns

For programmatic redirects (e.g., 401 handling), use the navigation service instead of `window.location.href`:

```typescript
// ✅ Use navigation service (works with E2E tests)
import { navigationService } from './services/navigationService';
navigationService.navigate('/login');

// ❌ Avoid window.location.href (breaks Playwright E2E tests)
window.location.href = '/login';
```

**Why?** Hard navigation conflicts with Playwright's `page.goto()`, causing unpredictable E2E test behavior. The navigation service uses React Router internally.

See [E2E Infrastructure Conventions](../docs/E2E_TESTING.md#infrastructure-conventions) for full context.

---

<!-- Per AD-0100 -->
## Tailwind Gotchas

- **No comments in className**: Tailwind's JIT scans template literals for class patterns. A comment containing a class name (e.g., `// collapse when...`) will be interpreted as that class.
  ```tsx
  // BAD: "collapse" in comment gets parsed as .collapse utility
  className={`sidebar ${isOpen ? 'w-64' : 'w-16'} // collapse when closed`}

  // GOOD: No comments in className
  className={`sidebar ${isOpen ? 'w-64' : 'w-16'}`}
  ```
- **Tailwind v4 + Vite**: Use `@tailwindcss/vite` plugin, not `@tailwindcss/postcss`

---

## Testing Patterns

- **Custom render**: Use `test-utils.tsx` with providers
- **MSW mocks**: Define API handlers in `test/mocks/`
- **Query by role**: Prefer `getByRole` over `getByTestId`
- **User events**: Use `userEvent` from `@testing-library/user-event`

**Pattern reference**: Read existing `.test.tsx` files for conventions.

---

<!-- Per AD-0105 -->
## Chat Component Conventions

The chat feature uses a context-based architecture for state management with streaming responses.

### ChatProvider / useChat

Wrap components that need chat functionality with `ChatProvider`:

```tsx
import { ChatProvider } from '../contexts/ChatContext';

function App() {
  return (
    <ChatProvider initialContext={{ page: 'recipe_detail', recipeId: '123' }}>
      <RecipeDetailPage />
    </ChatProvider>
  );
}
```

Access chat state with the `useChat` hook:

```tsx
import { useChat } from '../contexts/ChatContext';

function MyComponent() {
  const { messages, isStreaming, error, sendMessage, pendingToolCall } = useChat();
  // ...
}
```

### Context Types

Page context is injected to give the LLM awareness of where the user is:

```typescript
type ChatContext = {
  page: 'recipe_detail' | 'recipe_edit' | 'recipe_create' | 'recipe_list';
  recipeId?: string;
  recipeTitle?: string;
};
```

### Streaming Response Handling

The chat API returns Server-Sent Events (SSE) for streaming responses:

```typescript
// SSE event types from backend:
{ type: 'chunk', content: '...' }   // Text chunk
{ type: 'done', id: '...' }         // Stream complete
{ type: 'tool_call', id, name, args } // Tool call (needs confirmation)
```

ChatProvider handles accumulating chunks and updating message state automatically.

### Tool Call Confirmation (AI Assist Mode)

Tools that modify data require user confirmation before execution:

1. LLM returns a `tool_call` event with pending status
2. UI shows `ToolConfirmation` component with approve/reject buttons
3. User action calls `confirmTool(toolCallId, approved)`
4. Backend executes or cancels the tool

```tsx
const { pendingToolCall, confirmTool } = useChat();

if (pendingToolCall) {
  return (
    <ToolConfirmation
      toolCall={pendingToolCall}
      onConfirm={(id) => confirmTool(id, true)}
      onReject={(id) => confirmTool(id, false)}
    />
  );
}
```

### Chat Components

| Component | Purpose |
|-----------|---------|
| `ChatPanel` | Collapsible panel with message list, input, streaming indicator |
| `ChatInput` | Text input with send button |
| `ToolConfirmation` | Approve/reject UI for pending tool calls |
| `FeedbackButtons` | Thumbs up/down for rating responses |

---

<!-- Per AD-0101 -->
## Test Enforcement

All PRs must pass `frontend-ci` before merge. This includes:
- **Lint**: `eslint`, `stylelint`
- **Format**: `prettier --check`
- **Types**: `tsc --noEmit` (errors block merge)
- **Build**: `npm run build` (failures block merge)
- **Tests**: `vitest --run` (failures block merge)

See [docs/TESTING.md](../docs/TESTING.md#enforcement-policy) for full enforcement policy.
