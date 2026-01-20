/**
 * ChatContext / ChatProvider
 *
 * React context for managing chat state with the AI assistant.
 * Handles message state, API communication, streaming responses,
 * tool call confirmations, and page context injection.
 */

/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';
import type {
  ChatMessage,
  ToolCall,
  ChatContext as ChatContextType,
} from '../components/chat/ChatPanel';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  pendingToolCall: ToolCall | null;
  context: ChatContextType | undefined;
}

interface ChatContextValue extends ChatState {
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  confirmTool: (toolCallId: string, approved: boolean) => Promise<void>;
  setContext: (context: ChatContextType | undefined) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

interface ChatProviderProps {
  children: ReactNode;
  initialContext?: ChatContextType;
}

export function ChatProvider({ children, initialContext }: ChatProviderProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingToolCall, setPendingToolCall] = useState<ToolCall | null>(null);
  const [context, setContextState] = useState<ChatContextType | undefined>(initialContext);

  // Track pending tool calls queue for multiple tool calls
  const pendingToolCallsQueue = useRef<ToolCall[]>([]);

  const generateId = () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const setContext = useCallback((newContext: ChatContextType | undefined) => {
    setContextState(newContext);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setPendingToolCall(null);
    pendingToolCallsQueue.current = [];
    setError(null);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      // Add user message immediately
      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);
      setError(null);

      // Helper for handling SSE streaming response (defined inline to avoid closure issues)
      const processStreamingResponse = async (response: Response) => {
        const reader = response.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let streamingMessageId = '';
        let accumulatedContent = '';

        // Create placeholder message for streaming
        const placeholderMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, placeholderMessage]);
        streamingMessageId = placeholderMessage.id;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6);
                if (!jsonStr.trim()) continue;

                try {
                  const data = JSON.parse(jsonStr);

                  if (data.type === 'chunk') {
                    accumulatedContent += data.content;
                    // Update the streaming message
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === streamingMessageId
                          ? { ...msg, content: accumulatedContent }
                          : msg
                      )
                    );
                  } else if (data.type === 'done') {
                    // Finalize the message with the real ID
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === streamingMessageId
                          ? { ...msg, id: data.id || msg.id, content: accumulatedContent }
                          : msg
                      )
                    );
                  } else if (data.type === 'tool_call') {
                    // Handle tool call during streaming
                    const toolCall: ToolCall = {
                      id: data.id,
                      name: data.name,
                      args: data.args,
                      status: 'pending',
                    };
                    pendingToolCallsQueue.current.push(toolCall);
                    // Set pending if queue was empty
                    if (pendingToolCallsQueue.current.length === 1) {
                      setPendingToolCall(toolCall);
                    }
                  }
                } catch {
                  // Ignore parse errors for incomplete chunks
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      };

      try {
        // Build conversation history for API
        const conversationMessages = [...messages, userMessage].map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${BASE_URL}/api/v1/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            message: content,
            messages: conversationMessages,
            context,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Request failed' }));
          throw new Error(errorData.detail || 'Request failed');
        }

        const contentType = response.headers.get('Content-Type') || '';

        if (contentType.includes('text/event-stream')) {
          // Handle SSE streaming response
          await processStreamingResponse(response);
        } else {
          // Handle JSON response
          const data = await response.json();
          const assistantMessage: ChatMessage = {
            id: data.id,
            role: 'assistant',
            content: data.content,
            timestamp: new Date().toISOString(),
            toolCalls: data.toolCalls,
          };
          setMessages((prev) => [...prev, assistantMessage]);

          // Handle tool calls
          if (data.toolCalls && data.toolCalls.length > 0) {
            pendingToolCallsQueue.current = [...data.toolCalls];
            setPendingToolCall(data.toolCalls[0]);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, context]
  );

  const confirmTool = useCallback(async (toolCallId: string, approved: boolean) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${BASE_URL}/api/v1/chat/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          toolCallId,
          approved,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Confirmation failed' }));
        throw new Error(errorData.detail || 'Confirmation failed');
      }

      const data = await response.json();

      // Update tool call status in messages
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.toolCalls) {
            return {
              ...msg,
              toolCalls: msg.toolCalls.map((tc) =>
                tc.id === toolCallId ? { ...tc, status: approved ? 'approved' : 'rejected' } : tc
              ),
            };
          }
          return msg;
        })
      );

      // Remove from queue and set next pending
      pendingToolCallsQueue.current = pendingToolCallsQueue.current.filter(
        (tc) => tc.id !== toolCallId
      );
      setPendingToolCall(pendingToolCallsQueue.current[0] || null);

      // Add confirmation response message
      if (data.content) {
        const confirmationMessage: ChatMessage = {
          id: data.id || generateId(),
          role: 'assistant',
          content: data.content,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, confirmationMessage]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Confirmation failed');
    }
  }, []);

  const value: ChatContextValue = {
    messages,
    isStreaming,
    error,
    pendingToolCall,
    context,
    sendMessage,
    clearMessages,
    confirmTool,
    setContext,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
