/**
 * RecipeNotes Component
 *
 * Displays existing recipe notes and an "Add a note" button with dashed border.
 */

import { Plus } from '../common/icons';

interface RecipeNotesProps {
  notes?: string;
}

export default function RecipeNotes({ notes }: RecipeNotesProps) {
  return (
    <div className="mt-6">
      {notes && (
        <div
          data-testid="recipe-notes"
          className="bg-accent-subtle border border-accent rounded-lg p-6 mb-3"
        >
          <h2 className="text-lg font-semibold text-accent mb-2">Notes</h2>
          <p className="text-text-secondary">{notes}</p>
        </div>
      )}

      <button
        aria-label="Add a note"
        className="w-full py-3 flex items-center justify-center gap-2 bg-transparent border border-dashed border-default text-text-muted rounded-lg text-sm hover:border-text-muted hover:text-text-secondary transition"
      >
        <Plus className="w-4 h-4" />
        Add a note
      </button>
    </div>
  );
}
