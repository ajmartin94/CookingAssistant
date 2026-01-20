/**
 * TDD Tests for ChatContext / ChatProvider
 *
 * Tests for the chat state management context that handles:
 * - Message state (add, clear)
 * - Sending messages via API
 * - Streaming responses
 * - Pending tool calls
 * - Confirmation flow (approve/reject)
 * - Context injection (page, recipe_id)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { render as rtlRender } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';
import { ChatProvider, useChat } from './ChatContext';
import type { ChatContext as ChatContextType } from '../components/chat/ChatPanel';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Test component that exercises the chat context
function TestChatConsumer() {
  const {
    messages,
    isStreaming,
    error,
    pendingToolCall,
    context,
    sendMessage,
    clearMessages,
    confirmTool,
    setContext,
  } = useChat();

  return (
    <div>
      <div data-testid="message-count">{messages.length}</div>
      <div data-testid="is-streaming">{isStreaming ? 'streaming' : 'idle'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="pending-tool">{pendingToolCall ? pendingToolCall.name : 'none'}</div>
      <div data-testid="context-page">{context?.page || 'no-context'}</div>
      <div data-testid="context-recipe-id">{context?.recipeId || 'no-recipe'}</div>

      {/* Display messages */}
      <ul data-testid="messages">
        {messages.map((msg) => (
          <li key={msg.id} data-role={msg.role}>
            {msg.content}
          </li>
        ))}
      </ul>

      {/* Actions */}
      <button onClick={() => sendMessage('Hello AI')}>Send Message</button>
      <button onClick={clearMessages}>Clear Messages</button>
      <button onClick={() => confirmTool(pendingToolCall?.id || '', true)}>Approve Tool</button>
      <button onClick={() => confirmTool(pendingToolCall?.id || '', false)}>Reject Tool</button>
      <button
        onClick={() =>
          setContext({ page: 'recipe_detail', recipeId: 'recipe-123', recipeTitle: 'Test Recipe' })
        }
      >
        Set Context
      </button>
    </div>
  );
}

// Wrapper for rendering with ChatProvider
function renderWithChatProvider(ui: ReactNode, initialContext?: ChatContextType) {
  return {
    user: userEvent.setup(),
    ...render(<ChatProvider initialContext={initialContext}>{ui}</ChatProvider>),
  };
}

describe('ChatContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial state', () => {
    it('should provide chat context with empty messages', () => {
      renderWithChatProvider(<TestChatConsumer />);

      expect(screen.getByTestId('message-count')).toHaveTextContent('0');
      expect(screen.getByTestId('is-streaming')).toHaveTextContent('idle');
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
      expect(screen.getByTestId('pending-tool')).toHaveTextContent('none');
    });

    it('should accept initial context', () => {
      renderWithChatProvider(<TestChatConsumer />, {
        page: 'recipe_detail',
        recipeId: 'recipe-456',
        recipeTitle: 'My Recipe',
      });

      expect(screen.getByTestId('context-page')).toHaveTextContent('recipe_detail');
      expect(screen.getByTestId('context-recipe-id')).toHaveTextContent('recipe-456');
    });

    it('should throw error when useChat is used outside provider', () => {
      expect(() => {
        function BadComponent() {
          useChat();
          return null;
        }
        rtlRender(<BadComponent />, {
          wrapper: ({ children }: { children: ReactNode }) => <>{children}</>,
        });
      }).toThrow('useChat must be used within a ChatProvider');
    });
  });

  describe('Message state management', () => {
    it('should add user message when sendMessage is called', async () => {
      // Mock a simple response (no streaming for this test)
      server.use(
        http.post(`${BASE_URL}/api/v1/chat`, () => {
          return HttpResponse.json({
            id: 'msg-1',
            role: 'assistant',
            content: 'Hello! How can I help?',
          });
        })
      );

      const { user } = renderWithChatProvider(<TestChatConsumer />);

      await user.click(screen.getByText('Send Message'));

      // User message should be added immediately
      await waitFor(() => {
        expect(screen.getByTestId('message-count')).not.toHaveTextContent('0');
      });

      const messages = screen.getByTestId('messages');
      expect(messages).toHaveTextContent('Hello AI');
    });

    it('should clear all messages when clearMessages is called', async () => {
      server.use(
        http.post(`${BASE_URL}/api/v1/chat`, () => {
          return HttpResponse.json({
            id: 'msg-1',
            role: 'assistant',
            content: 'Response',
          });
        })
      );

      const { user } = renderWithChatProvider(<TestChatConsumer />);

      // Send a message first
      await user.click(screen.getByText('Send Message'));
      await waitFor(() => {
        expect(screen.getByTestId('message-count')).not.toHaveTextContent('0');
      });

      // Clear messages
      await user.click(screen.getByText('Clear Messages'));

      expect(screen.getByTestId('message-count')).toHaveTextContent('0');
    });

    it('should add assistant message after API response', async () => {
      server.use(
        http.post(`${BASE_URL}/api/v1/chat`, () => {
          return HttpResponse.json({
            id: 'msg-assistant-1',
            role: 'assistant',
            content: 'I can help you with that recipe!',
          });
        })
      );

      const { user } = renderWithChatProvider(<TestChatConsumer />);

      await user.click(screen.getByText('Send Message'));

      await waitFor(() => {
        const messages = screen.getByTestId('messages');
        expect(messages).toHaveTextContent('I can help you with that recipe!');
      });
    });
  });

  describe('Sending messages via API', () => {
    it('should send message with context to API', async () => {
      let capturedRequest: { message: string; context?: ChatContextType } | null = null;

      server.use(
        http.post(`${BASE_URL}/api/v1/chat`, async ({ request }) => {
          capturedRequest = (await request.json()) as {
            message: string;
            context?: ChatContextType;
          };
          return HttpResponse.json({
            id: 'msg-1',
            role: 'assistant',
            content: 'Got it!',
          });
        })
      );

      const { user } = renderWithChatProvider(<TestChatConsumer />, {
        page: 'recipe_detail',
        recipeId: 'recipe-789',
        recipeTitle: 'Pasta Recipe',
      });

      await user.click(screen.getByText('Send Message'));

      await waitFor(() => {
        expect(capturedRequest).not.toBeNull();
      });

      expect(capturedRequest?.message).toBe('Hello AI');
      expect(capturedRequest?.context).toEqual({
        page: 'recipe_detail',
        recipeId: 'recipe-789',
        recipeTitle: 'Pasta Recipe',
      });
    });

    it('should set error state on API failure', async () => {
      server.use(
        http.post(`${BASE_URL}/api/v1/chat`, () => {
          return HttpResponse.json({ detail: 'Service unavailable' }, { status: 503 });
        })
      );

      const { user } = renderWithChatProvider(<TestChatConsumer />);

      await user.click(screen.getByText('Send Message'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).not.toHaveTextContent('no-error');
      });
    });

    it('should include conversation history in API request', async () => {
      let requestCount = 0;
      let capturedMessages: Array<{ role: string; content: string }> = [];

      server.use(
        http.post(`${BASE_URL}/api/v1/chat`, async ({ request }) => {
          requestCount++;
          const body = (await request.json()) as {
            messages?: Array<{ role: string; content: string }>;
          };
          capturedMessages = body.messages || [];

          return HttpResponse.json({
            id: `msg-${requestCount}`,
            role: 'assistant',
            content: `Response ${requestCount}`,
          });
        })
      );

      const { user } = renderWithChatProvider(<TestChatConsumer />);

      // Send first message
      await user.click(screen.getByText('Send Message'));
      await waitFor(() => {
        expect(screen.getByTestId('messages')).toHaveTextContent('Response 1');
      });

      // Send second message - should include history
      await user.click(screen.getByText('Send Message'));
      await waitFor(() => {
        expect(screen.getByTestId('messages')).toHaveTextContent('Response 2');
      });

      // Second request should have conversation history
      expect(capturedMessages.length).toBeGreaterThan(1);
    });
  });

  describe('Streaming responses', () => {
    it('should set isStreaming to true while waiting for response', async () => {
      // Use a delayed response to observe streaming state
      server.use(
        http.post(`${BASE_URL}/api/v1/chat`, async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json({
            id: 'msg-1',
            role: 'assistant',
            content: 'Response',
          });
        })
      );

      const { user } = renderWithChatProvider(<TestChatConsumer />);

      // Start sending message
      await user.click(screen.getByText('Send Message'));

      // Should be streaming
      expect(screen.getByTestId('is-streaming')).toHaveTextContent('streaming');

      // Wait for response
      await waitFor(() => {
        expect(screen.getByTestId('is-streaming')).toHaveTextContent('idle');
      });
    });

    it('should handle streaming text chunks', async () => {
      // Mock Server-Sent Events (SSE) for streaming
      server.use(
        http.post(`${BASE_URL}/api/v1/chat`, () => {
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            async start(controller) {
              // Send chunks
              controller.enqueue(encoder.encode('data: {"type":"chunk","content":"Hello"}\n\n'));
              await new Promise((r) => setTimeout(r, 10));
              controller.enqueue(encoder.encode('data: {"type":"chunk","content":" world"}\n\n'));
              await new Promise((r) => setTimeout(r, 10));
              controller.enqueue(encoder.encode('data: {"type":"done","id":"msg-1"}\n\n'));
              controller.close();
            },
          });

          return new HttpResponse(stream, {
            headers: {
              'Content-Type': 'text/event-stream',
            },
          });
        })
      );

      const { user } = renderWithChatProvider(<TestChatConsumer />);

      await user.click(screen.getByText('Send Message'));

      await waitFor(() => {
        const messages = screen.getByTestId('messages');
        expect(messages).toHaveTextContent('Hello world');
      });
    });

    it('should update message incrementally during streaming', async () => {
      let resolveStream: () => void;
      const streamPromise = new Promise<void>((resolve) => {
        resolveStream = resolve;
      });

      server.use(
        http.post(`${BASE_URL}/api/v1/chat`, () => {
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            async start(controller) {
              controller.enqueue(encoder.encode('data: {"type":"chunk","content":"First"}\n\n'));
              await streamPromise;
              controller.enqueue(encoder.encode('data: {"type":"chunk","content":" Second"}\n\n'));
              controller.enqueue(encoder.encode('data: {"type":"done","id":"msg-1"}\n\n'));
              controller.close();
            },
          });

          return new HttpResponse(stream, {
            headers: { 'Content-Type': 'text/event-stream' },
          });
        })
      );

      const { user } = renderWithChatProvider(<TestChatConsumer />);

      await user.click(screen.getByText('Send Message'));

      // Should see first chunk
      await waitFor(() => {
        expect(screen.getByTestId('messages')).toHaveTextContent('First');
      });

      // Continue streaming
      act(() => resolveStream!());

      // Should see both chunks
      await waitFor(() => {
        expect(screen.getByTestId('messages')).toHaveTextContent('First Second');
      });
    });
  });

  describe('Pending tool call state', () => {
    it('should set pendingToolCall when response includes tool call', async () => {
      server.use(
        http.post(`${BASE_URL}/api/v1/chat`, () => {
          return HttpResponse.json({
            id: 'msg-1',
            role: 'assistant',
            content: 'I will edit that recipe for you.',
            toolCalls: [
              {
                id: 'tool-call-1',
                name: 'edit_recipe',
                args: { recipeId: 'recipe-123', title: 'Updated Title' },
                status: 'pending',
              },
            ],
          });
        })
      );

      const { user } = renderWithChatProvider(<TestChatConsumer />);

      await user.click(screen.getByText('Send Message'));

      await waitFor(() => {
        expect(screen.getByTestId('pending-tool')).toHaveTextContent('edit_recipe');
      });
    });

    it('should track multiple tool calls in a single response', async () => {
      server.use(
        http.post(`${BASE_URL}/api/v1/chat`, () => {
          return HttpResponse.json({
            id: 'msg-1',
            role: 'assistant',
            content: 'Here are some suggestions.',
            toolCalls: [
              {
                id: 'tool-1',
                name: 'suggest_substitutions',
                args: { recipeId: 'r1' },
                status: 'pending',
              },
              {
                id: 'tool-2',
                name: 'edit_recipe',
                args: { recipeId: 'r1', dietary_tags: ['vegan'] },
                status: 'pending',
              },
            ],
          });
        })
      );

      const { user } = renderWithChatProvider(<TestChatConsumer />);

      await user.click(screen.getByText('Send Message'));

      // First pending tool should be shown (queue-based)
      await waitFor(() => {
        expect(screen.getByTestId('pending-tool')).not.toHaveTextContent('none');
      });
    });

    it('should show tool calls in message history', async () => {
      server.use(
        http.post(`${BASE_URL}/api/v1/chat`, () => {
          return HttpResponse.json({
            id: 'msg-1',
            role: 'assistant',
            content: 'Creating recipe.',
            toolCalls: [
              {
                id: 'tool-1',
                name: 'create_recipe',
                args: { title: 'New Recipe' },
                status: 'pending',
              },
            ],
          });
        })
      );

      const { user } = renderWithChatProvider(<TestChatConsumer />);

      await user.click(screen.getByText('Send Message'));

      await waitFor(() => {
        expect(screen.getByTestId('messages')).toHaveTextContent('Creating recipe');
      });
    });
  });

  describe('Confirmation flow', () => {
    it('should call confirm API when tool is approved', async () => {
      let confirmCalled = false;
      let capturedConfirmRequest: { toolCallId: string; approved: boolean } | null = null;

      server.use(
        http.post(`${BASE_URL}/api/v1/chat`, () => {
          return HttpResponse.json({
            id: 'msg-1',
            role: 'assistant',
            content: 'Editing recipe.',
            toolCalls: [
              {
                id: 'tool-call-123',
                name: 'edit_recipe',
                args: { title: 'New Title' },
                status: 'pending',
              },
            ],
          });
        }),
        http.post(`${BASE_URL}/api/v1/chat/confirm`, async ({ request }) => {
          confirmCalled = true;
          capturedConfirmRequest = (await request.json()) as {
            toolCallId: string;
            approved: boolean;
          };
          return HttpResponse.json({
            id: 'msg-2',
            role: 'assistant',
            content: 'Recipe updated successfully!',
          });
        })
      );

      const { user } = renderWithChatProvider(<TestChatConsumer />);

      // Send message to get tool call
      await user.click(screen.getByText('Send Message'));
      await waitFor(() => {
        expect(screen.getByTestId('pending-tool')).toHaveTextContent('edit_recipe');
      });

      // Approve tool
      await user.click(screen.getByText('Approve Tool'));

      await waitFor(() => {
        expect(confirmCalled).toBe(true);
      });

      expect(capturedConfirmRequest?.toolCallId).toBe('tool-call-123');
      expect(capturedConfirmRequest?.approved).toBe(true);
    });

    it('should call confirm API when tool is rejected', async () => {
      let capturedConfirmRequest: { toolCallId: string; approved: boolean } | null = null;

      server.use(
        http.post(`${BASE_URL}/api/v1/chat`, () => {
          return HttpResponse.json({
            id: 'msg-1',
            role: 'assistant',
            content: 'Should I create this?',
            toolCalls: [
              {
                id: 'tool-reject-1',
                name: 'create_recipe',
                args: { title: 'Recipe' },
                status: 'pending',
              },
            ],
          });
        }),
        http.post(`${BASE_URL}/api/v1/chat/confirm`, async ({ request }) => {
          capturedConfirmRequest = (await request.json()) as {
            toolCallId: string;
            approved: boolean;
          };
          return HttpResponse.json({
            id: 'msg-2',
            role: 'assistant',
            content: "Okay, I won't create that recipe.",
          });
        })
      );

      const { user } = renderWithChatProvider(<TestChatConsumer />);

      await user.click(screen.getByText('Send Message'));
      await waitFor(() => {
        expect(screen.getByTestId('pending-tool')).not.toHaveTextContent('none');
      });

      await user.click(screen.getByText('Reject Tool'));

      await waitFor(() => {
        expect(capturedConfirmRequest?.approved).toBe(false);
      });
    });

    it('should update tool status to approved after confirmation', async () => {
      server.use(
        http.post(`${BASE_URL}/api/v1/chat`, () => {
          return HttpResponse.json({
            id: 'msg-1',
            role: 'assistant',
            content: 'Editing.',
            toolCalls: [
              {
                id: 'tool-1',
                name: 'edit_recipe',
                args: {},
                status: 'pending',
              },
            ],
          });
        }),
        http.post(`${BASE_URL}/api/v1/chat/confirm`, () => {
          return HttpResponse.json({
            id: 'msg-2',
            role: 'assistant',
            content: 'Done!',
          });
        })
      );

      const { user } = renderWithChatProvider(<TestChatConsumer />);

      await user.click(screen.getByText('Send Message'));
      await waitFor(() => {
        expect(screen.getByTestId('pending-tool')).toHaveTextContent('edit_recipe');
      });

      await user.click(screen.getByText('Approve Tool'));

      // After approval, pending tool should be cleared
      await waitFor(() => {
        expect(screen.getByTestId('pending-tool')).toHaveTextContent('none');
      });
    });

    it('should update tool status to rejected after rejection', async () => {
      server.use(
        http.post(`${BASE_URL}/api/v1/chat`, () => {
          return HttpResponse.json({
            id: 'msg-1',
            role: 'assistant',
            content: 'Creating.',
            toolCalls: [
              {
                id: 'tool-1',
                name: 'create_recipe',
                args: {},
                status: 'pending',
              },
            ],
          });
        }),
        http.post(`${BASE_URL}/api/v1/chat/confirm`, () => {
          return HttpResponse.json({
            id: 'msg-2',
            role: 'assistant',
            content: 'Cancelled.',
          });
        })
      );

      const { user } = renderWithChatProvider(<TestChatConsumer />);

      await user.click(screen.getByText('Send Message'));
      await waitFor(() => {
        expect(screen.getByTestId('pending-tool')).not.toHaveTextContent('none');
      });

      await user.click(screen.getByText('Reject Tool'));

      await waitFor(() => {
        expect(screen.getByTestId('pending-tool')).toHaveTextContent('none');
      });
    });

    it('should add confirmation result message to history', async () => {
      server.use(
        http.post(`${BASE_URL}/api/v1/chat`, () => {
          return HttpResponse.json({
            id: 'msg-1',
            role: 'assistant',
            content: 'Editing recipe.',
            toolCalls: [
              {
                id: 'tool-1',
                name: 'edit_recipe',
                args: {},
                status: 'pending',
              },
            ],
          });
        }),
        http.post(`${BASE_URL}/api/v1/chat/confirm`, () => {
          return HttpResponse.json({
            id: 'msg-2',
            role: 'assistant',
            content: 'Recipe has been updated!',
          });
        })
      );

      const { user } = renderWithChatProvider(<TestChatConsumer />);

      await user.click(screen.getByText('Send Message'));
      await waitFor(() => {
        expect(screen.getByTestId('pending-tool')).not.toHaveTextContent('none');
      });

      await user.click(screen.getByText('Approve Tool'));

      await waitFor(() => {
        expect(screen.getByTestId('messages')).toHaveTextContent('Recipe has been updated!');
      });
    });
  });

  describe('Context injection', () => {
    it('should update context via setContext', async () => {
      const { user } = renderWithChatProvider(<TestChatConsumer />);

      expect(screen.getByTestId('context-page')).toHaveTextContent('no-context');

      await user.click(screen.getByText('Set Context'));

      expect(screen.getByTestId('context-page')).toHaveTextContent('recipe_detail');
      expect(screen.getByTestId('context-recipe-id')).toHaveTextContent('recipe-123');
    });

    it('should include updated context in subsequent API calls', async () => {
      let capturedContext: ChatContextType | undefined;

      server.use(
        http.post(`${BASE_URL}/api/v1/chat`, async ({ request }) => {
          const body = (await request.json()) as { context?: ChatContextType };
          capturedContext = body.context;
          return HttpResponse.json({
            id: 'msg-1',
            role: 'assistant',
            content: 'Response',
          });
        })
      );

      const { user } = renderWithChatProvider(<TestChatConsumer />);

      // Set context first
      await user.click(screen.getByText('Set Context'));

      // Send message
      await user.click(screen.getByText('Send Message'));

      await waitFor(() => {
        expect(capturedContext).toEqual({
          page: 'recipe_detail',
          recipeId: 'recipe-123',
          recipeTitle: 'Test Recipe',
        });
      });
    });

    it('should support all page types', () => {
      const pageTypes: ChatContextType['page'][] = [
        'recipe_detail',
        'recipe_edit',
        'recipe_create',
        'recipe_list',
      ];

      pageTypes.forEach((page) => {
        const { unmount } = render(
          <ChatProvider initialContext={{ page }}>
            <TestChatConsumer />
          </ChatProvider>
        );

        expect(screen.getByTestId('context-page')).toHaveTextContent(page);
        unmount();
      });
    });

    it('should clear context when setContext is called with undefined', async () => {
      // Component with clear context button
      function TestWithClear() {
        const { context, setContext } = useChat();
        return (
          <div>
            <div data-testid="context-page">{context?.page || 'no-context'}</div>
            <button onClick={() => setContext(undefined)}>Clear Context</button>
          </div>
        );
      }

      const { user } = renderWithChatProvider(<TestWithClear />, {
        page: 'recipe_detail',
        recipeId: 'r1',
      });

      expect(screen.getByTestId('context-page')).toHaveTextContent('recipe_detail');

      await user.click(screen.getByText('Clear Context'));

      expect(screen.getByTestId('context-page')).toHaveTextContent('no-context');
    });
  });
});
