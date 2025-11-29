
import { useState, useEffect, useCallback, useRef } from 'react';
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
  const prevAllItemsRef = useRef<T[]>([]);

  // Update list when the source array changes
  useEffect(() => {
    if (isInitialLoading) return;

    const prevItems = prevAllItemsRef.current;
    const newItems = allItems;

    const hasStructuralChange = 
        prevItems.length !== newItems.length || 
        prevItems.some((item, index) => item.id !== newItems[index].id);

    if (hasStructuralChange) {
        setCurrentPage(1);
        const initialItems = allItems.slice(0, POSTS_PER_PAGE);
        if (isMounted()) {
            setDisplayedItems(initialItems);
            setHasMore(allItems.length > POSTS_PER_PAGE);
        }
    } else {
        if (isMounted()) {
             const currentCount = currentPage * POSTS_PER_PAGE;
             const updatedDisplayedItems = allItems.slice(0, currentCount);
             setDisplayedItems(updatedDisplayedItems);
             setHasMore(allItems.length > currentCount);
        }
    }

    prevAllItemsRef.current = allItems;
  }, [allItems, isInitialLoading, currentPage, isMounted]);

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);

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
