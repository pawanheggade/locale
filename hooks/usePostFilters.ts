

import { useMemo } from 'react';
import { DisplayablePost, Account } from '../types';
import { useFilters } from '../contexts/FiltersContext';
import { useDebounce } from './useDebounce';
import { applyFiltersToPosts, sortFilteredPosts } from '../utils/posts';
import { haversineDistance } from '../utils/geocoding';
import { usePostLikeCounts } from './usePostLikeCounts';
import { useUserData } from '../contexts/UserDataContext';

export const usePostFilters = (
  postsToFilter: DisplayablePost[],
  allPosts: DisplayablePost[],
  userLocation: { lat: number; lng: number } | null,
  currentAccount: Account | null,
  allAccounts: Account[]
) => {
  const { filterState } = useFilters();
  const { hiddenPostIds } = useUserData();
  const debouncedSearchQuery = useDebounce(filterState.searchQuery, 300);
  const likeCounts = usePostLikeCounts(allAccounts);

  const enrichedPosts = useMemo(() => {
    return postsToFilter.map(post => ({
      ...post,
      likeCount: likeCounts.get(post.id) || 0,
      distance: userLocation && (post.coordinates || post.eventCoordinates)
        ? haversineDistance(userLocation, (post.coordinates || post.eventCoordinates)!)
        : undefined,
    }));
  }, [postsToFilter, likeCounts, userLocation]);

  const filteredPosts = useMemo(() => {
    const initiallyFiltered = applyFiltersToPosts(
      enrichedPosts,
      allPosts,
      filterState,
      debouncedSearchQuery,
      userLocation,
      currentAccount
    );

    if (!hiddenPostIds || hiddenPostIds.length === 0) {
        return initiallyFiltered;
    }
    const hiddenSet = new Set(hiddenPostIds);
    return initiallyFiltered.filter(post => !hiddenSet.has(post.id));

  }, [enrichedPosts, allPosts, filterState, debouncedSearchQuery, userLocation, currentAccount, hiddenPostIds]);

  const sortedAndFilteredPosts = useMemo(() => {
    return sortFilteredPosts(filteredPosts, filterState);
  }, [filteredPosts, filterState]);

  return sortedAndFilteredPosts;
};
