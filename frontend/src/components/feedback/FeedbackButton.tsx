/**
 * FeedbackButton Component
 *
 * Floating button in the bottom-left corner that opens the feedback modal.
 * Positioned on the left to avoid conflicts with page-specific action buttons
 * (like Delete/Share on recipe pages) which are on the right.
 */

import { useState } from 'react';
import { FeedbackModal } from './FeedbackModal';

export function FeedbackButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        aria-label="Give Feedback"
        className="fixed bottom-4 left-4 px-4 py-2 bg-accent text-text-primary rounded-full shadow-lg hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-colors"
      >
        Feedback
      </button>

      <FeedbackModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
}

export default FeedbackButton;
