


import React from 'react';
import { DisplayablePost, Account } from '../types';
import { PostList } from './PostList';
import { MapPinIcon } from './Icons';
import { EmptyState } from './EmptyState';
import { useUI } from '../contexts/UIContext';

interface NearbyPostsViewProps {
  result: {
    posts: DisplayablePost[];
    locationName: string | null;
  };
  currentAccount: Account;
}

export const NearbyPostsView: React.FC<NearbyPostsViewProps> = ({
  result,
  currentAccount,
}) => {
  const { posts, locationName } = result;
  const { gridView, isTabletOrDesktop } = useUI();

  return (
    <div className="animate-fade-in-down p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Nearby Posts</h1>
            {locationName && <p className="text-md text-gray-600 mt-1">Showing results within 50km of <strong>{locationName}</strong></p>}
        </div>
        {posts.length === 0 ? (
        <EmptyState
            icon={<MapPinIcon />}
            title="No Posts Found Nearby"
            description="There are currently no posts within a 50 km radius. Try searching in a different area or check back later!"
            className="py-20"
        />
      ) : (
         <PostList
            posts={posts}
            currentAccount={currentAccount}
            isSearchResult={true}
            variant={isTabletOrDesktop ? gridView : 'default'}
        />
      )}
    </div>
  );
};