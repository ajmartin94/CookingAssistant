import { useState } from 'react';
import { StarRating } from './StarRating';

interface CookingCompletionScreenProps {
  recipeTitle: string;
  onDone: () => void;
}

export function CookingCompletionScreen({ recipeTitle, onDone }: CookingCompletionScreenProps) {
  const [rating, setRating] = useState(0);

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      <h2 className="text-3xl font-bold text-text-primary">Nice work!</h2>
      <p className="text-text-secondary">{recipeTitle}</p>
      <StarRating value={rating} onChange={setRating} />
      <label className="flex flex-col gap-2 w-full max-w-md">
        <span className="text-text-secondary">Notes</span>
        <textarea
          aria-label="Notes"
          className="bg-card border border-border rounded-lg p-3 text-text-primary"
        />
      </label>
      <button
        onClick={onDone}
        className="px-6 py-3 bg-accent text-text-on-accent rounded-lg font-medium"
      >
        Done
      </button>
    </div>
  );
}
