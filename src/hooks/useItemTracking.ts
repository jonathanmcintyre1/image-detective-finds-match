
import { useState, useEffect, useCallback } from 'react';

interface ItemTrackingOptions {
  localStorageKey: string;
  initialItems?: string[];
}

/**
 * Custom hook for tracking items (such as reviewed images or saved items)
 * Persists data in localStorage
 */
export function useItemTracking({ localStorageKey, initialItems = [] }: ItemTrackingOptions) {
  // Initialize from localStorage or use initialItems
  const [items, setItems] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(localStorageKey);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error(`Error parsing ${localStorageKey} from localStorage:`, e);
        }
      }
    }
    return initialItems;
  });

  // Persist to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem(localStorageKey, JSON.stringify(items));
  }, [items, localStorageKey]);

  // Add an item
  const addItem = useCallback((item: string) => {
    setItems(prev => {
      if (prev.includes(item)) return prev;
      return [...prev, item];
    });
  }, []);

  // Remove an item
  const removeItem = useCallback((item: string) => {
    setItems(prev => prev.filter(i => i !== item));
  }, []);

  // Toggle an item (add if not present, remove if present)
  const toggleItem = useCallback((item: string) => {
    setItems(prev => 
      prev.includes(item)
        ? prev.filter(i => i !== item)
        : [...prev, item]
    );
  }, []);

  // Clear all items
  const clearItems = useCallback(() => {
    setItems([]);
  }, []);

  // Check if item exists
  const hasItem = useCallback((item: string) => {
    return items.includes(item);
  }, [items]);

  return {
    items,
    addItem,
    removeItem,
    toggleItem,
    clearItems,
    hasItem
  };
}

export default useItemTracking;
