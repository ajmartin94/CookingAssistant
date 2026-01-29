import { MealSlot } from './MealSlot';
import type { MealType } from '../../types/mealPlan';

interface DayColumnEntry {
  id: string;
  meal_type: MealType;
  recipe: { id: string; title: string; cook_time_minutes: number } | null;
}

interface DayColumnProps {
  dayName: string;
  date: string;
  entries: DayColumnEntry[];
  isToday: boolean;
  onSlotClick?: (mealType: MealType) => void;
  onRemoveClick?: (entryId: string, mealType: MealType) => void;
}

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];

export function DayColumn({
  dayName,
  entries,
  isToday,
  onSlotClick,
  onRemoveClick,
}: DayColumnProps) {
  const findEntry = (mealType: MealType) => {
    const e = entries.find((entry) => entry.meal_type === mealType);
    if (!e) return null;
    return {
      id: e.id,
      recipe: e.recipe
        ? { id: e.recipe.id, title: e.recipe.title, cookTimeMinutes: e.recipe.cook_time_minutes }
        : null,
    };
  };

  return (
    <div
      className={`flex flex-col gap-2 ${isToday ? 'border-accent border-2 rounded-lg p-2' : 'p-2'}`}
      data-testid="day-column"
    >
      <h3 className="text-text-primary font-semibold text-center">
        {dayName}
        {isToday && (
          <span data-testid="day-column-today" className="ml-1 text-accent text-xs">
            (Today)
          </span>
        )}
      </h3>
      {MEAL_TYPES.map((mt) => {
        const entry = findEntry(mt);
        return (
          <MealSlot
            key={mt}
            mealType={mt}
            entry={entry}
            onAddClick={() => onSlotClick?.(mt)}
            onChangeClick={() => onSlotClick?.(mt)}
            onRemoveClick={() => {
              if (entry) onRemoveClick?.(entry.id, mt);
            }}
          />
        );
      })}
    </div>
  );
}
