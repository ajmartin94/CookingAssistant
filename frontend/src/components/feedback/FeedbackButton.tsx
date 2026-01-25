/**
 * FeedbackButton Component
 *
 * Floating button in the bottom-right corner that opens the feedback modal.
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
        aria-label="Send Feedback"
        className="fixed bottom-4 right-4 px-4 py-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        Feedback
      </button>

      <FeedbackModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
}

export default FeedbackButton;
