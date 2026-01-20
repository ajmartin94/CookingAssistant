/**
 * FeedbackButtons Component
 *
 * Renders thumbs up/down buttons for AI message feedback.
 * Shows comment input after thumbs down is clicked.
 */

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';

export interface FeedbackData {
  messageId: string;
  rating: 'up' | 'down';
  comment?: string;
}

interface FeedbackButtonsProps {
  messageId: string;
  onFeedback: (feedback: FeedbackData) => void;
  currentRating?: 'up' | 'down';
  isLoading?: boolean;
  error?: string;
}

export default function FeedbackButtons({
  messageId,
  onFeedback,
  currentRating,
  isLoading = false,
  error,
}: FeedbackButtonsProps) {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [comment, setComment] = useState('');

  const handleThumbsUp = () => {
    onFeedback({ messageId, rating: 'up' });
  };

  const handleThumbsDown = () => {
    onFeedback({ messageId, rating: 'down' });
    setShowCommentInput(true);
  };

  const handleSubmitComment = () => {
    onFeedback({ messageId, rating: 'down', comment });
    setShowCommentInput(false);
    setComment('');
  };

  const handleSkipComment = () => {
    onFeedback({ messageId, rating: 'down' });
    setShowCommentInput(false);
    setComment('');
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin" role="status" aria-label="Loading" />
        )}

        <button
          type="button"
          onClick={handleThumbsUp}
          disabled={isLoading}
          aria-label="Thumbs up - this response was helpful"
          className={`p-1 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            currentRating === 'up' ? 'text-green-500' : 'text-gray-400'
          }`}
        >
          <ThumbsUp className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={handleThumbsDown}
          disabled={isLoading}
          aria-label="Thumbs down - this response was not helpful"
          className={`p-1 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            currentRating === 'down' ? 'text-red-500' : 'text-gray-400'
          }`}
        >
          <ThumbsDown className="h-4 w-4" />
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {showCommentInput && (
        <div className="flex flex-col gap-2">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What went wrong? (optional)"
            maxLength={2000}
            className="w-full p-2 text-sm border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSubmitComment}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={handleSkipComment}
              aria-label="Skip comment"
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
