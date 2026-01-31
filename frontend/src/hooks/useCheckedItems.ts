import { useState, useCallback, useMemo } from 'react';

function getStorageKey(listId: string): string {
  return `shopping-checked-${listId}`;
}

function loadCheckedIds(listId: string | null): Set<string> {
  if (!listId) return new Set();
  const stored = localStorage.getItem(getStorageKey(listId));
  if (stored) {
    try {
      return new Set(JSON.parse(stored) as string[]);
    } catch {
      return new Set();
    }
  }
  return new Set();
}

export function useCheckedItems(listId: string | null) {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => loadCheckedIds(listId));

  // Reset when listId changes by using key-based identity
  const [prevListId, setPrevListId] = useState(listId);
  if (listId !== prevListId) {
    setPrevListId(listId);
    setCheckedIds(loadCheckedIds(listId));
  }

  const toggle = useCallback(
    (itemId: string) => {
      if (!listId) return;
      setCheckedIds((prev) => {
        const next = new Set(prev);
        if (next.has(itemId)) {
          next.delete(itemId);
        } else {
          next.add(itemId);
        }
        localStorage.setItem(getStorageKey(listId), JSON.stringify([...next]));
        return next;
      });
    },
    [listId]
  );

  const isChecked = useCallback((itemId: string): boolean => checkedIds.has(itemId), [checkedIds]);

  const checkedCount = checkedIds.size;

  const clearChecked = useMemo(
    () => (id: string) => {
      localStorage.removeItem(getStorageKey(id));
    },
    []
  );

  return { isChecked, toggle, checkedCount, clearChecked };
}
