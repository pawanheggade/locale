
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { PostList } from './PostList';
import { TabButton } from './ui/Button';
import { HeartIcon, UserIcon, VideoPostcardIcon } from './Icons';
import { EmptyState } from './EmptyState';
import { useUI } from '../contexts/UIContext';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../contexts/PostsContext';
import { useSwipeToNavigateTabs } from '../hooks/useSwipeToNavigateTabs';
import { useTabAnimation } from '../hooks/useTabAnimation';
import { useStory } from '../contexts/StoryContext';
import { DisplayableStoryPost } from '../types';
import { useFilters } from '../contexts/FiltersContext';
import { useDebounce } from '../hooks/useDebounce';
import { StoryCard } from './StoryCard';
import { postMatchesQuery } from '../utils/posts';

type LikedTab = 'profiles' | 'posts' | 'stories';

export const LikesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LikedTab>('profiles');
  const { isTabletOrDesktop } = useUI();
  const { currentAccount, likedPostIds } = useAuth();
  const { posts: allPosts } = usePosts();
  const { activeStories } = useStory();
  const { openModal } = useUI();
  const { filterState } = useFilters();
  const debouncedSearchQuery = useDebounce(filterState.searchQuery, 300);

  const swipeRef = useRef<HTMLDivElement>(null);
  const tabs: LikedTab[] = ['profiles', 'posts', 'stories'];
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

  const likedStories = useMemo(() => {
      if (!currentAccount) return [];
      return activeStories.filter(story => story.likedBy.includes(currentAccount.id));
  }, [activeStories, currentAccount]);

  const filteredLikedPosts = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return likedPosts;
    return likedPosts.filter(post => postMatchesQuery(post, debouncedSearchQuery));
  }, [likedPosts, debouncedSearchQuery]);

  const filteredPostsFromLikedProfiles = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return postsFromLikedProfiles;
    return postsFromLikedProfiles.filter(post => postMatchesQuery(post, debouncedSearchQuery));
  }, [postsFromLikedProfiles, debouncedSearchQuery]);

  const filteredLikedStories = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return likedStories;
    const query = debouncedSearchQuery.toLowerCase();
    return likedStories.filter(story => 
        (story.description && story.description.toLowerCase().includes(query)) ||
        (story.author?.name || '').toLowerCase().includes(query) ||
        (story.author?.username || '').toLowerCase().includes(query)
    );
  }, [likedStories, debouncedSearchQuery]);

  const handleLikedStoryClick = (story: DisplayableStoryPost) => {
      if (!story.author) return;
      openModal({
          type: 'storyViewer',
          data: {
              usersWithStories: [story.author],
              initialUserIndex: 0,
              initialStoryId: story.id,
          },
      });
  };

  const renderContent = () => {
    const hasSearch = debouncedSearchQuery.trim().length > 0;
    switch (activeTab) {
        case 'profiles':
            return filteredPostsFromLikedProfiles.length === 0 ? (
                <EmptyState icon={<UserIcon />} title={hasSearch ? "No Results Found" : "No Posts from Liked Profiles"} description={hasSearch ? "Try a different search query." : "Posts from sellers you like will appear here. Like some profiles to get started!"} className="py-20" />
            ) : (
                <PostList posts={filteredPostsFromLikedProfiles} />
            );
        case 'posts':
            return filteredLikedPosts.length === 0 ? (
                <EmptyState icon={<HeartIcon />} title={hasSearch ? "No Results Found" : "No Liked Posts Yet"} description={hasSearch ? "Try a different search query." : "Tap the heart on posts you love to save them here."} className="py-20" />
            ) : (
                <PostList posts={filteredLikedPosts} />
            );
        case 'stories':
            return filteredLikedStories.length === 0 ? (
                <EmptyState icon={<VideoPostcardIcon />} title={hasSearch ? "No Results Found" : "No Liked Stories"} description={hasSearch ? "Try a different search query." : "Stories you like will appear here."} className="py-20" />
            ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                    {filteredLikedStories.map(story => (
                        <StoryCard key={story.id} story={story} onClick={() => handleLikedStoryClick(story)} />
                    ))}
                </div>
            );
        default:
            return null;
    }
  };
  
  if (!currentAccount) {
    return <div className="p-8 text-center">You must be logged in to view your likes.</div>;
  }

  return (
    <div className="animate-fade-in-down">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Likes</h1>
      <div className="mb-6 border-b border-gray-200/80">
        <nav className="flex space-x-6 px-2 overflow-x-auto hide-scrollbar" role="tablist" aria-label="Likes content">
          <TabButton onClick={() => setActiveTab('profiles')} isActive={activeTab === 'profiles'}>
            Profiles
          </TabButton>
          <TabButton onClick={() => setActiveTab('posts')} isActive={activeTab === 'posts'}>
            Posts
          </TabButton>
          <TabButton onClick={() => setActiveTab('stories')} isActive={activeTab === 'stories'}>
            Stories
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
