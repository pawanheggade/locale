
import React, { useRef, useCallback } from 'react';
import { DisplayablePost, Account } from '../types';
import { PostCard } from './PostCard';
import { SpinnerIcon, ArchiveBoxIcon } from './Icons';
import { cn } from '../lib/utils';
import { EmptyState } from './EmptyState';
import { PostCardSkeleton } from './PostCardSkeleton';

interface PostListProps {
  posts: DisplayablePost[];
  currentAccount: Account | null;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  isSearchResult?: boolean;
  isArchived?: boolean;
  hideAuthorInfo?: boolean;
  isLoading?: boolean;
  isFiltering?: boolean;
  variant?: 'default' | 'compact';
  hideExpiry?: boolean;
  enableEntryAnimation?: boolean;
}

const PostListComponent: React.FC<PostListProps> = ({ posts, currentAccount, onLoadMore, hasMore, isLoadingMore, isSearchResult = false, isArchived = false, hideAuthorInfo = false, isLoading = false, isFiltering = false, variant = 'default', hideExpiry = false, enableEntryAnimation = false }) => {
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostElementRef = useCallback((node: HTMLDivElement | null) => {
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoadingMore && onLoadMore) {
        onLoadMore();
      }
    });

    if (node) observer.current.observe(node);
  }, [isLoadingMore, hasMore, onLoadMore]);
  
  const isCompact = variant === 'compact';

  if (isLoading) {
    return (
      <div className={cn('grid', isCompact ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6')}>
        {Array.from({ length: isCompact ? 8 : 6 }).map((_, index) => (
          <PostCardSkeleton key={index} index={index} />
        ))}
      </div>
    );
  }

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
      {isFiltering && (
          <div className="absolute inset-0 bg-white/80 z-10 flex justify-center items-start pt-32 animate-fade-in pointer-events-none">
              <SpinnerIcon className="w-10 h-10 text-red-500" />
          </div>
      )}
      <div className={cn(
        'grid transition-opacity duration-200',
        isFiltering ? 'opacity-40' : 'opacity-100',
        isCompact ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'
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
              variant={variant}
              hideExpiry={hideExpiry}
              enableEntryAnimation={enableEntryAnimation}
          />
        ))}
        {isLoadingMore && (
          <div className="col-span-full flex justify-center py-8">
            <SpinnerIcon className="w-8 h-8 text-red-500" />
          </div>
        )}
      </div>
      
      {onLoadMore && (
        <div ref={lastPostElementRef} />
      )}
    </div>
  );
};

export const PostList = React.memo(PostListComponent);
