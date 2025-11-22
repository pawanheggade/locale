import { useState, useMemo } from 'react';

type SortDirection = 'asc' | 'desc';

export interface SortConfig<T> {
  key: keyof T;
  direction: SortDirection;
}

// Defines a map of custom sorting functions for specific keys.
type Sorters<T> = {
  [K in keyof T]?: (a: T, b: T) => number;
};

/**
 * A generic custom hook for sorting an array of objects.
 * @param items The array of items to sort.
 * @param initialConfig The initial sorting configuration (key and direction).
 * @param customSorters Optional map of custom sorting functions for specific keys.
 * @returns An object containing the sorted items, a function to request a sort, and the current sort config.
 */
export const useSort = <T extends {}>(
  items: T[],
  initialConfig?: SortConfig<T>,
  customSorters?: Sorters<T>
) => {
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(initialConfig || null);

  const sortedItems = useMemo(() => {
    if (!sortConfig) {
      return items;
    }

    const sortableItems = [...items];
    sortableItems.sort((a, b) => {
      const customSorter = customSorters?.[sortConfig.key];
      let result = 0;

      if (customSorter) {
        result = customSorter(a, b);
      } else {
        // Default alphanumeric sort for non-custom keys
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        if (valA < valB) {
          result = -1;
        } else if (valA > valB) {
          result = 1;
        }
      }
      
      return sortConfig.direction === 'asc' ? result : -result;
    });
    
    return sortableItems;
  }, [items, sortConfig, customSorters]);

  const requestSort = (key: keyof T, defaultDirection: SortDirection = 'asc') => {
    let direction: SortDirection = defaultDirection;
    if (sortConfig && sortConfig.key === key && sortConfig.direction === defaultDirection) {
      direction = defaultDirection === 'asc' ? 'desc' : 'asc';
    }
    setSortConfig({ key, direction });
  };

  return { items: sortedItems, requestSort, sortConfig };
};
