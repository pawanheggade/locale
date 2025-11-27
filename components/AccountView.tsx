
import React, { useState, useMemo, useEffect } from 'react';
import { Account, DisplayablePost, SocialPlatform, DisplayableForumPost } from '../types';
import { PhoneIcon, ChatBubbleBottomCenterTextIcon, EnvelopeIcon, MapPinIcon, CalendarIcon, ArchiveBoxIcon, GoogleIcon, AppleIcon, DocumentIcon } from './Icons';
import { formatMonthYear, timeSince } from '../utils/formatters';
import { SubscriptionBadge } from './SubscriptionBadge';
import { useUI } from '../contexts/UIContext';
import { TabButton } from './ui/Button';
import { Avatar } from './Avatar';
import { PostList } from './PostList';
import { ReferralCard } from './ReferralCard';
import { EmptyState } from './EmptyState';
import { useForum } from '../contexts/ForumContext';
import { usePostActions } from '../contexts/PostActionsContext';
import { ProfileActions } from './ProfileActions';

interface AccountViewProps {
  account: Account;
  currentAccount: Account | null;
  posts: DisplayablePost[];
  onEditAccount: (account: Account) => void;
  archivedPosts: DisplayablePost[];
  allAccounts: Account[];
  isLiked: boolean;
  onToggleLike: (account: Account) => void;
  onShowOnMap: (account: Account) => void;
  isGeocoding: boolean;
  onOpenAnalytics: () => void;
}

const ForumPostRow: React.FC<{ post: DisplayableForumPost; onClick: () => void; }> = ({ post, onClick }) => (
    <div
        onClick={onClick}
        className="bg-gray-50/50 rounded-lg p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-100 transition-colors border"
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
                <span>{timeSince(post.timestamp)}</span>
                <span className="flex items-center gap-1.5"><ChatBubbleBottomCenterTextIcon className="w-3 h-3" /> {post.commentCount}</span>
                <span className="font-medium px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">{post.category}</span>
            </div>
        </div>
    </div>
);

export const AccountView: React.FC<AccountViewProps> = ({ account, currentAccount, posts, onEditAccount, archivedPosts, allAccounts, isLiked, onToggleLike, onShowOnMap, isGeocoding, onOpenAnalytics }) => {
  const { addToast, openModal } = useUI();
  const { posts: allForumPosts } = useForum();
  const { onViewForumPost } = usePostActions();
  
  const isOwnAccount = !!currentAccount && account.id === currentAccount.id;

  // --- DATA PREPARATION ---
  const accountPosts = useMemo(() => posts.filter(post => post.authorId === account.id), [posts, account.id]);
  const userForumPosts = useMemo(() => allForumPosts.filter(post => post.authorId === account.id).sort((a, b) => b.timestamp - a.timestamp), [allForumPosts, account.id]);
  const pinnedPosts = useMemo(() => accountPosts.filter(p => p.isPinned), [accountPosts]);
  const accountArchivedPosts = useMemo(() => isOwnAccount ? archivedPosts.filter(post => post.authorId === account.id) : [], [archivedPosts, account.id, isOwnAccount]);
  const isBusinessAccount = account.subscription.tier === 'Business' || account.subscription.tier === 'Organisation';
  const salePosts = useMemo(() => isBusinessAccount ? accountPosts.filter(p => p.salePrice !== undefined && p.price && p.price > p.salePrice) : [], [isBusinessAccount, accountPosts]);
  const postCategories = useMemo(() => isBusinessAccount ? Array.from(new Set(accountPosts.map(p => p.category))).sort() : [], [isBusinessAccount, accountPosts]);
  const canHaveCatalog = account.subscription.tier !== 'Personal' && account.subscription.tier !== 'Basic';
  const hasCatalogContent = account.catalog && account.catalog.length > 0;
  
  // --- TAB MANAGEMENT ---
  const availableTabs = useMemo(() => {
    const tabs = [];
    
    // The main posts tab is always an option, though might be empty.
    tabs.push({ id: 'all', label: 'Posts' });

    if (pinnedPosts.length > 0) {
        tabs.unshift({ id: 'pins', label: 'Pins' }); // Add to the front
    }
    
    if (userForumPosts.length > 0) {
        tabs.push({ id: 'forums', label: 'Forums' });
    }

    if (salePosts.length > 0) {
        tabs.push({ id: 'sale', label: 'Sale' });
    }

    if (hasCatalogContent) {
        tabs.push({ id: 'catalogs', label: 'Catalogs' });
    }

    if (isBusinessAccount) {
        postCategories.forEach(cat => tabs.push({ id: cat, label: cat }));
    }

    if (isOwnAccount && accountArchivedPosts.length > 0) {
        tabs.push({ id: 'archives', label: 'Archived' });
    }

    return tabs;
  }, [
    pinnedPosts.length,
    userForumPosts.length,
    salePosts.length,
    hasCatalogContent,
    isBusinessAccount,
    postCategories,
    isOwnAccount,
    accountArchivedPosts.length,
  ]);

  const [activeTab, setActiveTab] = useState<string>(() => {
    const isPersonal = account.subscription.tier === 'Personal';
    // Prioritize 'forums' for personal accounts if they have posts
    if (isPersonal && userForumPosts.length > 0) {
        return 'forums';
    }
    // Then prioritize 'pins' for anyone
    const defaultTab = availableTabs.find(t => t.id === 'pins') || availableTabs[0];
    return defaultTab?.id || 'all';
  });
  
  // Effect to select a default tab or reset if the current one disappears
  useEffect(() => {
    const isCurrentTabVisible = availableTabs.some(t => t.id === activeTab);
    if (!isCurrentTabVisible && availableTabs.length > 0) {
        const isPersonal = account.subscription.tier === 'Personal';
        // Same priority logic as initialization for resetting the tab
        if (isPersonal && userForumPosts.length > 0 && availableTabs.some(t => t.id === 'forums')) {
            setActiveTab('forums');
        } else {
            const defaultTab = availableTabs.find(t => t.id === 'pins') || availableTabs[0];
            setActiveTab(defaultTab.id);
        }
    }
  }, [availableTabs, activeTab, account.subscription.tier, userForumPosts]);

  const contactMethods = useMemo(() => {
    const subject = encodeURIComponent(`Inquiry from Locale`);
    const body = encodeURIComponent(`Hi ${account.name},\n\nI'm interested in your profile on Locale.\n\nThanks,\n${currentAccount?.name || ''}`);

    return [
        {
            key: 'message',
            icon: ChatBubbleBottomCenterTextIcon,
            href: `https://wa.me/${account.messageNumber?.replace(/\D/g, '')}`,
            isVisible: account.contactOptions?.includes('message') && !!account.messageNumber,
            label: 'Message',
            toast: 'Opening messaging app...'
        },
        {
            key: 'mobile',
            icon: PhoneIcon,
            href: `tel:${account.mobile}`,
            isVisible: account.contactOptions?.includes('mobile') && !!account.mobile,
            label: 'Call',
            toast: 'Opening phone app...'
        },
        {
            key: 'email',
            icon: EnvelopeIcon,
            href: `mailto:${account.email}?subject=${subject}&body=${body}`,
            isVisible: account.contactOptions?.includes('email') && !!account.email,
            label: 'Email',
            toast: 'Opening email client...'
        }
    ].filter(m => m.isVisible);
  }, [account, currentAccount]);

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
    if (activeTab === 'catalogs' || activeTab === 'forums') return [];
    if (activeTab === 'sale') return salePosts;
    if (activeTab === 'pins') return pinnedPosts;
    if (activeTab === 'archives') return accountArchivedPosts;
    if (activeTab === 'all') return accountPosts;
    // Category filter
    return accountPosts.filter(p => p.category === activeTab);
  }, [activeTab, salePosts, pinnedPosts, accountArchivedPosts, accountPosts]);

  const handleContactAction = (e: React.MouseEvent, method: { toast: string }) => {
      if (!currentAccount) {
          e.preventDefault();
          openModal({ type: 'login' });
          return;
      }
      addToast(method.toast, 'success');
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
              const isAbort = 
                  err.name === 'AbortError' || 
                  err.code === 20 ||
                  (typeof err.message === 'string' && (
                      err.message.toLowerCase().includes('abort') || 
                      err.message.toLowerCase().includes('cancel') ||
                      err.message.toLowerCase().includes('canceled')
                  ));
              
              if (!isAbort) {
                  console.error('Error sharing:', err);
                  addToast('Unable to open share menu.', 'error');
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
                      className="w-24 h-24 sm:w-28 sm:h-28 border-4 border-white"
                  />
                  <div className="mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{account.name}</h1>
                          <SubscriptionBadge tier={account.subscription.tier} className="mt-1" />
                      </div>
                      <p className="text-gray-600 font-medium text-sm">@{account.username}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-2">
                        <div className="flex items-center gap-1.5"><CalendarIcon className="w-4 h-4" /><span>Joined {formatMonthYear(account.joinDate)}</span></div>
                        {account.taxInfo && (<div className="flex items-center gap-1.5"><DocumentIcon className="w-4 h-4" /><span>Tax ID: {account.taxInfo}</span></div>)}
                      </div>
                  </div>
              </div>
              
              <div className="hidden sm:flex items-center justify-end gap-2 mb-1">
                  <ProfileActions 
                      isOwnAccount={isOwnAccount}
                      canHaveCatalog={canHaveCatalog}
                      onEditAccount={() => onEditAccount(account)}
                      onOpenCatalog={() => openModal({ type: 'manageCatalog' })}
                      onOpenAnalytics={onOpenAnalytics}
                      socialLinks={sortedSocialLinks}
                      onShare={handleShareProfile}
                      contactMethods={contactMethods}
                      onContactAction={handleContactAction}
                      isLiked={isLiked}
                      onToggleLike={() => onToggleLike(account)}
                      isMobile={false}
                  />
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
                                      <a href={account.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 transition-colors p-1 -m-1 rounded-full" title="Google Maps">
                                          <GoogleIcon className="w-4 h-4" />
                                      </a>
                                  )}
                                  {account.appleMapsUrl && (
                                      <a href={account.appleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 transition-colors p-1 -m-1 rounded-full" title="Apple Maps">
                                          <AppleIcon className="w-4 h-4" />
                                      </a>
                                  )}
                              </div>
                          )}
                          <div
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onShowOnMap(account); } }}
                              onClick={() => onShowOnMap(account)}
                              className="flex items-center gap-1.5 cursor-pointer text-red-400 transition-colors group min-w-0"
                          >
                              <MapPinIcon className="w-4 h-4 text-red-400 transition-colors shrink-0" />
                              <span className="group-hover:underline">{account.address}</span>
                          </div>
                      </div>
                  )}
              </div>
          </div>
          
          <div className="mt-6 flex justify-end gap-2 sm:hidden">
             <ProfileActions 
                  isOwnAccount={isOwnAccount}
                  canHaveCatalog={canHaveCatalog}
                  onEditAccount={() => onEditAccount(account)}
                  onOpenCatalog={() => openModal({ type: 'manageCatalog' })}
                  onOpenAnalytics={onOpenAnalytics}
                  socialLinks={sortedSocialLinks}
                  onShare={handleShareProfile}
                  contactMethods={contactMethods}
                  onContactAction={handleContactAction}
                  isLiked={isLiked}
                  onToggleLike={() => onToggleLike(account)}
                  isMobile={true}
              />
          </div>
          
          {isOwnAccount && account.subscription.tier === 'Personal' && (
              <div className="mt-6 border-t border-gray-100 pt-6">
                  <ReferralCard account={account} />
              </div>
          )}
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-xl border border-gray-200/80 mt-6 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex space-x-6 px-4 sm:px-6 overflow-x-auto hide-scrollbar">
              {availableTabs.map(tab => (
                  <TabButton key={tab.id} onClick={() => setActiveTab(tab.id)} isActive={activeTab === tab.id}>
                      {tab.label}
                  </TabButton>
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-6 min-h-[300px]">
            {activeTab === 'catalogs' ? (
                <div className="space-y-4 animate-fade-in">
                    {hasCatalogContent ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {account.catalog!.map((item) => (
                                <div 
                                    key={item.id} 
                                    onClick={() => openModal({ type: 'viewCatalog', data: { catalog: account.catalog! } })}
                                    className="group cursor-pointer bg-gray-50 rounded-xl border border-gray-200 overflow-hidden aspect-[3/4] flex flex-col"
                                >
                                    <div className="flex-1 bg-white flex items-center justify-center p-4 overflow-hidden relative">
                                        {item.type === 'image' ? (
                                            <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <DocumentIcon className="w-12 h-12 text-red-500 opacity-80 transition-opacity" />
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
                    <div className="space-y-4">
                        {userForumPosts.map(post => (
                            <ForumPostRow key={post.id} post={post} onClick={() => onViewForumPost(post.id)} />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="animate-fade-in">
                    {displayedPosts.length > 0 ? (
                        <PostList 
                            posts={displayedPosts} 
                            currentAccount={currentAccount}
                            isArchived={activeTab === 'archives'}
                            variant="compact"
                        />
                    ) : (
                       (activeTab === 'all' || activeTab === 'archives') && (
                           <EmptyState
                                icon={<ArchiveBoxIcon />}
                                title={activeTab === 'archives' ? "No Archived Posts" : "No Posts Yet"}
                                description={isOwnAccount 
                                    ? (activeTab === 'archives' ? "Posts you archive will appear here." : "You haven't created any posts yet.")
                                    : "This seller hasn't created any posts yet."
                                }
                                className="py-20"
                            />
                       )
                    )}
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
