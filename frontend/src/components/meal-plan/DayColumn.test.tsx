import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { DayColumn } from './DayColumn';
import { mockMealPlanEntry } from '../../test/mocks/mealPlanData';

describe('DayColumn', () => {
  it('should render the day name as a header', () => {
    render(<DayColumn dayName="Monday" date="2026-01-26" entries={[]} isToday={false} />);

    expect(screen.getByRole('heading', { name: 'Monday' })).toBeInTheDocument();
  });

  it('should render 3 meal slots (Breakfast, Lunch, Dinner)', () => {
    render(<DayColumn dayName="Tuesday" date="2026-01-27" entries={[]} isToday={false} />);

    expect(screen.getByText('Breakfast')).toBeInTheDocument();
    expect(screen.getByText('Lunch')).toBeInTheDocument();
    expect(screen.getByText('Dinner')).toBeInTheDocument();
  });

  it('should apply accent styling when isToday is true', () => {
    const { container } = render(
      <DayColumn dayName="Wednesday" date="2026-01-28" entries={[]} isToday={true} />
    );

    const column = container.firstElementChild;
    expect(column?.className).toMatch(/accent|today|highlight/);
  });

  it('should pass entries to the correct meal slots', () => {
    const entries = [
      mockMealPlanEntry({
        meal_type: 'breakfast',
        recipe: { id: 'r1', title: 'Pancakes', cook_time_minutes: 15 },
      }),
      mockMealPlanEntry({
        meal_type: 'dinner',
        recipe: { id: 'r2', title: 'Pasta', cook_time_minutes: 25 },
      }),
    ];

    render(<DayColumn dayName="Thursday" date="2026-01-29" entries={entries} isToday={false} />);

    expect(screen.getByText('Pancakes')).toBeInTheDocument();
    expect(screen.getByText('Pasta')).toBeInTheDocument();
    // Lunch should be empty
    expect(screen.getByText(/\+ Add/)).toBeInTheDocument();
  });
});
