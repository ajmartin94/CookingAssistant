import apiClient from './api';
import type { ShoppingList, ShoppingListItem } from '../types/shoppingList';

interface BackendShoppingListItem {
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

interface BackendShoppingList {
  id: string;
  user_id: string;
  name: string;
  week_start_date: string | null;
  items: BackendShoppingListItem[];
  created_at: string;
  updated_at: string;
}

function transformItem(item: BackendShoppingListItem): ShoppingListItem {
  return {
    id: item.id,
    name: item.name,
    amount: item.amount,
    unit: item.unit,
    category: item.category,
    sortOrder: item.sort_order,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

function transformList(list: BackendShoppingList): ShoppingList {
  return {
    id: list.id,
    name: list.name,
    items: list.items.map(transformItem),
    createdAt: list.created_at,
    updatedAt: list.updated_at,
  };
}

export async function fetchShoppingLists(): Promise<ShoppingList[]> {
  const response = await apiClient.get<BackendShoppingList[]>('/api/v1/shopping-lists');
  return response.data.map(transformList);
}

export async function fetchShoppingList(id: string): Promise<ShoppingList> {
  const response = await apiClient.get<BackendShoppingList>(`/api/v1/shopping-lists/${id}`);
  return transformList(response.data);
}

export async function createShoppingList(name: string): Promise<ShoppingList> {
  const response = await apiClient.post<BackendShoppingList>('/api/v1/shopping-lists', { name });
  return transformList(response.data);
}

export async function deleteShoppingList(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/shopping-lists/${id}`);
}

export async function addShoppingListItem(
  listId: string,
  item: { name: string; amount?: string; unit?: string; category?: string }
): Promise<ShoppingList> {
  const response = await apiClient.post<BackendShoppingList>(
    `/api/v1/shopping-lists/${listId}/items`,
    item
  );
  return transformList(response.data);
}

export async function deleteShoppingListItem(listId: string, itemId: string): Promise<void> {
  await apiClient.delete(`/api/v1/shopping-lists/${listId}/items/${itemId}`);
}

export async function generateShoppingList(
  weekStartDate: string,
  name?: string
): Promise<ShoppingList> {
  const response = await apiClient.post<BackendShoppingList>(
    '/api/v1/shopping-lists/generate',
    { week_start_date: weekStartDate, ...(name ? { name } : {}) },
    { timeout: 60000 }
  );
  return transformList(response.data);
}
