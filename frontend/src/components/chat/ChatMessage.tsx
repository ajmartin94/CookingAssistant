/**
 * ChatMessage Component
 *
 * Renders user/AI message bubbles with optional ChangeSummary for proposals
 */

import { ChangeSummary } from './ChangeSummary';
import type { RecipeFormData } from '../../types';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  proposedRecipe?: RecipeFormData | null;
  onApply?: () => void;
  onReject?: () => void;
  showProposal?: boolean;
}

export function ChatMessage({
  role,
  content,
  proposedRecipe,
  onApply,
  onReject,
  showProposal = true,
}: ChatMessageProps) {
  const isUser = role === 'user';
  const testId = isUser ? 'chat-message-user' : 'chat-message-ai';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`} data-testid={testId}>
      <div
        className={`max-w-[80%] rounded-lg p-3 ${
          isUser ? 'bg-primary-500 text-white' : 'bg-neutral-100 text-neutral-900'
        }`}
      >
        <p className="text-sm">{content}</p>
        {!isUser && proposedRecipe && showProposal && onApply && onReject && (
          <ChangeSummary proposedRecipe={proposedRecipe} onApply={onApply} onReject={onReject} />
        )}
      </div>
    </div>
  );
}
