/**
 * StartCookingBar Component
 *
 * Fixed bottom bar with a "Start Cooking" CTA button.
 */

import { Play } from '../common/icons';

export default function StartCookingBar() {
  return (
    <div
      data-testid="start-cooking-bar"
      className="fixed bottom-0 left-0 right-0 bg-secondary border-t border-default px-6 py-4 flex items-center justify-between z-50"
    >
      <div className="text-sm text-text-secondary">
        <strong className="text-text-primary">Ready to cook?</strong> Guided mode will walk you
        through each step.
      </div>
      <button
        aria-label="Start Cooking"
        className="px-6 py-3 bg-accent text-text-on-accent rounded-lg font-medium flex items-center gap-2 hover:bg-accent-hover transition"
      >
        <Play className="w-4 h-4" />
        Start Cooking
      </button>
    </div>
  );
}
