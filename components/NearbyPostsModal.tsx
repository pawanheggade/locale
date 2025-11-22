
import React from 'react';
import { DisplayablePost, Account } from '../types';
import { PostList } from './PostList';
import { MapPinIcon } from './Icons';

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

  return (
    <div className="animate-fade-in-up p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Nearby Posts</h1>
            {locationName && <p className="text-md text-gray-500 mt-1">Showing results within 50km of <strong>{locationName}</strong></p>}
        </div>
        {posts.length === 0 ? (
        <div className="text-center py-20 flex flex-col items-center">
            <MapPinIcon className="w-16 h-16 text-gray-300" />
          <h2 className="text-2xl font-semibold text-gray-700 mt-4">No Posts Found Nearby</h2>
          <p className="text-gray-500 mt-2 max-w-md">There are currently no posts within a 50 km radius. Try searching in a different area or check back later!</p>
        </div>
      ) : (
         <PostList
            posts={posts}
            currentAccount={currentAccount}
            isSearchResult={true}
        />
      )}
    </div>
  );
};
