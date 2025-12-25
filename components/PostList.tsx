import React, { useRef, useCallback, useMemo } from 'react';
import { PostCard } from './PostCard';
import { SpinnerIcon, ArchiveBoxIcon } from './Icons';
import { cn } from '../lib/utils';
import { EmptyState } from './EmptyState';
import { PostCardSkeleton } from './PostCardSkeleton';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../contexts/PostsContext';
import { usePostFilters } from '../hooks/usePostFilters';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useUI } from '../contexts/UIContext';
import { DisplayablePost } from '../types';

interface PostListProps {
  isSearchResult?: boolean;
  isArchived?: boolean;
  hideAuthorInfo?: boolean;
  hideExpiry?: boolean;
  enableEntryAnimation?: boolean;
  variant?: 'default' | 'compact';
  // If an authorId is provided, the list will only show posts from that author.
  authorId?: string;
  posts?: DisplayablePost[];
}

const PostListComponent: React.FC<PostListProps> = ({ posts: postsProp, isSearchResult = false, isArchived = false, hideAuthorInfo = false, hideExpiry = false, enableEntryAnimation = false, variant: variantProp, authorId }) => {
  const { currentAccount, accounts } = useAuth();
  const { posts: allDisplayablePosts, archivedPosts, postsByAuthorId } = usePosts();
  const { gridView, isTabletOrDesktop } = useUI();
  
  const sourcePosts = useMemo(() => {
    if (postsProp) return postsProp;
    if (isArchived) return archivedPosts;
    if (authorId) return postsByAuthorId.get(authorId) || [];
    return allDisplayablePosts;
  }, [postsProp, isArchived, authorId, allDisplayablePosts, archivedPosts, postsByAuthorId]);

  const { displayedItems, hasMore, loadMore, isLoadingMore } = useInfiniteScroll(sourcePosts, false);
  const filteredAndSortedPosts = usePostFilters(displayedItems, allDisplayablePosts, null, currentAccount, Array.from(accounts.values()));

  const posts = (postsProp || authorId) ? displayedItems : filteredAndSortedPosts;

  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostElementRef = useCallback((node: HTMLDivElement | null) => {
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoadingMore && loadMore) {
        loadMore();
      }
    });

    if (node) observer.current.observe(node);
  }, [isLoadingMore, hasMore, loadMore]);
  
  const variant = variantProp || (isTabletOrDesktop ? gridView : 'default');

  if (posts.length === 0 && !isLoadingMore) {
    return (
      <EmptyState
        icon={<ArchiveBoxIcon />}
        title="No Posts Yet"
        description="Looks a bit empty here. Try adjusting your filters or be the first to post!"
        className="py-20"
      />
    );
  }

  return (
    <div className="relative">
      <div className={cn(
        'grid transition-opacity duration-200',
        variant === 'compact' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'
      )}>
        {posts.map((post, index) => (
          <PostCard 
              key={post.id}
              post={post} 
              currentAccount={currentAccount}
              index={index}
              isSearchResult={isSearchResult}
              isArchived={isArchived}
              hideAuthorInfo={hideAuthorInfo}
              hideExpiry={hideExpiry}
              variant={variant}
              enableEntryAnimation={enableEntryAnimation}
          />
        ))}
        {isLoadingMore && (
          <div className="col-span-full flex justify-center py-8">
            <SpinnerIcon className="w-8 h-8 text-red-500" />
          </div>
        )}
      </div>
      
      {loadMore && (
        <div ref={lastPostElementRef} />
      )}
    </div>
  );
};

export const PostList = React.memo(PostListComponent);