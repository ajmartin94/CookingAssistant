/**
 * ChatPanel - Collapsible chat panel for AI assistant
 *
 * Features:
 * - Collapsible panel with toggle
 * - Message display with user/assistant distinction
 * - Streaming indicator during LLM response
 * - Error handling with retry
 * - Context-aware header
 * - Accessible with proper ARIA landmarks
 */

import { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronLeft, X, RefreshCw, Loader2 } from 'lucide-react';
import ChatInput from './ChatInput';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
}

export interface ChatContext {
  page: 'recipe_detail' | 'recipe_edit' | 'recipe_create' | 'recipe_list';
  recipeId?: string;
  recipeTitle?: string;
}

export interface ChatPanelProps {
  messages?: ChatMessage[];
  isStreaming?: boolean;
  error?: string;
  context?: ChatContext;
  defaultCollapsed?: boolean;
  onSendMessage: (message: string) => void;
  onConfirmTool?: (toolCallId: string, approved: boolean) => void;
  onRetry?: () => void;
}

export default function ChatPanel({
  messages = [],
  isStreaming = false,
  error,
  context,
  defaultCollapsed = false,
  onSendMessage,
  onRetry,
}: ChatPanelProps): React.ReactNode {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  // Track which error was dismissed (not a boolean) so new errors auto-show
  const [dismissedError, setDismissedError] = useState<string | null>(null);
  const messageListRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to newest message
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleDismissError = () => {
    setDismissedError(error || null);
  };

  // Show error if there is one and it's not the same as the dismissed error
  const showError = error && error !== dismissedError;

  // Compute context display
  const getContextLabel = () => {
    if (!context) return 'Chat';

    switch (context.page) {
      case 'recipe_detail':
      case 'recipe_edit':
        return context.recipeTitle || 'Recipe';
      case 'recipe_create':
        return 'New Recipe';
      case 'recipe_list':
        return 'Recipe List';
      default:
        return 'Chat';
    }
  };

  return (
    <aside
      aria-label="Chat assistant"
      className={`
        flex flex-col bg-white border-l border-neutral-200 transition-all duration-300
        ${isCollapsed ? 'w-12' : 'w-80'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-neutral-200">
        <button
          onClick={handleToggle}
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? 'Expand chat' : 'Collapse chat'}
          className="p-1 rounded hover:bg-neutral-100 transition-colors"
        >
          {isCollapsed ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
        {!isCollapsed && (
          <h2 className="font-semibold text-sm text-neutral-700 truncate flex-1 ml-2">
            AI Assistant
            {context && (
              <span className="font-normal text-neutral-500"> - {getContextLabel()}</span>
            )}
          </h2>
        )}
      </div>

      {/* Content - hidden when collapsed using visibility (preserves DOM for accessibility) */}
      <div
        className="flex-1 flex flex-col overflow-hidden"
        style={{
          visibility: isCollapsed ? 'hidden' : 'visible',
          height: isCollapsed ? 0 : 'auto',
          overflow: isCollapsed ? 'hidden' : 'auto',
        }}
      >
        {/* Message list */}
        <div
          ref={messageListRef}
          role="log"
          aria-live="polite"
          aria-label="Chat messages"
          data-testid="message-list"
          className="flex-1 overflow-y-auto p-3 space-y-3"
        >
          {messages.length === 0 ? (
            <div className="text-center text-neutral-500 text-sm py-8">
              How can I help you today?
            </div>
          ) : (
            messages.map((message) => (
              <article
                key={message.id}
                data-role={message.role}
                className={`
                  p-3 rounded-lg text-sm
                  ${
                    message.role === 'user'
                      ? 'bg-primary-50 text-primary-900 ml-4'
                      : 'bg-neutral-100 text-neutral-800 mr-4'
                  }
                `}
              >
                {message.content}
              </article>
            ))
          )}

          {/* Streaming indicator */}
          {isStreaming && (
            <div
              role="status"
              aria-label="AI is thinking"
              data-testid="streaming-indicator"
              className="flex items-center gap-2 text-sm text-neutral-500 p-3"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Thinking...</span>
            </div>
          )}
        </div>

        {/* Error state */}
        {showError && (
          <div
            role="alert"
            className="mx-3 mb-3 p-3 bg-error-50 border border-error-200 rounded-lg"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-error-700">{error}</p>
              <button
                onClick={handleDismissError}
                aria-label="Dismiss error"
                className="p-1 rounded hover:bg-error-100 text-error-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-2 flex items-center gap-1 text-sm text-error-600 hover:text-error-700"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            )}
          </div>
        )}

        {/* Input area */}
        <div className="p-3 border-t border-neutral-200">
          <ChatInput
            onSend={onSendMessage}
            isLoading={isStreaming}
            disabled={isStreaming}
            contextHint={context?.recipeTitle}
          />
        </div>
      </div>
    </aside>
  );
}
