import { useState, useEffect, useCallback } from 'react';
import type { AxiosError } from 'axios';
import type { ShoppingList, ShoppingListItem } from '../types/shoppingList';
import {
  fetchShoppingLists,
  fetchShoppingList,
  createShoppingList,
  deleteShoppingList,
  addShoppingListItem,
  deleteShoppingListItem,
  generateShoppingList,
} from '../services/shoppingListApi';
import { useCheckedItems } from '../hooks/useCheckedItems';
import { WeekNavigation } from '../components/meal-plan/WeekNavigation';
import { getCurrentWeekMonday } from '../utils/dateUtils';

function formatWeekStartParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function ShoppingListPage() {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState(true);
  const [newListName, setNewListName] = useState('');

  // Add item form state
  const [itemName, setItemName] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [itemUnit, setItemUnit] = useState('');
  const [itemCategory, setItemCategory] = useState('');

  // Generate from meal plan state
  const [showGeneratePanel, setShowGeneratePanel] = useState(false);
  const [generateWeekStart, setGenerateWeekStart] = useState<Date>(getCurrentWeekMonday);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ weekDate: string } | null>(null);

  const { isChecked, toggle, checkedCount, clearChecked } = useCheckedItems(
    selectedList?.id ?? null
  );

  const [error, setError] = useState<string | null>(null);

  const loadLists = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchShoppingLists();
      setLists(data);
    } catch {
      setError('Failed to load shopping lists');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  const handleSelectList = async (list: ShoppingList) => {
    setError(null);
    try {
      const detail = await fetchShoppingList(list.id);
      setSelectedList(detail);
    } catch {
      setError('Failed to load shopping list');
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    setError(null);
    try {
      const created = await createShoppingList(newListName.trim());
      setLists((prev) => [...prev, created]);
      setNewListName('');
    } catch {
      setError('Failed to create shopping list');
    }
  };

  const handleDeleteList = async (id: string) => {
    setError(null);
    try {
      await deleteShoppingList(id);
      clearChecked(id);
      setLists((prev) => prev.filter((l) => l.id !== id));
      if (selectedList?.id === id) {
        setSelectedList(null);
      }
    } catch {
      setError('Failed to delete shopping list');
    }
  };

  const handleAddItem = async () => {
    if (!selectedList || !itemName.trim()) return;
    setError(null);
    try {
      const updatedList = await addShoppingListItem(selectedList.id, {
        name: itemName.trim(),
        amount: itemAmount || undefined,
        unit: itemUnit || undefined,
        category: itemCategory || undefined,
      });
      setSelectedList(updatedList);
      setItemName('');
      setItemAmount('');
      setItemUnit('');
      setItemCategory('');
    } catch {
      setError('Failed to add item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!selectedList) return;
    setError(null);
    try {
      await deleteShoppingListItem(selectedList.id, itemId);
      setSelectedList((prev) =>
        prev ? { ...prev, items: prev.items.filter((i) => i.id !== itemId) } : prev
      );
    } catch {
      setError('Failed to delete item');
    }
  };

  const handleGenerateClick = () => {
    setShowGeneratePanel(true);
    setGenerateError(null);
  };

  const handleGenerateConfirm = async () => {
    const weekDate = formatWeekStartParam(generateWeekStart);
    const expectedName = `Shopping List - Week of ${weekDate}`;

    // Check if a list already exists for this week
    const existingList = lists.find((l) => l.name === expectedName);
    if (existingList && !confirmDialog) {
      setConfirmDialog({ weekDate });
      return;
    }

    await doGenerate(weekDate);
  };

  const handleReplace = async () => {
    if (!confirmDialog) return;
    const weekDate = confirmDialog.weekDate;
    const expectedName = `Shopping List - Week of ${weekDate}`;
    const existingList = lists.find((l) => l.name === expectedName);

    // Delete existing list first
    if (existingList) {
      await deleteShoppingList(existingList.id);
      setLists((prev) => prev.filter((l) => l.id !== existingList.id));
    }

    setConfirmDialog(null);
    await doGenerate(weekDate);
  };

  const handleCreateNew = async () => {
    if (!confirmDialog) return;
    setConfirmDialog(null);
    await doGenerate(confirmDialog.weekDate);
  };

  const doGenerate = async (weekDate: string) => {
    setGenerating(true);
    setGenerateError(null);
    try {
      const generated = await generateShoppingList(weekDate);
      setLists((prev) => [...prev, generated]);
      setSelectedList(generated);
      setShowGeneratePanel(false);
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ detail?: string }>;
      const detail = axiosErr?.response?.data?.detail;
      if (
        axiosErr?.response?.status === 400 ||
        (detail && detail.toLowerCase().includes('no recipes'))
      ) {
        setGenerateError(detail || 'No recipes found in meal plan for this week');
      } else {
        const message = err instanceof Error ? err.message : 'Failed to generate shopping list';
        setGenerateError(message);
      }
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-text-secondary">Loading...</div>;
  }

  const errorBanner = error ? (
    <div className="mb-4 p-3 bg-error/10 border border-error rounded text-error">{error}</div>
  ) : null;

  // Detail view
  if (selectedList) {
    const grouped = groupByCategory(selectedList.items);
    return (
      <div className="p-6">
        {errorBanner}
        <button
          onClick={() => setSelectedList(null)}
          className="mb-4 text-accent hover:text-accent-hover"
        >
          &larr; Back to lists
        </button>
        <h1 className="text-2xl font-bold text-text-primary mb-4">{selectedList.name}</h1>

        {/* Progress */}
        <p className="text-text-secondary mb-4">
          {checkedCount}/{selectedList.items.length} items checked
        </p>

        {/* Add item form */}
        <div className="mb-6 p-4 bg-card rounded-xl border border-border">
          <div className="flex flex-wrap gap-2">
            <label className="flex flex-col">
              <span className="text-sm text-text-secondary mb-1">Item name</span>
              <input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="bg-primary border border-border rounded px-2 py-1 text-text-primary"
              />
            </label>
            <label className="flex flex-col">
              <span className="text-sm text-text-secondary mb-1">Amount</span>
              <input
                value={itemAmount}
                onChange={(e) => setItemAmount(e.target.value)}
                className="bg-primary border border-border rounded px-2 py-1 text-text-primary w-20"
              />
            </label>
            <label className="flex flex-col">
              <span className="text-sm text-text-secondary mb-1">Unit</span>
              <input
                value={itemUnit}
                onChange={(e) => setItemUnit(e.target.value)}
                className="bg-primary border border-border rounded px-2 py-1 text-text-primary w-20"
              />
            </label>
            <label className="flex flex-col">
              <span className="text-sm text-text-secondary mb-1">Category</span>
              <input
                value={itemCategory}
                onChange={(e) => setItemCategory(e.target.value)}
                className="bg-primary border border-border rounded px-2 py-1 text-text-primary"
              />
            </label>
            <div className="flex items-end">
              <button
                onClick={handleAddItem}
                className="bg-accent hover:bg-accent-hover text-text-primary px-4 py-1 rounded"
              >
                Add item
              </button>
            </div>
          </div>
        </div>

        {/* Items grouped by category */}
        {Object.entries(grouped).map(([category, items]) => {
          const sorted = [...items].sort((a, b) => {
            const aChecked = isChecked(a.id) ? 1 : 0;
            const bChecked = isChecked(b.id) ? 1 : 0;
            return aChecked - bChecked;
          });
          return (
            <div key={category} className="mb-4" data-testid="category-section">
              <h3 className="text-lg font-semibold text-text-primary mb-2">{category}</h3>
              {sorted.map((item) => {
                const checked = isChecked(item.id);
                return (
                  <div
                    key={item.id}
                    data-testid="shopping-item"
                    className={`flex items-center justify-between p-2 bg-card rounded border border-border mb-1${checked ? ' line-through opacity-60' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(item.id)}
                        aria-label={`Check ${item.name}`}
                      />
                      <span className="text-text-primary">
                        {item.name}
                        {item.amount && (
                          <span className="text-text-secondary ml-2">
                            {item.amount} {item.unit}
                          </span>
                        )}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      aria-label={`Delete ${item.name}`}
                      className="text-text-muted hover:text-error px-2"
                    >
                      Delete
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  // List of lists view
  return (
    <div className="p-6">
      {errorBanner}
      <h1 className="text-2xl font-bold text-text-primary mb-4">Shopping Lists</h1>

      {/* Create list form */}
      <div className="mb-6 flex gap-2">
        <label className="flex flex-col">
          <span className="text-sm text-text-secondary mb-1">List name</span>
          <input
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            className="bg-card border border-border rounded px-2 py-1 text-text-primary"
          />
        </label>
        <div className="flex items-end">
          <button
            onClick={handleCreateList}
            className="bg-accent hover:bg-accent-hover text-text-primary px-4 py-1 rounded"
          >
            Create list
          </button>
        </div>
      </div>

      {/* Generate from meal plan */}
      <div className="mb-6">
        <button
          onClick={handleGenerateClick}
          className="bg-accent hover:bg-accent-hover text-text-primary px-4 py-2 rounded"
        >
          Generate from Meal Plan
        </button>

        {showGeneratePanel && (
          <div className="mt-4 p-4 bg-card rounded-xl border border-border">
            <WeekNavigation weekStart={generateWeekStart} onWeekChange={setGenerateWeekStart} />
            <div className="mt-3">
              {generating ? (
                <p className="text-text-secondary">Generating...</p>
              ) : (
                <button
                  onClick={handleGenerateConfirm}
                  className="bg-accent hover:bg-accent-hover text-text-primary px-4 py-1 rounded"
                >
                  Generate
                </button>
              )}
            </div>
            {generateError && <p className="mt-2 text-error">{generateError}</p>}
          </div>
        )}

        {/* Confirmation dialog */}
        {confirmDialog && (
          <div className="mt-4 p-4 bg-card rounded-xl border border-border">
            <p className="text-text-primary mb-3">
              A shopping list for this week already exists. What would you like to do?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleReplace}
                className="bg-accent hover:bg-accent-hover text-text-primary px-4 py-1 rounded"
              >
                Replace
              </button>
              <button
                onClick={handleCreateNew}
                className="border border-border text-text-primary px-4 py-1 rounded hover:bg-hover"
              >
                Create New
              </button>
              <button
                onClick={() => setConfirmDialog(null)}
                className="text-text-muted px-4 py-1 rounded hover:bg-hover"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {lists.length === 0 ? (
        <p className="text-text-secondary">No shopping lists yet. Create one above!</p>
      ) : (
        <div className="space-y-2">
          {lists.map((list) => (
            <div
              key={list.id}
              data-testid="shopping-list-card"
              className="flex items-center justify-between p-4 bg-card rounded-xl border border-border"
            >
              <button
                onClick={() => handleSelectList(list)}
                className="text-text-primary font-medium hover:text-accent text-left"
              >
                {list.name}
              </button>
              <button
                onClick={() => handleDeleteList(list.id)}
                aria-label={`Delete ${list.name}`}
                className="text-text-muted hover:text-error px-2"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function groupByCategory(items: ShoppingListItem[]): Record<string, ShoppingListItem[]> {
  const groups: Record<string, ShoppingListItem[]> = {};
  for (const item of items) {
    const cat = item.category || 'Uncategorized';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  }
  return groups;
}

export default ShoppingListPage;
