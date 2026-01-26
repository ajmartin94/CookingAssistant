/**
 * AI Chat Input Component
 *
 * Central chat input for the home page with send button.
 * Currently visual only - shows toast on submit.
 */

import { useState } from 'react';
import { Send } from 'lucide-react';

export interface AIChatInputProps {
  onSubmit?: (message: string) => void;
  placeholder?: string;
}

export function AIChatInput({ onSubmit, placeholder = 'What are we cooking?' }: AIChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSubmit?.(message);
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className="
          relative bg-card border border-default rounded-2xl
          transition-all duration-200
          focus-within:border-accent-subtle focus-within:ring-2 focus-within:ring-accent-subtle
        "
      >
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholder}
          aria-label="Ask the cooking assistant"
          className="
            w-full py-5 px-6 pr-24
            bg-transparent border-none
            text-base text-text-primary
            placeholder:text-text-muted
            focus:outline-none
          "
        />
        <button
          type="submit"
          aria-label="Send message"
          data-testid="chat-submit"
          className="
            absolute right-3 top-1/2 -translate-y-1/2
            bg-accent hover:bg-accent-hover
            text-text-primary
            px-4 py-2.5 rounded-xl
            text-sm font-medium
            flex items-center gap-2
            transition-colors duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          disabled={!message.trim()}
        >
          <Send className="w-4 h-4" />
          Send
        </button>
      </div>
    </form>
  );
}

export default AIChatInput;
