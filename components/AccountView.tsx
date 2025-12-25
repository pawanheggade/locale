
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DisplayableForumPost, SocialPlatform, Account, DisplayableStoryPost } from '../types';
import { MapPinIcon, CalendarIcon, ArchiveBoxIcon, GoogleIcon, AppleIcon, DocumentIcon, ChatBubbleEllipsisIcon, ChevronDownIcon, CashIcon, HashtagIcon, PostCardIcon, VideoPostcardIcon } from './Icons';
import { formatMonthYear } from '../utils/formatters';
import { SubscriptionBadge } from './SubscriptionBadge';
import { useUI } from '../contexts/UIContext';
import { Button, TabButton } from './ui/Button';
import { Avatar } from './Avatar';
import { PostList } from './PostList';
import { ReferralCard } from './ReferralCard';
import { EmptyState } from './EmptyState';
import { useForum } from '../contexts/ForumContext';
import { useNavigation } from '../contexts/NavigationContext';
import { useAuth } from '../contexts/AuthContext';
import { ProfileActions } from './ProfileActions';
import { generateContactMethods } from '../utils/account';
import { cn, isShareAbortError } from '../lib/utils';
import { useClickOutside } from '../hooks/useClickOutside';
import { usePosts } from '../contexts/PostsContext';
import { useSwipeToNavigateTabs } from '../hooks/useSwipeToNavigateTabs';
import { SEO } from './SEO';
import { useTabAnimation } from '../hooks/useTabAnimation';
import { useStory } from '../contexts/StoryContext';
import { StoryCard } from './StoryCard';

interface ForumPostRowProps {
    post: DisplayableForumPost;
    onClick: () => void;
}

const ForumPostRow: React.FC<ForumPostRowProps> = ({ post, onClick }) => (
    <div
        onClick={onClick}
        className="bg-gray-50/50 rounded-lg p-4 flex items-center gap-4 cursor-pointer border active:scale-[0.99] transition-transform duration-100"
        role="button"
        tabIndex={0}
        onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }}}
    >
        <div className="flex flex-col items-center text-center text-gray-600 w-12">
            <div className="font-bold text-lg text-gray-900">{post.score}</div>
            <div className="text-xs">votes</div>
        </div>
        <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 truncate">{post.title}</h4>
            <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
                <span className="flex items-center gap-1.5"><ChatBubbleEllipsisIcon className="w-3 h-3" /> {post.commentCount}</span>
                <span className="font-medium px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">{post.category}</span>
            </div>
        </div>
    </div>
);

export const AccountView: React.FC = () => {
  const { openModal, gridView, isTabletOrDesktop } = useUI();
  const { posts: allForumPosts } = useForum();
  const { navigateTo, showOnMap, viewingAccount: account } = useNavigation();
  const { currentAccount, toggleLikeAccount, updateAccountDetails } = useAuth();
  const { postsByAuthorId, archivedPostsByAuthorId } = usePosts();
  const { expiredStoriesByUser } = useStory();
  
  if (!account) {
    return <div className="p-8 text-center">Account not found.</div>;
  }

  const isOwnAccount = !!currentAccount && account.id === currentAccount.id;
  const isLiked = currentAccount?.likedAccountIds?.includes(account.id) ?? false;

  // --- DATA PREPARATION ---
  const accountPosts = useMemo(() => postsByAuthorId.get(account.id) || [], [postsByAuthorId, account.id]);
  const userForumPosts = useMemo(() => allForumPosts.filter(post => post.authorId === account.id).sort((a, b) => b.timestamp - a.timestamp), [allForumPosts, account.id]);
  const accountArchivedPosts = useMemo(() => isOwnAccount ? (archivedPostsByAuthorId.get(account.id) || []) : [], [archivedPostsByAuthorId, account.id, isOwnAccount]);
  const userExpiredStories = useMemo(() => {
    if (!isOwnAccount) return [];
    return expiredStoriesByUser.get(account.id) || [];
  }, [expiredStoriesByUser, account.id, isOwnAccount]);

  const isBusinessAccount = account.subscription.tier === 'Business' || account.subscription.tier === 'Organisation';
  const isPaidTier = ['Verified', 'Business', 'Organisation'].includes(account.subscription.tier);
  
  const salePosts = useMemo(() => isPaidTier ? accountPosts.filter(p => p.salePrice !== undefined && p.price && p.price > p.salePrice) : [], [isPaidTier, accountPosts]);
  const videoPosts = useMemo(() => accountPosts.filter(p => p.media.some(m => m.type === 'video')), [accountPosts]);
  
  const postCategories = useMemo<string[]>(() => {
      if (isBusinessAccount) {
          const categories = new Set<string>(accountPosts.map(p => p.category));
          return Array.from(categories).sort();
      }
      return [];
  }, [isBusinessAccount, accountPosts]);

  const canHaveCatalog = ['Verified', 'Business', 'Organisation'].includes(account.subscription.tier);
  const hasCatalogContent = account.catalog && account.catalog.length > 0;
  
  const pinnedPosts = useMemo(() => accountPosts.filter(p => p.isPinned), [accountPosts]);
  
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  useClickOutside(categoryDropdownRef, () => setIsCategoryDropdownOpen(false), isCategoryDropdownOpen);

  // --- TAB MANAGEMENT ---
  const { availableTabs, categoryTabs } = useMemo(() => {
    const tabs: { id: string; label: string; icon: React.ReactNode }[] = [];
    const catTabs: string[] = [];
    
    // Sale Tab - Only for paid tiers
    if (isPaidTier && (isOwnAccount || salePosts.length > 0)) {
        tabs.push({ id: 'sale', label: 'Sale', icon: <CashIcon className="w-6 h-6" /> });
    }
    
    // Posts Tab
    if (isOwnAccount || accountPosts.length > 0) {
        tabs.push({ id: 'all', label: 'Posts', icon: <PostCardIcon className="w-6 h-6" /> });
    }
    
    // Videos Tab
    if (isOwnAccount || videoPosts.length > 0) {
        tabs.push({ id: 'videos', label: 'Videos', icon: <VideoPostcardIcon className="w-6 h-6" /> });
    }
    
    // Forums Tab
    if (isOwnAccount || userForumPosts.length > 0) {
        tabs.push({ id: 'forums', label: 'Forums', icon: <ChatBubbleEllipsisIcon className="w-6 h-6" /> });
    }

    // Catalogs Tab
    if (canHaveCatalog && (isOwnAccount || hasCatalogContent)) {
        tabs.push({ id: 'catalogs', label: 'Catalogs', icon: <DocumentIcon className="w-6 h-6" /> });
    }

    // Archives Tab
    if (isOwnAccount && (accountArchivedPosts.length > 0 || userExpiredStories.length > 0)) {
        tabs.push({ id: 'archives', label: 'Archived', icon: <ArchiveBoxIcon className="w-6 h-6" /> });
    }

    // Category Tabs
    if (isBusinessAccount) {
        postCategories.forEach((cat: string) => {
             if (accountPosts.some(p => p.category === cat)) {
                catTabs.push(cat);
            }
        });
    }

    return { availableTabs: tabs, categoryTabs: catTabs };
  }, [
    isPaidTier,
    isOwnAccount,
    pinnedPosts.length,
    accountPosts.length,
    userForumPosts.length,
    salePosts.length,
    videoPosts.length,
    canHaveCatalog,
    hasCatalogContent,
    isBusinessAccount,
    postCategories,
    accountArchivedPosts.length,
    userExpiredStories.length
  ]);

  const [activeTab, setActiveTab] = useState<string>('');
  const swipeRef = useRef<HTMLDivElement>(null);

  const allTabs = useMemo(() => {
      return [...availableTabs.map(t => t.id), ...categoryTabs];
  }, [availableTabs, categoryTabs]);
  
  const animationClass = useTabAnimation(activeTab, allTabs);
  
  useSwipeToNavigateTabs({
      tabs: allTabs,
      activeTab,
      setActiveTab,
      swipeRef,
      disabled: allTabs.length <= 1,
  });

  const activeTabLabel = useMemo(() => {
    const tab = availableTabs.find(t => t.id === activeTab);
    if (tab) return tab.label;
    if (categoryTabs.includes(activeTab)) return `Category: ${activeTab}`;
    return 'Profile Content';
  }, [activeTab, availableTabs, categoryTabs]);
  
  useEffect(() => {
    const isStandardTab = availableTabs.some(t => t.id === activeTab);
    const isCategoryTab = categoryTabs.some(c => c === activeTab);
    
    if ((!isStandardTab && !isCategoryTab) || !activeTab) {
        if (availableTabs.length > 0) setActiveTab(availableTabs[0].id);
        else if (categoryTabs.length > 0) setActiveTab(categoryTabs[0]);
    }
  }, [availableTabs, categoryTabs, activeTab]);

  const contactMethods = useMemo(() => generateContactMethods(account, currentAccount), [account, currentAccount]);

  const sortedSocialLinks = useMemo(() => {
      if (!account.socialLinks) return [];
      const order: SocialPlatform[] = ['website', 'youtube', 'instagram'];
      return [...account.socialLinks].sort((a, b) => {
          const indexA = order.indexOf(a.platform);
          const indexB = order.indexOf(b.platform);
          const safeIndexA = indexA === -1 ? 999 : indexA;
          const safeIndexB = indexB === -1 ? 999 : indexB;
          return safeIndexA - safeIndexB;
      });
  }, [account.socialLinks]);

  const displayedPosts = useMemo(() => {
    if (!activeTab) return [];
    if (activeTab === 'catalogs' || activeTab === 'forums' || activeTab === 'archives') return [];
    if (activeTab === 'sale') return salePosts;
    if (activeTab === 'videos') return videoPosts;
    if (activeTab === 'all') {
        return [...accountPosts].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return b.lastUpdated - a.lastUpdated;
        });
    }
    // Category filter
    return accountPosts.filter(p => p.category === activeTab);
  }, [activeTab, salePosts, videoPosts, accountPosts, pinnedPosts]);

  const handleContactAction = (e: React.MouseEvent, method: { toast: string }) => {
      if (!currentAccount) {
          e.preventDefault();
          openModal({ type: 'login' });
          return;
      }
  };

  const handleUpdateAccount = (updatedFields: Partial<Account>) => {
    if (!account) return;
    updateAccountDetails({ ...account, ...updatedFields });
  };

  const handleShareProfile = async () => {
      const profileUrl = `${window.location.origin}/?account=${account.id}`;
      if (navigator.share) {
          try {
              await navigator.share({
                  title: `Check out ${account.name} on Locale`,
                  url: profileUrl,
              });
          } catch (err: any) {
              if (!isShareAbortError(err)) {
                  console.error('Error sharing:', err);
              }
          }
      } else {
          openModal({ type: 'profileQR', data: account });
      }
  };

  const handleExpiredStoryClick = (story: DisplayableStoryPost) => {
    if (!story.author) return;
    openModal({
        type: 'storyViewer',
        data: {
            usersWithStories: [story.author],
            initialUserIndex: 0,
            initialStoryId: story.id,
            source: 'all',
        },
    });
  };

  const renderContent = () => {
    switch (activeTab) {
        case 'archives':
            return (
                <div className="space-y-8">
                    {accountArchivedPosts.length > 0 && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Archived Posts</h2>
                            <PostList 
                                posts={accountArchivedPosts} 
                                isArchived={true}
                                variant={isTabletOrDesktop ? gridView : 'default'}
                            />
                        </div>
                    )}
                    {userExpiredStories.length > 0 && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Expired Stories</h2>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                                {userExpiredStories.map(story => (
                                    <StoryCard key={story.id} story={story} onClick={() => handleExpiredStoryClick(story)} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            );
        case 'catalogs':
            return (
                <div className="space-y-4">
                    {hasCatalogContent ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {account.catalog!.map((item) => (
                                <div 
                                    key={item.id} 
                                    onClick={() => openModal({ type: 'viewCatalog', data: { catalog: account.catalog!, accountId: account.id } })}
                                    className="group cursor-pointer bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden aspect-[3/4] flex flex-col active:scale-[0.98] transition-transform duration-100"
                                >
                                    <div className="flex-1 bg-white flex items-center justify-center p-4 overflow-hidden relative">
                                        {item.type === 'image' ? (
                                            <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <DocumentIcon className="w-12 h-12 text-[#123456] opacity-80" />
                                        )}
                                    </div>
                                    <div className="p-3 border-t border-gray-100 bg-white relative z-10">
                                        <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={<DocumentIcon />}
                            title="No Catalog Items"
                            description={isOwnAccount ? "Add items to your catalog using the 'Manage Catalog' button in your profile header." : "This seller hasn't added any catalog items yet."}
                            className="bg-white rounded-xl"
                        />
                    )}
                </div>
            );
        case 'forums':
            return (
                <div>
                    {userForumPosts.length > 0 ? (
                        <div className="space-y-4">
                            {userForumPosts.map(post => (
                                <ForumPostRow key={post.id} post={post} onClick={() => navigateTo('forumPostDetail', { forumPostId: post.id })} />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={<ChatBubbleEllipsisIcon />}
                            title="No Forum Discussions"
                            description={isOwnAccount ? "Start a discussion in the forums to see it here." : "This user hasn't started any discussions yet."}
                            className="bg-white rounded-xl"
                        />
                    )}
                </div>
            );
        default:
             return (
                <div>
                    {displayedPosts.length > 0 ? (
                        <PostList 
                            posts={displayedPosts} 
                            isArchived={activeTab === 'archives'}
                            variant={isTabletOrDesktop ? gridView : 'default'}
                        />
                    ) : (
                    (activeTab === 'all' || activeTab === 'archives' || activeTab === 'sale' || activeTab === 'videos') && activeTab ? (
                        <EmptyState
                            icon={
                                activeTab === 'archives' ? <ArchiveBoxIcon /> :
                                activeTab === 'videos' ? <VideoPostcardIcon /> :
                                <PostCardIcon />
                            }
                            title={
                                activeTab === 'archives' ? "No Archived Posts" :
                                activeTab === 'sale' ? "No Items on Sale" :
                                activeTab === 'videos' ? "No Videos" :
                                "No Posts Yet"
                            }
                            description={isOwnAccount 
                                ? (
                                    activeTab === 'archives' ? "Posts you archive will appear here." :
                                    activeTab === 'sale' ? "Items you put on sale will appear here." :
                                    activeTab === 'videos' ? "Your posts that contain videos will appear here." :
                                    "You haven't created any posts yet."
                                  )
                                : (
                                    activeTab === 'sale' ? "This seller has no items on sale right now." :
                                    activeTab === 'videos' ? "This user has no video posts." :
                                    "This seller hasn't created any posts yet."
                                  )
                            }
                            className="py-20"
                        />
                    ) : (
                        <EmptyState
                            icon={<PostCardIcon />}
                            title={`No items in ${activeTab}`}
                            description={isOwnAccount ? `You don't have any items in this category.` : `This seller has no items in this category.`}
                            className="py-20"
                        />
                    )
                    )}
                </div>
            );
    }
  }

  return (
    <article className="pb-20 bg-gray-50 min-h-[calc(100vh-4rem)] animate-fade-in">
      <SEO 
        title={account.name}
        description={account.description || `Check out ${account.name}'s profile on Locale.`}
        image={account.avatarUrl}
        type="profile"
      />
      <header>
          {/* Banner Section */}
          <div className="relative h-40 sm:h-60 w-full bg-gray-200 overflow-hidden">
            {account.bannerUrl ? (
              <img src={account.bannerUrl} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400"></div>
            )}
          </div>

          {/* Profile Header Section - Full Width */}
          <div className="bg-white border-b border-gray-200/80 shadow-sm relative z-10">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
                <div className="flex items-center gap-5 -mt-12 sm:-mt-16 mb-6">
                     {/* Avatar */}
                     <div className="shrink-0 relative z-20">
                        <Avatar 
                            src={account.avatarUrl} 
                            alt={account.name} 
                            tier={account.subscription.tier} 
                            className="w-28 h-28 sm:w-36 sm:h-36 border-4 border-white cursor-pointer bg-white rounded-full shadow-md active:scale-95 transition-transform"
                            onClick={() => openModal({ type: 'profileQR', data: account })}
                        />
                     </div>

                     {/* Name and Info */}
                     <div className="flex-1 min-w-0 w-full">
                          <div className="flex flex-col items-start gap-0.5">
                              <div className="flex items-center flex-wrap gap-x-2">
                                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{account.name}</h1>
                              </div>
                              
                              <div className="flex items-center gap-2 text-gray-600">
                                 <p className="font-medium text-sm">@{account.username}</p>
                                 <SubscriptionBadge tier={account.subscription.tier} />
                              </div>

                              <div className="flex flex-col items-start gap-1 text-sm text-gray-600 mt-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <CalendarIcon className="w-4 h-4 text-gray-600" />
                                    <span>Joined {formatMonthYear(account.joinDate)}</span>
                                  </div>
                                  {account.taxInfo && (
                                    <div className="flex items-center gap-1.5">
                                        <DocumentIcon className="w-4 h-4 text-gray-600" />
                                        <span>Tax ID: {account.taxInfo}</span>
                                    </div>
                                  )}
                              </div>
                          </div>
                     </div>
                </div>

                {/* Description, Location, and Actions */}
                <div className="space-y-6">
                    {account.description && (
                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{account.description}</p>
                    )}
                    
                    {account.address && (
                        <div className="flex items-center gap-3">
                             {(account.googleMapsUrl || account.appleMapsUrl) && (
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {account.googleMapsUrl && (
                                        <a href={account.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:text-red-700 p-1 -m-1 rounded-full transition-colors active:scale-90" title="Google Maps">
                                            <GoogleIcon className="w-4 h-4" />
                                        </a>
                                    )}
                                    {account.appleMapsUrl && (
                                        <a href={account.appleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:text-red-700 p-1 -m-1 rounded-full transition-colors active:scale-90" title="Apple Maps">
                                            <AppleIcon className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>
                            )}
                            <div
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showOnMap(account); } }}
                                onClick={(e) => { 
                                    e.preventDefault();
                                    e.stopPropagation(); 
                                    showOnMap(account); 
                                }}
                                className={cn(
                                    "flex items-center gap-1.5 group min-w-0",
                                    account.coordinates ? "cursor-pointer text-red-600 hover:text-red-700 font-medium active:scale-95 transition-transform origin-left" : "cursor-default text-gray-400"
                                )}
                                title={account.coordinates ? "Show on map" : "No map location available"}
                            >
                                <MapPinIcon className="w-4 h-4 shrink-0" />
                                <span className="truncate">{account.address}</span>
                            </div>
                        </div>
                    )}
                    
                    <div>
                        <ProfileActions
                            account={account}
                            isOwnAccount={isOwnAccount}
                            socialLinks={sortedSocialLinks}
                            onShare={handleShareProfile}
                            contactMethods={contactMethods}
                            onContactAction={handleContactAction}
                            isLiked={isLiked}
                            onToggleLike={() => {
                                if (currentAccount) {
                                    toggleLikeAccount(account.id);
                                } else {
                                    openModal({ type: 'login' });
                                }
                            }}
                            onUpdateAccount={handleUpdateAccount}
                        />
                    </div>
                </div>
                
                {isOwnAccount && account.subscription.tier !== 'Personal' && (
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <ReferralCard account={account} />
                    </div>
                )}
            </div>
          </div>
      </header>
      
      {/* Content Section */}
      {(availableTabs.length > 0 || categoryTabs.length > 0) && (
        <>
          <div className="border-b border-gray-200/80 bg-white">
            <nav className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Profile content navigation">
              <div className="flex items-center justify-between">
                  <div className="flex justify-around overflow-x-auto hide-scrollbar flex-1 py-0 no-scrollbar" role="tablist">
                      {availableTabs.map(tab => (
                          <TabButton
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id)}
                              isActive={activeTab === tab.id}
                              title={tab.label}
                              className="px-3 sm:px-4"
                          >
                              {tab.icon}
                          </TabButton>
                      ))}
                  </div>
                  {categoryTabs.length > 0 && (
                      <div className="flex-shrink-0 py-2 relative" ref={categoryDropdownRef}>
                          <TabButton 
                              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                              isActive={categoryTabs.some(c => c === activeTab)}
                              className="gap-1 px-3"
                              title="Categories"
                              aria-label="Categories"
                          >
                              <HashtagIcon className="w-6 h-6" />
                              <ChevronDownIcon className={`w-4 h-4 ml-1 transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                          </TabButton>
                          
                          {isCategoryDropdownOpen && (
                              <div className="absolute top-full right-0 mt-2 w-auto bg-white rounded-xl shadow-lg border border-gray-100 z-30 py-1 animate-fade-in-up origin-top-right">
                                  {categoryTabs.map(cat => (
                                      <button
                                          key={cat}
                                          onClick={() => {
                                              setActiveTab(cat);
                                              setIsCategoryDropdownOpen(false);
                                          }}
                                          className={cn(
                                              "w-full text-left px-4 py-2 text-sm whitespace-nowrap active:bg-gray-100 transition-colors hover:bg-red-600 hover:text-white",
                                              activeTab === cat ? "text-white font-semibold bg-red-600" : "text-gray-700"
                                          )}
                                      >
                                          {cat}
                                      </button>
                                  ))}
                              </div>
                          )}
                      </div>
                  )}
              </div>
            </nav>
          </div>
          <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-6" aria-labelledby="profile-content-heading">
            <h2 id="profile-content-heading" className="sr-only">{activeTabLabel}</h2>
            <div ref={swipeRef} className="min-h-[300px] relative overflow-x-hidden">
                <div key={activeTab} className={animationClass}>
                    {renderContent()}
                </div>
            </div>
          </section>
        </>
      )}
    </article>
  );
};
