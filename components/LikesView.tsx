
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { PostList } from './PostList';
import { TabButton } from './ui/Button';
import { HeartIcon, UserIcon } from './Icons';
import { EmptyState } from './EmptyState';
import { useUI } from '../contexts/UIContext';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../contexts/PostsContext';
import { useSwipeToNavigateTabs } from '../hooks/useSwipeToNavigateTabs';
import { useTabAnimation } from '../hooks/useTabAnimation';

type LikedTab = 'profiles' | 'posts';

export const LikesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LikedTab>('profiles');
  const { gridView, isTabletOrDesktop } = useUI();
  const { currentAccount, likedPostIds } = useAuth();
  const { posts: allPosts } = usePosts();

  const swipeRef = useRef<HTMLDivElement>(null);
  const tabs: LikedTab[] = ['profiles', 'posts'];
  const animationClass = useTabAnimation(activeTab, tabs);
  
  useSwipeToNavigateTabs({
      tabs,
      activeTab,
      setActiveTab: (tabId) => setActiveTab(tabId as LikedTab),
      swipeRef,
  });

  const likedPosts = useMemo(() => {
    if (!currentAccount) return [];
    return allPosts.filter(post => likedPostIds.has(post.id));
  }, [allPosts, likedPostIds, currentAccount]);

  const postsFromLikedProfiles = useMemo(() => {
    if (!currentAccount) return [];
    const likedAccountIds = new Set(currentAccount.likedAccountIds || []);
    if (likedAccountIds.size === 0) return [];
    
    return allPosts
        .filter(post => likedAccountIds.has(post.authorId))
        .sort((a, b) => b.lastUpdated - a.lastUpdated);
  }, [currentAccount, allPosts]);

  const renderContent = () => {
    if (activeTab === 'profiles') {
      return postsFromLikedProfiles.length === 0 ? (
        <EmptyState
          icon={<UserIcon />}
          title="No Posts from Liked Profiles"
          description="Posts from sellers you like will appear here. Like some profiles to get started!"
          className="py-20"
        />
      ) : (
        <PostList posts={postsFromLikedProfiles} />
      );
    }
    if (activeTab === 'posts') {
      return likedPosts.length === 0 ? (
        <EmptyState
          icon={<HeartIcon />}
          title="No Liked Posts Yet"
          description="Tap the heart on posts you love to save them here."
          className="py-20"
        />
      ) : (
        <PostList posts={likedPosts} />
      );
    }
    return null;
  };
  
  if (!currentAccount) {
    return <div className="p-8 text-center">You must be logged in to view your likes.</div>;
  }

  return (
    <div className="animate-fade-in-down p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Likes</h1>
      <div className="mb-6 border-b border-gray-200/80">
        <nav className="flex space-x-6 px-2 overflow-x-auto hide-scrollbar" role="tablist" aria-label="Likes content">
          <TabButton onClick={() => setActiveTab('profiles')} isActive={activeTab === 'profiles'}>
            Profiles
          </TabButton>
          <TabButton onClick={() => setActiveTab('posts')} isActive={activeTab === 'posts'}>
            Posts
          </TabButton>
        </nav>
      </div>

      <div ref={swipeRef} className="relative overflow-x-hidden">
        <div key={activeTab} className={animationClass}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
