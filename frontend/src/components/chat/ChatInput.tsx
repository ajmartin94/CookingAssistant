/**
 * ChatInput - Message input for chat panel
 *
 * Features:
 * - Text input with placeholder
 * - Send button with loading state
 * - Multi-line support (Shift+Enter for newlines, Enter to send)
 * - Auto-expanding textarea
 * - Character limit with counter
 * - Disabled and loading states
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2 } from 'lucide-react';

export interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  contextHint?: string;
  maxLength?: number;
  autoFocus?: boolean;
}

export default function ChatInput({
  onSend,
  isLoading = false,
  disabled = false,
  placeholder,
  contextHint,
  maxLength = 2000,
  autoFocus = false,
}: ChatInputProps): React.ReactNode {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isDisabled = isLoading || disabled;
  const trimmedMessage = message.trim();
  const canSend = trimmedMessage.length > 0 && !isDisabled;
  const showCharCount = maxLength && message.length >= maxLength * 0.9;

  // Compute placeholder text
  const displayPlaceholder =
    placeholder || (contextHint ? `Ask about ${contextHint}...` : 'Type a message...');

  // Auto-focus on mount if requested
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Auto-expand textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [message, adjustHeight]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSend) {
      onSend(trimmedMessage);
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) {
        onSend(trimmedMessage);
        setMessage('');
      }
    }
  };

  const remainingChars = maxLength - message.length;
  const isAtLimit = remainingChars <= 0;

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end">
      <div className="relative flex-1">
        <label htmlFor="chat-message-input" className="sr-only">
          Message
        </label>
        <textarea
          ref={textareaRef}
          id="chat-message-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={displayPlaceholder}
          maxLength={maxLength}
          disabled={isDisabled}
          rows={1}
          className={`
            w-full px-3 py-2 rounded-lg border resize-none
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            ${
              isDisabled
                ? 'opacity-50 cursor-not-allowed bg-neutral-100'
                : 'bg-white border-neutral-300'
            }
          `}
          aria-label="Message"
        />
        {showCharCount && (
          <div
            className={`absolute bottom-1 right-2 text-xs ${
              isAtLimit ? 'text-error-500 font-medium' : 'text-neutral-500'
            }`}
          >
            {message.length}/{maxLength}
            {isAtLimit ? ' - limit reached' : ` (${remainingChars} remaining)`}
          </div>
        )}
      </div>
      <button
        type="submit"
        disabled={isDisabled}
        aria-disabled={!canSend}
        aria-label="Send message"
        aria-busy={isLoading}
        className={`
          p-2 rounded-lg transition-colors
          ${
            canSend
              ? 'bg-primary-500 text-white hover:bg-primary-600'
              : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
          }
        `}
      >
        {isLoading ? (
          <Loader2 data-testid="loading-spinner" className="w-5 h-5 animate-spin" />
        ) : (
          <Send className="w-5 h-5" />
        )}
      </button>
    </form>
  );
}
