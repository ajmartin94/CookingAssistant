import type { MealType } from '../../types/mealPlan';

interface MealSlotEntry {
  id: string;
  recipe: {
    id: string;
    title: string;
    cookTimeMinutes?: number;
  } | null;
}

interface MealSlotProps {
  mealType: MealType;
  entry: MealSlotEntry | null;
  onAddClick?: () => void;
  onChangeClick?: () => void;
  onRemoveClick?: () => void;
}

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

export function MealSlot({
  mealType,
  entry,
  onAddClick,
  onChangeClick,
  onRemoveClick,
}: MealSlotProps) {
  const label = MEAL_TYPE_LABELS[mealType];

  if (!entry) {
    return (
      <div
        className="border border-dashed border-border rounded-lg p-3 hover:border-accent hover:bg-hover transition"
        data-testid="meal-slot"
        onClick={onAddClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onAddClick?.();
          }
        }}
        aria-label={`Add ${label}`}
      >
        <span className="text-text-secondary text-sm">{label}</span>
        <span className="text-text-muted text-sm mt-1 block">+ Add</span>
      </div>
    );
  }

  if (!entry.recipe) {
    return (
      <div className="border border-border rounded-lg p-3" data-testid="meal-slot">
        <span className="text-text-secondary text-sm">{label}</span>
        <p className="text-text-muted text-sm mt-1">Recipe removed</p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg p-3 bg-card" data-testid="meal-slot">
      <span className="text-text-secondary text-sm">{label}</span>
      <p className="text-text-primary text-sm font-medium mt-1" data-testid="slot-recipe-name">
        {entry.recipe.title}
      </p>
      {entry.recipe.cookTimeMinutes != null && (
        <p className="text-text-muted text-xs mt-0.5">{entry.recipe.cookTimeMinutes} min</p>
      )}
      <div className="flex gap-2 mt-1">
        <button type="button" className="text-accent text-xs" onClick={onChangeClick}>
          Change
        </button>
        <button type="button" className="text-text-muted text-xs" onClick={onRemoveClick}>
          Remove
        </button>
      </div>
    </div>
  );
}
