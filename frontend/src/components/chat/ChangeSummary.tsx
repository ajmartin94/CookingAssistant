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
    <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mt-2">
      <p className="text-sm font-medium text-primary-800 mb-2">Proposed: {proposedRecipe.title}</p>
      <div className="flex gap-2">
        <button
          onClick={onApply}
          className="px-3 py-1 text-sm bg-primary-500 text-white rounded hover:bg-primary-600 transition"
          aria-label="Apply"
        >
          Apply
        </button>
        <button
          onClick={onReject}
          className="px-3 py-1 text-sm bg-neutral-200 text-neutral-700 rounded hover:bg-neutral-300 transition"
          aria-label="Reject"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
