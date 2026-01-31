// Mock data factories for shopping list API responses (snake_case, matching backend)

export interface BackendShoppingListItem {
  id: string;
  list_id: string;
  name: string;
  amount: string | null;
  unit: string | null;
  category: string | null;
  source_recipe_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BackendShoppingList {
  id: string;
  user_id: string;
  name: string;
  week_start_date: string | null;
  items: BackendShoppingListItem[];
  created_at: string;
  updated_at: string;
}

export const mockBackendShoppingListItem = (
  overrides?: Partial<BackendShoppingListItem>
): BackendShoppingListItem => ({
  id: 'item-1',
  list_id: 'list-1',
  name: 'Milk',
  amount: '1',
  unit: 'gallon',
  category: 'Dairy',
  source_recipe_id: null,
  sort_order: 0,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

export const mockBackendShoppingList = (
  overrides?: Partial<BackendShoppingList>
): BackendShoppingList => ({
  id: 'list-1',
  user_id: 'user-1',
  name: 'Weekly Groceries',
  week_start_date: null,
  items: [],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
});
