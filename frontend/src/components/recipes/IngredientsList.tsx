/**
 * IngredientsList Component
 *
 * Displays recipe ingredients with checkboxes, a servings adjuster,
 * and an "Add to Shopping List" button.
 */

import { useState } from 'react';
import { Minus, Plus, ShoppingCart } from '../common/icons';
import type { Ingredient } from '../../types';

interface IngredientsListProps {
  ingredients: Ingredient[];
  baseServings: number;
}

export default function IngredientsList({ ingredients, baseServings }: IngredientsListProps) {
  const [servings, setServings] = useState(baseServings);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  const scale = servings / baseServings;

  const handleToggle = (index: number) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const scaleAmount = (amount: string): string => {
    const num = parseFloat(amount);
    if (isNaN(num)) return amount;
    const scaled = num * scale;
    // Show nice fractions
    return scaled % 1 === 0 ? String(scaled) : scaled.toFixed(1);
  };

  return (
    <div className="bg-card rounded-lg shadow-soft p-6 sticky top-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-text-primary">Ingredients</h2>
        <div className="flex items-center gap-2 bg-hover rounded-lg p-1">
          <button
            aria-label="Decrease servings"
            onClick={() => setServings((s) => Math.max(1, s - 1))}
            className="w-7 h-7 flex items-center justify-center bg-card text-text-primary rounded-md hover:bg-secondary transition"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span
            data-testid="servings-adjuster-value"
            className="text-sm min-w-[20px] text-center text-text-primary"
          >
            {servings}
          </span>
          <button
            aria-label="Increase servings"
            onClick={() => setServings((s) => s + 1)}
            className="w-7 h-7 flex items-center justify-center bg-card text-text-primary rounded-md hover:bg-secondary transition"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <ul className="space-y-0" data-testid="ingredients-list">
        {ingredients.map((ingredient, index) => {
          const checked = checkedItems.has(index);
          return (
            <li
              key={index}
              data-testid="ingredient"
              className={`flex items-start gap-3 py-2.5 border-b border-default last:border-b-0 ${checked ? 'line-through opacity-50' : ''}`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => handleToggle(index)}
                className="mt-1 w-4 h-4 rounded accent-accent cursor-pointer flex-shrink-0"
              />
              <span className="text-text-secondary">
                <span className="text-accent font-medium">
                  {scaleAmount(ingredient.amount)} {ingredient.unit}
                </span>{' '}
                {ingredient.name}
                {ingredient.notes && (
                  <span className="text-text-muted text-sm"> ({ingredient.notes})</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>

      <button
        aria-label="Add to Shopping List"
        className="w-full mt-4 py-3 flex items-center justify-center gap-2 bg-hover border border-default text-text-primary rounded-lg text-sm font-medium hover:bg-secondary transition"
      >
        <ShoppingCart className="w-4 h-4" />
        Add to Shopping List
      </button>
    </div>
  );
}
