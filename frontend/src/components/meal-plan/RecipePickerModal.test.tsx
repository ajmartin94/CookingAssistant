import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { RecipePickerModal } from './RecipePickerModal';
import { server } from '../../test/mocks/server';
import { http, HttpResponse } from 'msw';

const BASE_URL = 'http://localhost:8000';

const mockRecipeList = [
  {
    id: 'r1',
    title: 'Scrambled Eggs',
    description: 'Simple eggs',
    ingredients: [],
    instructions: [],
    prep_time_minutes: 5,
    cook_time_minutes: 10,
    total_time_minutes: 15,
    servings: 2,
    cuisine_type: 'American',
    dietary_tags: [],
    difficulty_level: 'easy',
    owner_id: 'u1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'r2',
    title: 'Grilled Chicken',
    description: 'Juicy chicken',
    ingredients: [],
    instructions: [],
    prep_time_minutes: 10,
    cook_time_minutes: 25,
    total_time_minutes: 35,
    servings: 4,
    cuisine_type: 'American',
    dietary_tags: ['high-protein'],
    difficulty_level: 'medium',
    owner_id: 'u1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'r3',
    title: 'Pasta Carbonara',
    description: 'Classic Italian',
    ingredients: [],
    instructions: [],
    prep_time_minutes: 10,
    cook_time_minutes: 20,
    total_time_minutes: 30,
    servings: 4,
    cuisine_type: 'Italian',
    dietary_tags: [],
    difficulty_level: 'medium',
    owner_id: 'u1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

describe('RecipePickerModal', () => {
  beforeAll(() => {
    server.listen();
    localStorage.setItem('auth_token', 'test-token');
  });
  afterEach(() => {
    server.resetHandlers();
  });
  afterAll(() => {
    server.close();
    localStorage.clear();
  });

  const defaultProps = {
    isOpen: true,
    onClose: () => {},
    mealType: 'breakfast' as const,
    date: '2026-01-26',
    mealPlanId: 'plan-1',
    onAssign: () => {},
  };

  function setupRecipeHandler() {
    server.use(
      http.get(`${BASE_URL}/api/v1/recipes`, () => {
        return HttpResponse.json({
          recipes: mockRecipeList,
          total: 3,
          page: 1,
          page_size: 50,
          total_pages: 1,
        });
      })
    );
  }

  describe('Opening and Title', () => {
    it('should display modal with correct meal type title for empty slot', async () => {
      setupRecipeHandler();
      render(<RecipePickerModal {...defaultProps} mealType="breakfast" />);

      expect(screen.getByRole('dialog', { name: /breakfast/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /choose.*breakfast/i })).toBeInTheDocument();
    });

    it('should display modal with correct title for lunch slot', async () => {
      setupRecipeHandler();
      render(<RecipePickerModal {...defaultProps} mealType="lunch" />);

      expect(screen.getByRole('heading', { name: /choose.*lunch/i })).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<RecipePickerModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Recipe List', () => {
    it('should render recipe list from API data', async () => {
      setupRecipeHandler();
      render(<RecipePickerModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Scrambled Eggs')).toBeInTheDocument();
        expect(screen.getByText('Grilled Chicken')).toBeInTheDocument();
        expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
      });
    });

    it('should show empty state when no recipes exist', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, () => {
          return HttpResponse.json({
            recipes: [],
            total: 0,
            page: 1,
            page_size: 50,
            total_pages: 0,
          });
        })
      );

      render(<RecipePickerModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/no recipes/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search', () => {
    it('should filter displayed recipes when user types in search input', async () => {
      setupRecipeHandler();
      const user = userEvent.setup();

      render(<RecipePickerModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Scrambled Eggs')).toBeInTheDocument();
      });

      const searchInput = screen.getByRole('textbox', { name: /search/i });
      await user.type(searchInput, 'chicken');

      await waitFor(() => {
        expect(screen.getByText('Grilled Chicken')).toBeInTheDocument();
        expect(screen.queryByText('Scrambled Eggs')).not.toBeInTheDocument();
        expect(screen.queryByText('Pasta Carbonara')).not.toBeInTheDocument();
      });
    });
  });

  describe('Assign Recipe', () => {
    it('should call PUT and update slot when recipe is selected', async () => {
      setupRecipeHandler();

      let assignedRecipeId: string | null = null;
      server.use(
        http.put(`${BASE_URL}/api/v1/meal-plans/:planId/entries`, async ({ request }) => {
          const body = (await request.json()) as { recipe_id: string };
          assignedRecipeId = body.recipe_id;
          return HttpResponse.json({
            id: 'entry-new',
            day_of_week: 0,
            meal_type: 'breakfast',
            recipe: { id: body.recipe_id, title: 'Grilled Chicken', cook_time_minutes: 25 },
          });
        })
      );

      const onAssign = () => {};
      const user = userEvent.setup();

      render(<RecipePickerModal {...defaultProps} onAssign={onAssign} />);

      await waitFor(() => {
        expect(screen.getByText('Grilled Chicken')).toBeInTheDocument();
      });

      // Click a recipe to select it
      await user.click(screen.getByText('Grilled Chicken'));

      await waitFor(() => {
        expect(assignedRecipeId).toBe('r2');
      });
    });

    it('should close modal after successful assignment', async () => {
      setupRecipeHandler();

      server.use(
        http.put(`${BASE_URL}/api/v1/meal-plans/:planId/entries`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({
            id: 'entry-new',
            day_of_week: 0,
            meal_type: 'breakfast',
            recipe: { id: body.recipe_id, title: 'Grilled Chicken', cook_time_minutes: 25 },
          });
        })
      );

      let closed = false;
      const user = userEvent.setup();

      render(
        <RecipePickerModal
          {...defaultProps}
          onClose={() => {
            closed = true;
          }}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Grilled Chicken')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Grilled Chicken'));

      await waitFor(() => {
        expect(closed).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on mutation failure', async () => {
      setupRecipeHandler();

      server.use(
        http.put(`${BASE_URL}/api/v1/meal-plans/:planId/entries`, () => {
          return HttpResponse.json({ detail: 'Internal server error' }, { status: 500 });
        })
      );

      const user = userEvent.setup();

      render(<RecipePickerModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Grilled Chicken')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Grilled Chicken'));

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Closing Behavior', () => {
    it('should close when Escape key is pressed', async () => {
      setupRecipeHandler();

      let closed = false;
      const user = userEvent.setup();

      render(
        <RecipePickerModal
          {...defaultProps}
          onClose={() => {
            closed = true;
          }}
        />
      );

      await user.keyboard('{Escape}');

      expect(closed).toBe(true);
    });

    it('should close when overlay is clicked', async () => {
      setupRecipeHandler();

      let closed = false;
      const user = userEvent.setup();

      render(
        <RecipePickerModal
          {...defaultProps}
          onClose={() => {
            closed = true;
          }}
        />
      );

      // Click the overlay (the backdrop behind the modal)
      const dialog = screen.getByRole('dialog');
      // Click outside the modal content - the overlay
      await user.click(dialog.parentElement!);

      expect(closed).toBe(true);
    });
  });

  describe('Focus Management', () => {
    it('should move focus into the modal when opened', async () => {
      setupRecipeHandler();

      render(<RecipePickerModal {...defaultProps} />);

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog.contains(document.activeElement)).toBe(true);
      });
    });
  });
});
