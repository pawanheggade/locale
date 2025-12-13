

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

export const wasPostEdited = (post: { id: string; lastUpdated: number }): boolean => {
    // A post is considered edited if lastUpdated is significantly later than its creation ID timestamp
    // Using 60 seconds buffer to account for immediate creation glitches
    return post.lastUpdated > parseInt(post.id, 10) + 60000;
};

export const isPostPurchasable = (post: { type: PostType; price?: number }): boolean => {
    return post.type === PostType.PRODUCT || (post.type === PostType.SERVICE && post.price !== undefined && post.price > 0);
};

// Extracts keywords from text, filtering out common stop words.
const getKeywords = (text: string): Set<string> => {
    const stopWords = new Set(['a', 'an', 'the', 'in', 'on', 'for', 'with', 'of', 'and', 'or', 'is', 'are', 'to']);
    return new Set(
        text
            .toLowerCase()
            .replace(/[^\w\s]/g, '') // remove punctuation
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.has(word))
    );
};

export const findSimilarPosts = (
  targetPost: DisplayablePost,
  candidatePosts: DisplayablePost[],
  limit: number = 3
): DisplayablePost[] => {
  const targetKeywords = getKeywords(`${targetPost.title} ${targetPost.description}`);
  const targetTags = new Set(targetPost.tags.map(t => t.toLowerCase()));

  const scoredPosts = candidatePosts
    .filter(post => post.id !== targetPost.id) // Exclude self
    .map(post => {
      let score = 0;

      // 1. Category match (high weight)
      if (post.category === targetPost.category) {
        score += 50;
      }

      // 2. Tag overlap
      const postTags = new Set(post.tags.map(t => t.toLowerCase()));
      const tagIntersection = new Set([...targetTags].filter(tag => postTags.has(tag)));
      score += tagIntersection.size * 20;

      // 3. Keyword overlap in title and description
      const postKeywords = getKeywords(`${post.title} ${post.description}`);
      const keywordIntersection = new Set([...targetKeywords].filter(kw => postKeywords.has(kw)));
      score += keywordIntersection.size * 5;

      // 4. Price proximity (for products with price)
      if (post.type === 'PRODUCT' && targetPost.type === 'PRODUCT' && post.price && targetPost.price) {
        const priceDifference = Math.abs(post.price - targetPost.price);
        const priceRatio = priceDifference / Math.max(targetPost.price, 1);
        if (priceRatio < 0.25) score += 20; // within 25%
        else if (priceRatio < 0.5) score += 10; // within 50%
      }
      
      // 5. Same author bonus (lower weight)
      if (post.authorId === targetPost.authorId) {
          score += 5;
      }

      return { ...post, score };
    })
    .filter(post => post.score > 0); // Only consider posts with any relevance score

  // Sort by score (descending) and return top N
  scoredPosts.sort((a, b) => b.score - a.score);

  return scoredPosts.slice(0, limit);
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

export const generateHistoryBasedRecommendations = (
  likedPosts: DisplayablePost[],
  viewedPosts: DisplayablePost[],
  allPosts: DisplayablePost[],
  limit: number = 20
): DisplayablePost[] => {
  const seenPostIds = new Set([
    ...likedPosts.map(p => p.id),
    ...viewedPosts.map(p => p.id),
  ]);

  // Create a candidate pool of posts that are not expired. Pinned posts are filtered out here
  // to prevent them from being recommended and appearing twice in the feed.
  const candidatePosts = allPosts.filter(p => !p.isPinned && !getPostStatus(p.expiryDate).isExpired);

  // Use all liked posts and up to 10 most recent viewed posts as the basis for recommendations
  const historyPosts = [...likedPosts, ...viewedPosts.slice(0, 10)]; 

  const recommendedPosts: Map<string, DisplayablePost & { score: number }> = new Map();

  // For each post in history, find a few similar posts
  for (const post of historyPosts) {
    // We pass the filtered candidate pool to findSimilarPosts.
    const similar = findSimilarPosts(post, candidatePosts, 5);
    for (const similarPost of similar) {
      if (!seenPostIds.has(similarPost.id)) {
        const existing = recommendedPosts.get(similarPost.id);
        // If it's a new recommendation, or this one is more relevant (higher score), add/update it.
        if (!existing || (similarPost.score && (!existing.score || similarPost.score > existing.score))) {
          recommendedPosts.set(similarPost.id, { ...similarPost, score: similarPost.score || 0 });
        }
      }
    }
  }

  const recommendations = Array.from(recommendedPosts.values());
  
  // Sort by subscription tier, then similarity score, then date
  recommendations.sort((a, b) => {
    const tierA = a.author?.subscription?.tier ?? 'Personal';
    const tierB = b.author?.subscription?.tier ?? 'Personal';

    const tierComparison = (TIER_RANK[tierB] ?? 0) - (TIER_RANK[tierA] ?? 0);
    if (tierComparison !== 0) return tierComparison;

    const scoreComparison = (b.score || 0) - (a.score || 0);
    if (scoreComparison !== 0) return scoreComparison;

    return parseInt(b.id) - parseInt(a.id); // Newest first as a fallback
  });

  return recommendations.slice(0, limit);
};