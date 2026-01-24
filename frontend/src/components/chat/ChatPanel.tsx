/**
 * ChatPanel Component
 *
 * Right-side drawer panel for AI recipe chat interactions.
 * Manages message display, user input, and proposal apply/reject flow.
 */

import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { useChatSession } from '../../hooks/useChatSession';
import type { RecipeFormData } from '../../types';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentRecipe: RecipeFormData;
  onApply: (recipe: RecipeFormData) => void;
  recipeId?: string;
}

export function ChatPanel({ isOpen, onClose, currentRecipe, onApply }: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, error, currentProposal, sendMessage, applyChanges, rejectChanges } =
    useChatSession();

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const text = inputValue.trim();
    setInputValue('');
    await sendMessage(text, currentRecipe);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleApply = () => {
    const proposal = applyChanges();
    if (proposal) {
      onApply(proposal);
    }
  };

  const handleReject = () => {
    rejectChanges();
  };

  if (!isOpen) return null;

  return (
    <div
      role="complementary"
      aria-label="AI Recipe Chat"
      className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl border-l border-neutral-200 flex flex-col z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200">
        <h2 className="text-lg font-semibold text-neutral-900">AI Recipe Chat</h2>
        <button
          onClick={onClose}
          className="text-neutral-500 hover:text-neutral-700 transition"
          aria-label="Close chat"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Messages - ARIA live region */}
      <div role="log" aria-live="polite" className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, index) => (
          <ChatMessage
            key={index}
            role={msg.role}
            content={msg.content}
            proposedRecipe={msg.proposedRecipe}
            onApply={handleApply}
            onReject={handleReject}
            showProposal={msg.proposedRecipe != null && currentProposal != null}
          />
        ))}
        {isLoading && (
          <div role="status" className="flex justify-start mb-3">
            <div className="bg-neutral-100 rounded-lg p-3">
              <p className="text-sm text-neutral-500">Thinking...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error display */}
      {error && (
        <div role="alert" className="px-4 py-2 bg-error-50 border-t border-error-200">
          <p className="text-sm text-error-700">{error}</p>
        </div>
      )}

      {/* Input area */}
      <div className="p-4 border-t border-neutral-200">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Type a message..."
            aria-label="Message"
            className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:bg-neutral-100"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            aria-label="Send"
            className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
