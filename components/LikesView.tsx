

import React, { useState, useMemo } from 'react';
import { Account, DisplayablePost } from '../types';
import { PostList } from './PostList';
import { TabButton } from './ui/Button';
import { HeartIcon } from './Icons';
import { EmptyState } from './EmptyState';

interface LikesViewProps {
  likedPosts: DisplayablePost[];
  allPosts: DisplayablePost[];
  currentAccount: Account;
  gridView: 'default' | 'compact';
  isTabletOrDesktop: boolean;
}

type LikedTab = 'posts' | 'profiles';

export const LikesView: React.FC<LikesViewProps> = ({ likedPosts, allPosts, currentAccount, gridView, isTabletOrDesktop }) => {
  const [activeTab, setActiveTab] = useState<LikedTab>('posts');

  const postsFromLikedProfiles = useMemo(() => {
    const likedAccountIds = new Set(currentAccount?.likedAccountIds || []);
    if (likedAccountIds.size === 0) return [];
    
    return allPosts
        .filter(post => likedAccountIds.has(post.authorId))
        .sort((a, b) => b.lastUpdated - a.lastUpdated);
  }, [currentAccount, allPosts]);

  return (
    <div className="animate-fade-in-down p-4 sm:p-6 lg:p-8">
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-6 px-2 overflow-x-auto hide-scrollbar" role="tablist" aria-label="Likes content">
          <TabButton onClick={() => setActiveTab('posts')} isActive={activeTab === 'posts'}>
            Posts
          </TabButton>
          <TabButton onClick={() => setActiveTab('profiles')} isActive={activeTab === 'profiles'}>
            Profiles
          </TabButton>
        </nav>
      </div>

      <div>
        {activeTab === 'posts' && (
          <div>
            {likedPosts.length === 0 ? (
              <EmptyState
                icon={<HeartIcon />}
                title="No Liked Posts Yet"
                description="Tap the heart on posts you love to save them here."
                className="py-20"
              />
            ) : (
              <PostList
                posts={likedPosts}
                currentAccount={currentAccount}
                variant={isTabletOrDesktop ? gridView : 'default'}
              />
            )}
          </div>
        )}

        {activeTab === 'profiles' && (
          <div>
            {postsFromLikedProfiles.length === 0 ? (
              <EmptyState
                icon={<HeartIcon />}
                title="No Posts from Liked Profiles"
                description="Posts from sellers you like will appear here. Like some profiles to get started!"
                className="py-20"
              />
            ) : (
              <PostList
                posts={postsFromLikedProfiles}
                currentAccount={currentAccount}
                variant={isTabletOrDesktop ? gridView : 'default'}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};