import React, { useRef, useCallback } from 'react';
import { DisplayablePost, Account } from '../types';
import { PostCard } from './PostCard';
import { SpinnerIcon, ArchiveBoxIcon } from './Icons';
import { cn } from '../lib/utils';

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

const PostCardSkeleton: React.FC<{ index: number }> = ({ index }) => (
    <div
      className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col animate-pulse"
      style={{ animationDelay: `${index * 75}ms`, animationDuration: '1.5s' }}
    >
      <div className="w-full bg-gray-300 aspect-[4/3]"></div>
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex-grow">
          <div className="h-5 bg-gray-300 rounded w-3/4 mb-3"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="flex justify-between items-center text-gray-600">
            <div className="flex items-center gap-2 w-full">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded-full w-16 flex-shrink-0"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mt-3"></div>
        </div>
        <div className="p-3 border-t mt-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-300 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-300 rounded w-2/3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mt-1.5"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
);


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
      <div className="text-center py-20 flex flex-col items-center">
        <ArchiveBoxIcon className="w-16 h-16 text-gray-300" />
        <h2 className="text-2xl font-semibold text-gray-700 mt-4">No Posts Yet</h2>
        <p className="text-gray-500 mt-2 max-w-md">Looks a bit empty here. Try adjusting your filters or be the first to post!</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {isFiltering && (
          <div className="absolute inset-0 bg-gray-50/75 backdrop-blur-sm z-10 flex justify-center items-start pt-32 animate-fade-in pointer-events-none">
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