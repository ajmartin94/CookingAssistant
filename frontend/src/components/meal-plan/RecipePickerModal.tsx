import { useState, useEffect, useRef, useCallback } from 'react';
import type { MealType } from '../../types/mealPlan';
import { getRecipes } from '../../services/recipeApi';
import { upsertMealPlanEntry } from '../../services/mealPlanApi';

interface RecipePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealType: MealType;
  date: string;
  mealPlanId: string;
  onAssign: () => void;
}

interface RecipeItem {
  id: string;
  title: string;
}

export function RecipePickerModal({
  isOpen,
  onClose,
  mealType,
  date,
  mealPlanId,
  onAssign,
}: RecipePickerModalProps) {
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchData = async () => {
      setSearch('');
      setError(null);
      setFetchError(false);
      try {
        const res = await getRecipes({ page_size: 50 });
        setRecipes(res.data.map((r) => ({ id: r.id, title: r.title })));
      } catch {
        setRecipes([]);
        setFetchError(true);
      }
    };
    fetchData();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [isOpen, recipes]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'Tab') {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const focusable = dialog.querySelectorAll<HTMLElement>(
          'input, button, [tabindex]:not([tabindex="-1"]), a[href]'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first || document.activeElement === dialog) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [onClose]
  );

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const handleSelect = useCallback(
    async (recipeId: string) => {
      setError(null);
      try {
        await upsertMealPlanEntry(mealPlanId, {
          date,
          meal_type: mealType,
          recipe_id: recipeId,
        });
        onAssign();
        onClose();
      } catch {
        setError('Failed to assign recipe.');
      }
    },
    [mealPlanId, date, mealType, onAssign, onClose]
  );

  const handleItemKeyDown = useCallback(
    (e: React.KeyboardEvent, recipeId: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSelect(recipeId);
      }
    },
    [handleSelect]
  );

  if (!isOpen) return null;

  const filtered = search
    ? recipes.filter((r) => r.title.toLowerCase().includes(search.toLowerCase()))
    : recipes;

  const title = `Choose ${mealType}`;

  return (
    <div
      data-testid="modal-overlay"
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        data-testid="recipe-picker-modal"
        className="bg-card border border-border rounded-lg shadow-lg p-6 w-full max-w-md mx-4"
      >
        <h2 className="text-lg font-semibold text-text-primary mb-4">{title}</h2>

        {error && <p className="text-error mb-2">{error}</p>}

        <label htmlFor="recipe-search" className="sr-only">
          Search
        </label>
        <input
          id="recipe-search"
          type="text"
          aria-label="Search"
          placeholder="Search recipes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-md bg-card text-text-primary mb-3 focus:outline-none focus:ring-2 focus:ring-accent-subtle"
        />

        {fetchError && <p className="text-error">Failed to load recipes.</p>}
        {!fetchError && filtered.length === 0 && (
          <p className="text-text-secondary">No recipes found.</p>
        )}

        <ul data-testid="recipe-picker-list" role="listbox">
          {filtered.map((r) => (
            <li
              key={r.id}
              data-testid="recipe-picker-item"
              role="option"
              aria-selected={false}
              tabIndex={0}
              onClick={() => handleSelect(r.id)}
              onKeyDown={(e) => handleItemKeyDown(e, r.id)}
              className="cursor-pointer px-3 py-2 rounded hover:bg-hover text-text-primary"
            >
              {r.title}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
