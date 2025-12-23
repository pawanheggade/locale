
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
import { Avatar } from './Avatar';
import { cn } from '../lib/utils';

type LikedTab = 'profiles' | 'posts' | 'stories';

const LikedStoryCard: React.FC<{ story: DisplayableStoryPost; onClick: () => void; }> = ({ story, onClick }) => (
    <div
        className="relative aspect-[9/16] bg-gray-100 rounded-xl overflow-hidden cursor-pointer group"
        onClick={onClick}
    >
        {story.media.type === 'image' ? (
            <img src={story.media.url} alt={`Story by ${story.author?.name}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
        ) : (
             <video src={story.media.url} className="w-full h-full object-cover" muted playsInline />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {story.author && (
            <div className="absolute bottom-2 left-2 flex items-center gap-2">
                <Avatar src={story.author.avatarUrl} alt={story.author.name} size="xs" />
                <span className="text-white text-xs font-bold drop-shadow">{story.author.name}</span>
            </div>
        )}
    </div>
);

export const LikesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LikedTab>('profiles');
  const { isTabletOrDesktop } = useUI();
  const { currentAccount, likedPostIds } = useAuth();
  const { posts: allPosts } = usePosts();
  const { activeStories } = useStory();
  const { openModal } = useUI();

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
    switch (activeTab) {
        case 'profiles':
            return postsFromLikedProfiles.length === 0 ? (
                <EmptyState icon={<UserIcon />} title="No Posts from Liked Profiles" description="Posts from sellers you like will appear here. Like some profiles to get started!" className="py-20" />
            ) : (
                <PostList posts={postsFromLikedProfiles} />
            );
        case 'posts':
            return likedPosts.length === 0 ? (
                <EmptyState icon={<HeartIcon />} title="No Liked Posts Yet" description="Tap the heart on posts you love to save them here." className="py-20" />
            ) : (
                <PostList posts={likedPosts} />
            );
        case 'stories':
            return likedStories.length === 0 ? (
                <EmptyState icon={<VideoPostcardIcon />} title="No Liked Stories" description="Stories you like will appear here." className="py-20" />
            ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                    {likedStories.map(story => (
                        <LikedStoryCard key={story.id} story={story} onClick={() => handleLikedStoryClick(story)} />
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
