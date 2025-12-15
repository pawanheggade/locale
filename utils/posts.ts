
import { Post, DisplayablePost, Account, FiltersState, Subscription, PostType } from '../types';
import { haversineDistance } from './geocoding';

const TIER_RANK: Record<Subscription['tier'], number> = { 'Organisation': 4, 'Business': 3, 'Verified': 2, 'Basic': 1, 'Personal': 0 };

export const getPostStatus = (expiryDate: number | null | undefined): { isExpired: boolean, isExpiringSoon: boolean, isExpiringThisWeek: boolean } => {
  if (!expiryDate) {
    return { isExpired: false, isExpiringSoon: false, isExpiringThisWeek: false };
  }
  const now = Date.now();
  const isExpired = expiryDate < now;

  // Expires in the next 3 days
  const threeDaysFromNow = now + 3 * 24 * 60 * 60 * 1000;
  const isExpiringSoon = !isExpired && expiryDate <= threeDaysFromNow;
  
  // Expires in the next 7 days
  const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;
  const isExpiringThisWeek = !isExpired && expiryDate <= sevenDaysFromNow;

  return { isExpired, isExpiringSoon, isExpiringThisWeek };
};

export const isPostPurchasable = (post: { type: PostType; price?: number }): boolean => {
    return post.type === PostType.PRODUCT || (post.type === PostType.SERVICE && post.price !== undefined && post.price > 0);
};

export const isAccountEligibleToPin = (account: Account | null): boolean => {
    if (!account) return false;
    return account.subscription.tier === 'Verified' || account.subscription.tier === 'Business' || account.subscription.tier === 'Organisation';
};

export const applyFiltersToPosts = (
  postsToFilter: DisplayablePost[],
  allPosts: DisplayablePost[],
  filterState: FiltersState,
  debouncedSearchQuery: string,
  userLocation: { lat: number; lng: number } | null,
  currentAccount: Account | null
): DisplayablePost[] => {
  if (filterState.isAiSearchEnabled && filterState.aiSmartFilterResults) {
    const resultMap = new Map(filterState.aiSmartFilterResults.map(item => [item.id, item.reasoning]));
    return allPosts
      .filter(p => resultMap.has(p.id))
      .map(p => ({ ...p, aiReasoning: resultMap.get(p.id) }))
      .sort((a, b) => {
        const indexA = filterState.aiSmartFilterResults!.findIndex(item => item.id === a.id);
        const indexB = filterState.aiSmartFilterResults!.findIndex(item => item.id === b.id);
        return indexA - indexB;
      });
  }

  const lowercasedQuery = filterState.isAiSearchEnabled ? '' : debouncedSearchQuery.toLowerCase();

  return postsToFilter.filter(post => {
    // Filter out posts from archived or rejected accounts on main feeds
    if (post.author?.status === 'archived' || post.author?.status === 'rejected') {
        return false;
    }

    // Hide posts from pending sellers unless the current user is the author
    if (post.author?.status === 'pending' && post.authorId !== currentAccount?.id) {
      return false;
    }
    
    if (filterState.filterType !== 'all' && post.type !== filterState.filterType) return false;
    if (filterState.filterCategory !== 'all' && post.category !== filterState.filterCategory) return false;
    
    if (filterState.minPrice && (post.price === undefined || post.price < parseFloat(filterState.minPrice))) return false;
    if (filterState.maxPrice && (post.price === undefined || post.price > parseFloat(filterState.maxPrice))) return false;
    
    if (filterState.filterTags.length > 0 && !filterState.filterTags.every(tag => post.tags.map(t => t.toLowerCase()).includes(tag.toLowerCase()))) return false;
    
    const postStatus = getPostStatus(post.expiryDate);
    if (filterState.filterShowExpired && !postStatus.isExpired) return false;
    if (!filterState.filterShowExpired && postStatus.isExpired) return false;
    if (filterState.filterExpiringSoon && !postStatus.isExpiringSoon) return false;
    
    if (filterState.filterOnSale && !(post.salePrice !== undefined && post.price !== undefined && post.salePrice < post.price)) return false;

    if (filterState.filterLast7Days) {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      if (post.lastUpdated < sevenDaysAgo) return false;
    }
    
    if (userLocation && filterState.filterDistance > 0) {
      if (post.distance === undefined) return false;
      if (post.distance > filterState.filterDistance) return false;
    }

    if (lowercasedQuery) {
      return (
        post.title.toLowerCase().includes(lowercasedQuery) ||
        post.description.toLowerCase().includes(lowercasedQuery) ||
        post.category.toLowerCase().includes(lowercasedQuery) ||
        post.tags.some(tag => tag.toLowerCase().includes(lowercasedQuery))
      );
    }
    
    return true;
  });
};

export const sortFilteredPosts = (
  filteredPosts: DisplayablePost[],
  filterState: FiltersState,
): DisplayablePost[] => {
  if (filterState.isAiSearchEnabled && filterState.aiSmartFilterResults) {
    return filteredPosts; // Already sorted by AI
  }

  const sorted = [...filteredPosts];
  sorted.sort((a, b) => {
    let comparison = 0;
    switch (filterState.sortOption) {
      case 'relevance-desc':
        const pinA = a.isPinned ? 1 : 0;
        const pinB = b.isPinned ? 1 : 0;
        if (pinA !== pinB) return pinB - pinA;

        const choiceA = a.isLocaleChoice ? 1 : 0;
        const choiceB = b.isLocaleChoice ? 1 : 0;
        if (choiceA !== choiceB) return choiceB - choiceA;
        
        comparison = parseInt(b.id) - parseInt(a.id);
        break;
      case 'popularity-desc':
        comparison = (b.likeCount || 0) - (a.likeCount || 0);
        break;
      case 'price-asc': comparison = (a.price ?? 0) - (b.price ?? 0); break;
      case 'price-desc': comparison = (b.price ?? 0) - (a.price ?? 0); break;
      case 'title-asc': comparison = a.title.localeCompare(b.title); break;
      case 'title-desc': comparison = b.title.localeCompare(a.title); break;
      case 'date-asc': comparison = parseInt(a.id) - parseInt(b.id); break;
      case 'distance-asc': comparison = (a.distance ?? Infinity) - (b.distance ?? Infinity); break;
      case 'distance-desc': {
        const distA = a.distance ?? Infinity;
        const distB = b.distance ?? Infinity;
        if (distA === Infinity && distB !== Infinity) {
          comparison = 1; // a (no location) comes after b
        } else if (distA !== Infinity && distB === Infinity) {
          comparison = -1; // a comes before b (no location)
        } else {
          comparison = distB - distA; // Sort descending
        }
        break;
      }
      case 'location-asc': comparison = a.location.localeCompare(b.location); break;
      case 'location-desc': comparison = b.location.localeCompare(a.location); break;
      case 'date-desc': 
      default: comparison = parseInt(b.id) - parseInt(a.id); break;
    }

    if (comparison !== 0) return comparison;
    
    const tierA = a.author?.subscription?.tier ?? 'Basic';
    const tierB = b.author?.subscription?.tier ?? 'Basic';
    const tierComparison = (TIER_RANK[tierB] ?? 0) - (TIER_RANK[tierA] ?? 0);
    if (tierComparison !== 0) return tierComparison;

    return parseInt(b.id) - parseInt(a.id);
  });

  return sorted;
};
