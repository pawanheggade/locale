
import { useState, useEffect, useCallback } from 'react';
import { useIsMounted } from './useIsMounted';

const POSTS_PER_PAGE = 8;

/**
 * A custom hook to manage the state for an infinite scroll list.
 * @param allItems The full array of items to be paginated.
 * @param isInitialLoading A flag to prevent the hook from running during the app's initial load.
 * @returns An object with the currently displayed items and state management for loading more.
 */
export const useInfiniteScroll = <T extends { id: string }>(allItems: T[], isInitialLoading: boolean) => {
  const [displayedItems, setDisplayedItems] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const isMounted = useIsMounted();
  // We still need a ref to track previous items for comparison without triggering effects
  const prevAllItemsRef = React.useRef<T[]>([]);

  // Update list when the source array changes
  useEffect(() => {
    if (isInitialLoading) return;

    const prevItems = prevAllItemsRef.current;
    const newItems = allItems;

    // Check if the structural identity of the list has changed (IDs order/presence)
    // This prevents resetting the view when only item properties (like isLiked) change
    const hasStructuralChange = 
        prevItems.length !== newItems.length || 
        prevItems.some((item, index) => item.id !== newItems[index].id);

    if (hasStructuralChange) {
        // List changed structurally (filter, sort, new posts, or initial load) -> Reset to page 1
        setCurrentPage(1);
        const initialItems = allItems.slice(0, POSTS_PER_PAGE);
        if (isMounted()) {
            setDisplayedItems(initialItems);
            setHasMore(allItems.length > POSTS_PER_PAGE);
        }
    } else {
        // List is structurally the same, just data updates.
        // Preserve current page/scroll, but update the objects in displayedItems to reflect data changes.
        if (isMounted()) {
             const currentCount = currentPage * POSTS_PER_PAGE;
             // We re-slice to get the updated object references (e.g., with new 'isLiked' state)
             const updatedDisplayedItems = allItems.slice(0, currentCount);
             setDisplayedItems(updatedDisplayedItems);
             // Ensure hasMore is consistent (though length likely didn't change)
             setHasMore(allItems.length > currentCount);
        }
    }

    prevAllItemsRef.current = allItems;
  }, [allItems, isInitialLoading, currentPage, isMounted]);

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);

    // Simulate network delay for loading more items
    setTimeout(() => {
      if (!isMounted()) {
        return;
      }
      
      const nextPage = currentPage + 1;
      const newItems = allItems.slice(0, nextPage * POSTS_PER_PAGE);

      setDisplayedItems(newItems);
      setCurrentPage(nextPage);
      setHasMore(allItems.length > newItems.length);
      setIsLoadingMore(false);
    }, 500);
  }, [isLoadingMore, hasMore, currentPage, allItems, isMounted]);

  return { displayedItems, hasMore, loadMore, isLoadingMore };
};
import React from 'react';
