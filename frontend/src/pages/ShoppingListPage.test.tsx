import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '../test/test-utils';
import userEvent from '@testing-library/user-event';
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';
import {
  mockBackendShoppingList,
  mockBackendShoppingListItem,
} from '../test/mocks/shoppingListData';
import { mockMealPlanWeek } from '../test/mocks/mealPlanData';
import ShoppingListPage from './ShoppingListPage';

const BASE_URL = 'http://localhost:8000';

describe('ShoppingListPage', () => {
  beforeEach(() => {
    localStorage.setItem('auth_token', 'test-token');
  });

  describe('Empty State', () => {
    it('should render empty state when no lists exist', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/shopping-lists`, () => {
          return HttpResponse.json([]);
        })
      );

      render(<ShoppingListPage />);

      await waitFor(() => {
        expect(screen.getByText(/no shopping lists/i)).toBeInTheDocument();
      });
    });
  });

  describe('List of Shopping Lists', () => {
    it('should render list of shopping lists', async () => {
      render(<ShoppingListPage />);

      await waitFor(() => {
        expect(screen.getByText('Weekly Groceries')).toBeInTheDocument();
        expect(screen.getByText('Party Supplies')).toBeInTheDocument();
      });
    });
  });

  describe('Create List', () => {
    it('should create a new list via form and show it', async () => {
      const user = userEvent.setup();

      render(<ShoppingListPage />);

      await waitFor(() => {
        expect(screen.getByText('Weekly Groceries')).toBeInTheDocument();
      });

      // Fill in the create list form
      const nameInput = screen.getByLabelText(/list name/i);
      await user.type(nameInput, 'Birthday Party');
      await user.click(screen.getByRole('button', { name: /create list/i }));

      // New list should appear
      await waitFor(() => {
        expect(screen.getByText('Birthday Party')).toBeInTheDocument();
      });
    });
  });

  describe('Shopping List Detail - Items Grouped by Category', () => {
    it('should show items grouped by category when viewing a list', async () => {
      const user = userEvent.setup();

      render(<ShoppingListPage />);

      // Wait for lists to load, then click into one
      await waitFor(() => {
        expect(screen.getByText('Weekly Groceries')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Weekly Groceries'));

      // Should show category headings and items
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /dairy/i })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /bakery/i })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /produce/i })).toBeInTheDocument();
      });

      // Items should be visible under their categories
      expect(screen.getByText('Milk')).toBeInTheDocument();
      expect(screen.getByText('Cheese')).toBeInTheDocument();
      expect(screen.getByText('Bread')).toBeInTheDocument();
      expect(screen.getByText('Apples')).toBeInTheDocument();
    });
  });

  describe('Add Item', () => {
    it('should add an item via form and show it in the list', async () => {
      const user = userEvent.setup();

      render(<ShoppingListPage />);

      // Navigate to a list
      await waitFor(() => {
        expect(screen.getByText('Weekly Groceries')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Weekly Groceries'));

      await waitFor(() => {
        expect(screen.getByText('Milk')).toBeInTheDocument();
      });

      // Fill in the add item form
      await user.type(screen.getByLabelText(/item name/i), 'Eggs');
      await user.type(screen.getByLabelText(/amount/i), '12');
      await user.type(screen.getByLabelText(/unit/i), 'pieces');
      await user.type(screen.getByLabelText(/category/i), 'Dairy');
      await user.click(screen.getByRole('button', { name: /add item/i }));

      // New item should appear
      await waitFor(() => {
        expect(screen.getByText('Eggs')).toBeInTheDocument();
      });
    });
  });

  describe('Delete Item', () => {
    it('should remove an item when delete button is clicked', async () => {
      const user = userEvent.setup();

      render(<ShoppingListPage />);

      // Navigate to a list
      await waitFor(() => {
        expect(screen.getByText('Weekly Groceries')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Weekly Groceries'));

      await waitFor(() => {
        expect(screen.getByText('Milk')).toBeInTheDocument();
      });

      // Find the delete button for the Milk item
      const milkItem = screen
        .getByText('Milk')
        .closest('[data-testid="shopping-item"]')! as HTMLElement;
      const deleteBtn = within(milkItem).getByRole('button', { name: /delete/i });
      await user.click(deleteBtn);

      await waitFor(() => {
        expect(screen.queryByText('Milk')).not.toBeInTheDocument();
      });
    });
  });

  describe('Generate from Meal Plan', () => {
    it('should show a "Generate from Meal Plan" button', async () => {
      render(<ShoppingListPage />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /generate from meal plan/i })
        ).toBeInTheDocument();
      });
    });

    it('should show a week picker after clicking generate button', async () => {
      const user = userEvent.setup();

      render(<ShoppingListPage />);

      await waitFor(() => {
        expect(screen.getByText('Weekly Groceries')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /generate from meal plan/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /previous week/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /next week/i })).toBeInTheDocument();
      });
    });

    it('should generate a shopping list when a week is confirmed', async () => {
      const user = userEvent.setup();

      render(<ShoppingListPage />);

      await waitFor(() => {
        expect(screen.getByText('Weekly Groceries')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /generate from meal plan/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^generate$/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /^generate$/i }));

      await waitFor(() => {
        expect(screen.getByText('Chicken Breast')).toBeInTheDocument();
        expect(screen.getByText('Olive Oil')).toBeInTheDocument();
        expect(screen.getByText('Eggs')).toBeInTheDocument();
      });
    });

    it('should show loading state during generation', async () => {
      const user = userEvent.setup();

      server.use(
        http.post(`${BASE_URL}/api/v1/shopping-lists/generate`, async () => {
          await new Promise((resolve) => setTimeout(resolve, 200));
          return HttpResponse.json(
            mockBackendShoppingList({
              id: 'list-generated',
              name: 'Shopping List - Week of 2026-01-26',
              items: [
                mockBackendShoppingListItem({
                  id: 'gen-1',
                  name: 'Chicken Breast',
                  category: 'Meat',
                }),
              ],
            }),
            { status: 201 }
          );
        })
      );

      render(<ShoppingListPage />);

      await waitFor(() => {
        expect(screen.getByText('Weekly Groceries')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /generate from meal plan/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^generate$/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /^generate$/i }));

      expect(screen.getByText(/generating/i)).toBeInTheDocument();
    });

    it('should show confirmation dialog when list already exists for selected week', async () => {
      const user = userEvent.setup();

      server.use(
        http.get(`${BASE_URL}/api/v1/shopping-lists`, () => {
          return HttpResponse.json([
            mockBackendShoppingList({
              id: 'list-existing',
              name: 'Shopping List - Week of 2026-01-26',
            }),
          ]);
        })
      );

      render(<ShoppingListPage />);

      await waitFor(() => {
        expect(screen.getByText('Shopping List - Week of 2026-01-26')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /generate from meal plan/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^generate$/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /^generate$/i }));

      await waitFor(() => {
        expect(screen.getByText(/already exists/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /replace/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create new/i })).toBeInTheDocument();
      });
    });

    it('should replace existing list when user confirms replace', async () => {
      const user = userEvent.setup();

      server.use(
        http.get(`${BASE_URL}/api/v1/shopping-lists`, () => {
          return HttpResponse.json([
            mockBackendShoppingList({
              id: 'list-existing',
              name: 'Shopping List - Week of 2026-01-26',
            }),
          ]);
        })
      );

      render(<ShoppingListPage />);

      await waitFor(() => {
        expect(screen.getByText('Shopping List - Week of 2026-01-26')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /generate from meal plan/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^generate$/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /^generate$/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /replace/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /replace/i }));

      await waitFor(() => {
        expect(screen.getByText('Chicken Breast')).toBeInTheDocument();
      });
    });

    it('should show helpful message when meal plan has no recipes', async () => {
      const user = userEvent.setup();

      server.use(
        http.get(`${BASE_URL}/api/v1/meal-plans`, () => {
          return HttpResponse.json(mockMealPlanWeek({ entries: [] }));
        }),
        http.post(`${BASE_URL}/api/v1/shopping-lists/generate`, () => {
          return HttpResponse.json(
            { detail: 'No recipes found in meal plan for this week' },
            { status: 400 }
          );
        })
      );

      render(<ShoppingListPage />);

      await waitFor(() => {
        expect(screen.getByText('Weekly Groceries')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /generate from meal plan/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^generate$/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /^generate$/i }));

      await waitFor(() => {
        expect(screen.getByText(/no recipes/i)).toBeInTheDocument();
      });
    });
  });

  describe('Delete List', () => {
    it('should remove a list when delete button is clicked', async () => {
      const user = userEvent.setup();

      render(<ShoppingListPage />);

      await waitFor(() => {
        expect(screen.getByText('Weekly Groceries')).toBeInTheDocument();
      });

      // Find the delete button for the Weekly Groceries list
      const listItem = screen
        .getByText('Weekly Groceries')
        .closest('[data-testid="shopping-list-card"]')! as HTMLElement;
      const deleteBtn = within(listItem).getByRole('button', { name: /delete/i });
      await user.click(deleteBtn);

      await waitFor(() => {
        expect(screen.queryByText('Weekly Groceries')).not.toBeInTheDocument();
      });
    });
  });

  describe('Check Off Items While Shopping', () => {
    const navigateToListDetail = async (user: ReturnType<typeof userEvent.setup>) => {
      render(<ShoppingListPage />);

      await waitFor(() => {
        expect(screen.getByText('Weekly Groceries')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Weekly Groceries'));

      await waitFor(() => {
        expect(screen.getByText('Milk')).toBeInTheDocument();
      });
    };

    afterEach(() => {
      localStorage.removeItem('shopping-checked-list-1');
    });

    it('should toggle checked state when clicking an item checkbox', async () => {
      const user = userEvent.setup();
      await navigateToListDetail(user);

      // Find the checkbox for Milk
      const milkItem = screen
        .getByText('Milk')
        .closest('[data-testid="shopping-item"]')! as HTMLElement;
      const checkbox = within(milkItem).getByRole('checkbox');

      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);

      expect(checkbox).toBeChecked();

      // Clicking again should uncheck
      await user.click(checkbox);

      expect(checkbox).not.toBeChecked();
    });

    it('should render checked items with strikethrough styling', async () => {
      const user = userEvent.setup();
      await navigateToListDetail(user);

      const milkItem = screen
        .getByText('Milk')
        .closest('[data-testid="shopping-item"]')! as HTMLElement;
      const checkbox = within(milkItem).getByRole('checkbox');

      await user.click(checkbox);

      // Checked items should have line-through class
      expect(milkItem.className).toMatch(/line-through/);
    });

    it('should sort checked items to the bottom of their category', async () => {
      const user = userEvent.setup();
      await navigateToListDetail(user);

      // Check off Milk (first Dairy item)
      const milkItem = screen
        .getByText('Milk')
        .closest('[data-testid="shopping-item"]')! as HTMLElement;
      const milkCheckbox = within(milkItem).getByRole('checkbox');
      await user.click(milkCheckbox);

      // Within the Dairy category, Cheese should now appear before Milk
      const dairyHeading = screen.getByRole('heading', { name: /dairy/i });
      const dairySection = dairyHeading.closest('[data-testid="category-section"]')! as HTMLElement;
      const itemsInDairy = within(dairySection).getAllByTestId('shopping-item');

      // Cheese (unchecked) should be first, Milk (checked) should be last
      expect(within(itemsInDairy[0]).getByText('Cheese')).toBeInTheDocument();
      expect(within(itemsInDairy[1]).getByText('Milk')).toBeInTheDocument();
    });

    it('should show progress summary with correct count', async () => {
      const user = userEvent.setup();
      await navigateToListDetail(user);

      // Initially no items checked: 0/4
      expect(screen.getByText('0/4 items checked')).toBeInTheDocument();

      // Check off Milk
      const milkItem = screen
        .getByText('Milk')
        .closest('[data-testid="shopping-item"]')! as HTMLElement;
      await user.click(within(milkItem).getByRole('checkbox'));

      expect(screen.getByText('1/4 items checked')).toBeInTheDocument();

      // Check off Bread
      const breadItem = screen
        .getByText('Bread')
        .closest('[data-testid="shopping-item"]')! as HTMLElement;
      await user.click(within(breadItem).getByRole('checkbox'));

      expect(screen.getByText('2/4 items checked')).toBeInTheDocument();
    });

    it('should persist checked state in localStorage and restore on mount', async () => {
      // Pre-seed localStorage with checked state
      localStorage.setItem('shopping-checked-list-1', JSON.stringify(['item-1', 'item-3']));

      const user = userEvent.setup();
      await navigateToListDetail(user);

      // Milk (item-1) and Bread (item-3) should be checked on load
      const milkItem = screen
        .getByText('Milk')
        .closest('[data-testid="shopping-item"]')! as HTMLElement;
      expect(within(milkItem).getByRole('checkbox')).toBeChecked();

      const breadItem = screen
        .getByText('Bread')
        .closest('[data-testid="shopping-item"]')! as HTMLElement;
      expect(within(breadItem).getByRole('checkbox')).toBeChecked();

      // Cheese and Apples should not be checked
      const cheeseItem = screen
        .getByText('Cheese')
        .closest('[data-testid="shopping-item"]')! as HTMLElement;
      expect(within(cheeseItem).getByRole('checkbox')).not.toBeChecked();

      // Progress should reflect restored state
      expect(screen.getByText('2/4 items checked')).toBeInTheDocument();
    });

    it('should write checked state to localStorage when items are toggled', async () => {
      const user = userEvent.setup();
      await navigateToListDetail(user);

      const milkItem = screen
        .getByText('Milk')
        .closest('[data-testid="shopping-item"]')! as HTMLElement;
      await user.click(within(milkItem).getByRole('checkbox'));

      const stored = JSON.parse(localStorage.getItem('shopping-checked-list-1') || '[]');
      expect(stored).toContain('item-1');
    });

    it('should clear localStorage checked state when a list is deleted', async () => {
      // Pre-seed localStorage
      localStorage.setItem('shopping-checked-list-1', JSON.stringify(['item-1']));

      const user = userEvent.setup();

      render(<ShoppingListPage />);

      await waitFor(() => {
        expect(screen.getByText('Weekly Groceries')).toBeInTheDocument();
      });

      // Delete the list
      const listCard = screen
        .getByText('Weekly Groceries')
        .closest('[data-testid="shopping-list-card"]')! as HTMLElement;
      const deleteBtn = within(listCard).getByRole('button', { name: /delete/i });
      await user.click(deleteBtn);

      await waitFor(() => {
        expect(screen.queryByText('Weekly Groceries')).not.toBeInTheDocument();
      });

      // localStorage should be cleaned up
      expect(localStorage.getItem('shopping-checked-list-1')).toBeNull();
    });
  });
});
