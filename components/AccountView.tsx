import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Account, DisplayablePost, SocialPlatform, DisplayableForumPost } from '../types';
import { MapPinIcon, CalendarIcon, ArchiveBoxIcon, GoogleIcon, AppleIcon, DocumentIcon, ChatBubbleEllipsisIcon, ChevronDownIcon, CashIcon, HashtagIcon, Squares2X2Icon } from './Icons';
import { formatMonthYear, timeSince } from '../utils/formatters';
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
import { cn } from '../lib/utils';
import { useClickOutside } from '../hooks/useClickOutside';
import { isShareAbortError } from '../lib/utils';
import { usePosts } from '../contexts/PostsContext';

interface AccountViewProps {
  account: Account;
}

const ForumPostRow: React.FC<{ post: DisplayableForumPost; onClick: () => void; }> = ({ post, onClick }) => (
    <div
        onClick={onClick}
        className="bg-gray-50/50 rounded-lg p-4 flex items-center gap-4 cursor-pointer border"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }}}
    >
        <div className="flex flex-col items-center text-center text-gray-600 w-12">
            <div className="font-bold text-lg text-gray-800">{post.score}</div>
            <div className="text-xs">votes</div>
        </div>
        <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-800 truncate">{post.title}</h4>
            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                <span className="flex items-center gap-1.5"><ChatBubbleEllipsisIcon className="w-3 h-3" /> {post.commentCount}</span>
                <span className="font-medium px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">{post.category}</span>
            </div>
        </div>
    </div>
);

// FIX: Refactor component to use contexts and only accept `account` prop.
export const AccountView: React.FC<AccountViewProps> = ({ account }) => {
  const { openModal, gridView, isTabletOrDesktop } = useUI();
  const { posts: allForumPosts } = useForum();
  const { navigateTo, showOnMap } = useNavigation();
  const { currentAccount, toggleLikeAccount } = useAuth();
  const { posts, archivedPosts } = usePosts();
  
  const isOwnAccount = !!currentAccount && account.id === currentAccount.id;
  const isLiked = currentAccount?.likedAccountIds?.includes(account.id) ?? false;

  // --- DATA PREPARATION ---
  const accountPosts = useMemo(() => posts.filter(post => post.authorId === account.id), [posts, account.id]);
  const userForumPosts = useMemo(() => allForumPosts.filter(post => post.authorId === account.id).sort((a, b) => b.timestamp - a.timestamp), [allForumPosts, account.id]);
  const accountArchivedPosts = useMemo(() => isOwnAccount ? archivedPosts.filter(post => post.authorId === account.id) : [], [archivedPosts, account.id, isOwnAccount]);
  const isBusinessAccount = account.subscription.tier === 'Business' || account.subscription.tier === 'Organisation';
  const isPaidTier = ['Verified', 'Business', 'Organisation'].includes(account.subscription.tier);
  
  const salePosts = useMemo(() => isPaidTier ? accountPosts.filter(p => p.salePrice !== undefined && p.price && p.price > p.salePrice) : [], [isPaidTier, accountPosts]);
  const postCategories = useMemo(() => isBusinessAccount ? Array.from(new Set(accountPosts.map(p => p.category))).sort() : [], [isBusinessAccount, accountPosts]);
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
        tabs.push({ id: 'all', label: 'Posts', icon: <Squares2X2Icon className="w-6 h-6" /> });
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
    if (isOwnAccount && accountArchivedPosts.length > 0) {
        tabs.push({ id: 'archives', label: 'Archived', icon: <ArchiveBoxIcon className="w-6 h-6" /> });
    }

    // Category Tabs
    if (isBusinessAccount) {
        postCategories.forEach(cat => {
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
    canHaveCatalog,
    hasCatalogContent,
    isBusinessAccount,
    postCategories,
    accountArchivedPosts.length,
  ]);

  const [activeTab, setActiveTab] = useState<string>('');
  
  useEffect(() => {
    const isStandardTab = availableTabs.some(t => t.id === activeTab);
    const isCategoryTab = categoryTabs.includes(activeTab);
    
    if ((!isStandardTab && !isCategoryTab) || !activeTab) {
        if (availableTabs.length > 0) setActiveTab(availableTabs[0].id);
        else if (categoryTabs.length > 0) setActiveTab(categoryTabs[0]);
    }
  }, [availableTabs, categoryTabs, activeTab]);

  const contactMethods = useMemo(() => generateContactMethods(account, currentAccount), [account, currentAccount]);

  const sortedSocialLinks = useMemo(() => {
      if (!account.socialLinks) return [];
      const order: SocialPlatform[] = ['website', 'youtube', 'instagram', 'facebook', 'twitter'];
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
    if (activeTab === 'catalogs' || activeTab === 'forums') return [];
    if (activeTab === 'sale') return salePosts;
    if (activeTab === 'archives') return accountArchivedPosts;
    if (activeTab === 'all') {
        return [...accountPosts].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return b.lastUpdated - a.lastUpdated;
        });
    }
    // Category filter
    return accountPosts.filter(p => p.category === activeTab);
  }, [activeTab, salePosts, accountArchivedPosts, accountPosts, pinnedPosts]);

  const handleContactAction = (e: React.MouseEvent, method: { toast: string }) => {
      if (!currentAccount) {
          e.preventDefault();
          openModal({ type: 'login' });
          return;
      }
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

  return (
    <div className="pb-20 bg-gray-50 min-h-screen animate-fade-in">
      {/* Banner Section */}
      <div className="relative h-40 sm:h-60 w-full bg-gray-200 overflow-hidden">
        {account.bannerUrl ? (
          <img src={account.bannerUrl} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400"></div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Profile Header Card */}
        <div className="relative bg-white rounded-xl p-4 sm:p-6 mt-6 border border-gray-200/80">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-end sm:justify-between">
              
              <div className="flex items-end gap-4">
                  <Avatar 
                      src={account.avatarUrl} 
                      alt={account.name} 
                      tier={account.subscription.tier} 
                      className="w-24 h-24 sm:w-28 sm:h-28 border-4 border-white cursor-pointer"
                      onClick={() => openModal({ type: 'profileQR', data: account })}
                  />
                  <div className="mb-1">
                      <div className="flex items-center gap-3 flex-wrap">
                          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight -mb-1">{account.name}</h1>
                          {isOwnAccount && (
                              <Button
                                  onClick={() => navigateTo('subscription')}
                                  variant="ghost"
                                  size="xs"
                                  className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 border-amber-200 rounded-full h-5 px-2 mb-1"
                              >
                                  Subscription
                              </Button>
                          )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-gray-600 font-medium text-sm">@{account.username}</p>
                        <SubscriptionBadge tier={account.subscription.tier} />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-2">
                        <div className="flex items-center gap-1.5"><CalendarIcon className="w-4 h-4" /><span>Joined {formatMonthYear(account.joinDate)}</span></div>
                        {account.taxInfo && (<div className="flex items-center gap-1.5"><DocumentIcon className="w-4 h-4" /><span>Tax ID: {account.taxInfo}</span></div>)}
                      </div>
                  </div>
              </div>
              
          </div>
          
          <div className="mt-4">
              {account.description && (
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-4">{account.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
                  {account.address && (
                      <div className="flex items-center gap-3 min-w-0">
                           {(account.googleMapsUrl || account.appleMapsUrl) && (
                              <div className="flex items-center gap-1.5 shrink-0">
                                  {account.googleMapsUrl && (
                                      <a href={account.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 p-1 -m-1 rounded-full" title="Google Maps">
                                          <GoogleIcon className="w-4 h-4" />
                                      </a>
                                  )}
                                  {account.appleMapsUrl && (
                                      <a href={account.appleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 p-1 -m-1 rounded-full" title="Apple Maps">
                                          <AppleIcon className="w-4 h-4" />
                                      </a>
                                  )}
                              </div>
                          )}
                          <div
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showOnMap(account); } }}
                              onClick={() => showOnMap(account)}
                              className="flex items-center gap-1.5 cursor-pointer text-red-400 group min-w-0"
                          >
                              <MapPinIcon className="w-4 h-4 shrink-0" />
                              <span className="">{account.address}</span>
                          </div>
                      </div>
                  )}
              </div>
          </div>
          
          <div className="mt-6 relative z-20">
             <ProfileActions
                  account={account}
                  isOwnAccount={isOwnAccount}
                  canHaveCatalog={canHaveCatalog}
                  onEditAccount={() => navigateTo('editProfile', { account })}
                  onOpenCatalog={() => navigateTo('manageCatalog', { account })}
                  onOpenAnalytics={() => navigateTo('accountAnalytics', { account })}
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
              />
          </div>
          
          {isOwnAccount && account.subscription.tier !== 'Personal' && (
              <div className="mt-6 border-t border-gray-100 pt-6">
                  <ReferralCard account={account} />
              </div>
          )}
        </div>

        {/* Content Section */}
        {(availableTabs.length > 0 || categoryTabs.length > 0) && (
            <div className="bg-white rounded-xl border border-gray-200/80 mt-6">
                <div className="border-b border-gray-200 flex items-center justify-between pl-4 sm:pl-6 pr-2 sm:pr-4">
                    <div className="flex justify-around overflow-x-auto hide-scrollbar flex-1 py-0 no-scrollbar">
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
                                isActive={categoryTabs.includes(activeTab)}
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
                                                "w-full text-left px-4 py-2 text-sm whitespace-nowrap",
                                                activeTab === cat ? "text-red-600 font-semibold bg-red-50" : "text-gray-700"
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

                <div className="p-4 sm:p-6 min-h-[300px]">
                    {activeTab === 'catalogs' ? (
                        <div className="space-y-4 animate-fade-in">
                            {hasCatalogContent ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {account.catalog!.map((item) => (
                                        <div 
                                            key={item.id} 
                                            onClick={() => openModal({ type: 'viewCatalog', data: { catalog: account.catalog!, accountId: account.id } })}
                                            className="group cursor-pointer bg-gray-50 rounded-xl border border-gray-200 overflow-hidden aspect-[3/4] flex flex-col"
                                        >
                                            <div className="flex-1 bg-white flex items-center justify-center p-4 overflow-hidden relative">
                                                {item.type === 'image' ? (
                                                    <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <DocumentIcon className="w-12 h-12 text-red-500 opacity-80" />
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
                                    className="bg-gray-50 rounded-xl"
                                />
                            )}
                        </div>
                    ) : activeTab === 'forums' ? (
                        <div className="animate-fade-in">
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
                                    className="bg-gray-50 rounded-xl"
                                />
                            )}
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            {displayedPosts.length > 0 ? (
                                <PostList 
                                    posts={displayedPosts} 
                                    isArchived={activeTab === 'archives'}
                                    variant={isTabletOrDesktop ? gridView : 'default'}
                                />
                            ) : (
                            (activeTab === 'all' || activeTab === 'archives' || activeTab === 'sale') && activeTab ? (
                                <EmptyState
                                    icon={activeTab === 'archives' ? <ArchiveBoxIcon /> : <Squares2X2Icon />}
                                    title={
                                        activeTab === 'archives' ? "No Archived Posts" :
                                        activeTab === 'sale' ? "No Items on Sale" : "No Posts Yet"
                                    }
                                    description={isOwnAccount 
                                        ? (
                                            activeTab === 'archives' ? "Posts you archive will appear here." :
                                            activeTab === 'sale' ? "Items you put on sale will appear here." : "You haven't created any posts yet."
                                          )
                                        : (
                                            activeTab === 'sale' ? "This seller has no items on sale right now." : "This seller hasn't created any posts yet."
                                          )
                                    }
                                    className="py-20"
                                />
                            ) : (
                                <EmptyState
                                    icon={<Squares2X2Icon />}
                                    title={`No items in ${activeTab}`}
                                    description={isOwnAccount ? `You don't have any items in this category.` : `This seller has no items in this category.`}
                                    className="py-20"
                                />
                            )
                            )}
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
