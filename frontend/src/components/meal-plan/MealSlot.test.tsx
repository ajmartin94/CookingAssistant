import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { MealSlot } from './MealSlot';

describe('MealSlot', () => {
  it('should render empty state with "+ Add" and meal type label', () => {
    render(<MealSlot mealType="breakfast" entry={null} />);

    expect(screen.getByText('Breakfast')).toBeInTheDocument();
    expect(screen.getByText(/\+ Add/)).toBeInTheDocument();
  });

  it('should render recipe name and cook time for filled entry', () => {
    render(
      <MealSlot
        mealType="lunch"
        entry={{
          id: 'e1',
          recipe: { id: 'r1', title: 'Caesar Salad', cookTimeMinutes: 15 },
        }}
      />
    );

    expect(screen.getByText('Lunch')).toBeInTheDocument();
    expect(screen.getByText('Caesar Salad')).toBeInTheDocument();
    expect(screen.getByText(/15 min/)).toBeInTheDocument();
  });

  it('should render "Recipe removed" when entry has null recipe', () => {
    render(
      <MealSlot
        mealType="dinner"
        entry={{
          id: 'e2',
          recipe: null,
        }}
      />
    );

    expect(screen.getByText('Dinner')).toBeInTheDocument();
    expect(screen.getByText('Recipe removed')).toBeInTheDocument();
  });
});
