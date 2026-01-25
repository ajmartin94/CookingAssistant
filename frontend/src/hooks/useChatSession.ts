/**
 * useChatSession Hook
 *
 * Manages chat messages state, sessionStorage persistence, and API interactions
 */

import { useState, useCallback, useEffect } from 'react';
import { chatApi, type ChatMessage } from '../services/chatApi';
import type { RecipeFormData } from '../types';

const MAX_MESSAGES = 50;
const STORAGE_KEY_PREFIX = 'chat_history';

export interface ChatSessionMessage extends ChatMessage {
  proposedRecipe?: RecipeFormData | null;
}

interface UseChatSessionReturn {
  messages: ChatSessionMessage[];
  isLoading: boolean;
  error: string | null;
  currentProposal: RecipeFormData | null;
  sendMessage: (text: string, currentRecipe: RecipeFormData) => Promise<void>;
  applyChanges: () => RecipeFormData | null;
  rejectChanges: () => void;
}

/**
 * Hook for managing chat session state with page-specific persistence.
 * @param pageKey - Unique key for the page (e.g., 'create' or recipe ID for edit pages)
 * @param recipeId - Optional recipe ID for edit pages (sent to backend for ownership verification)
 */
export function useChatSession(
  pageKey: string = 'create',
  recipeId?: string
): UseChatSessionReturn {
  const storageKey = `${STORAGE_KEY_PREFIX}_${pageKey}`;

  const [messages, setMessages] = useState<ChatSessionMessage[]>(() => {
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored) as ChatSessionMessage[];
      }
    } catch {
      // Ignore parse errors
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentProposal, setCurrentProposal] = useState<RecipeFormData | null>(null);

  // Persist messages to sessionStorage whenever they change
  useEffect(() => {
    const toStore = messages.slice(-MAX_MESSAGES);
    sessionStorage.setItem(storageKey, JSON.stringify(toStore));
  }, [messages, storageKey]);

  const sendMessage = useCallback(
    async (text: string, currentRecipe: RecipeFormData) => {
      const userMessage: ChatSessionMessage = { role: 'user', content: text };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        // Build the full message history for the API call
        const apiMessages: ChatMessage[] = [
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          { role: 'user' as const, content: text },
        ];

        const response = await chatApi.sendChatMessage(apiMessages, currentRecipe, recipeId);

        const assistantMessage: ChatSessionMessage = {
          role: 'assistant',
          content: response.reply,
          proposedRecipe: response.proposedRecipe,
        };

        setMessages((prev) => [...prev, assistantMessage]);

        if (response.proposedRecipe) {
          setCurrentProposal(response.proposedRecipe);
        }
      } catch {
        setError('Failed to send message. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [messages]
  );

  const applyChanges = useCallback((): RecipeFormData | null => {
    const proposal = currentProposal;
    setCurrentProposal(null);
    return proposal;
  }, [currentProposal]);

  const rejectChanges = useCallback(() => {
    setCurrentProposal(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    currentProposal,
    sendMessage,
    applyChanges,
    rejectChanges,
  };
}
