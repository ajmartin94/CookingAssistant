/**
 * ChangeSummary Component
 *
 * Displays a proposed recipe change with Apply/Reject actions
 */

import type { RecipeFormData } from '../../types';

interface ChangeSummaryProps {
  proposedRecipe: RecipeFormData;
  onApply: () => void;
  onReject: () => void;
}

export function ChangeSummary({ proposedRecipe, onApply, onReject }: ChangeSummaryProps) {
  return (
    <div className="bg-accent-subtle border border-border rounded-lg p-3 mt-2">
      <p className="text-sm font-medium text-text-primary mb-2">Proposed: {proposedRecipe.title}</p>
      <div className="flex gap-2">
        <button
          onClick={onApply}
          className="px-3 py-1 text-sm bg-accent text-text-on-accent rounded hover:bg-accent-hover transition btn-animated"
          aria-label="Apply"
        >
          Apply
        </button>
        <button
          onClick={onReject}
          className="px-3 py-1 text-sm bg-secondary text-text-secondary rounded hover:bg-hover transition btn-animated"
          aria-label="Reject"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
