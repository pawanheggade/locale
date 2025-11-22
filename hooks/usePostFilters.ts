import { useMemo } from 'react';
import { DisplayablePost, Account } from '../types';
import { useFilters } from '../contexts/FiltersContext';
import { useDebounce } from './useDebounce';
import { applyFiltersToPosts, sortFilteredPosts } from '../utils/posts';

export const usePostFilters = (
  postsToFilter: DisplayablePost[],
  allPosts: DisplayablePost[],
  userLocation: { lat: number; lng: number } | null,
  currentAccount: Account | null
) => {
  const { filterState } = useFilters();
  const debouncedSearchQuery = useDebounce(filterState.searchQuery, 300);

  const filteredPosts = useMemo(() => {
    return applyFiltersToPosts(
      postsToFilter,
      allPosts,
      filterState,
      debouncedSearchQuery,
      userLocation,
      currentAccount
    );
  }, [postsToFilter, allPosts, filterState, debouncedSearchQuery, userLocation, currentAccount]);

  const sortedAndFilteredPosts = useMemo(() => {
    return sortFilteredPosts(filteredPosts, filterState);
  }, [filteredPosts, filterState]);

  return sortedAndFilteredPosts;
};