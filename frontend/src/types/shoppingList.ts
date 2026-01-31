export interface ShoppingListItem {
  id: string;
  name: string;
  amount: string | null;
  unit: string | null;
  category: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingListItem[];
  createdAt: string;
  updatedAt: string;
}
