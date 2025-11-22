
import React, { useState, useMemo, useEffect } from 'react';
import { Account, DisplayablePost, SocialLink, SocialPlatform } from '../types';
import { PostList } from './PostList';
import { PhoneIcon, ChatBubbleBottomCenterTextIcon, EnvelopeIcon, PencilIcon, ArchiveBoxIcon, HeartIcon, MapPinIcon, SpinnerIcon, ChartBarIcon, Square2StackIcon, FacebookIcon, XIcon, InstagramIcon, YouTubeIcon, GlobeAltIcon, WalletIcon, ShoppingBagIcon, DocumentDuplicateIcon, CheckIcon } from './Icons';
import { formatMonthYear, formatDaysRemaining } from '../utils/formatters';
import { SubscriptionBadge } from './SubscriptionBadge';
import { useUI } from '../contexts/UIContext';
import { TabButton, Button } from './ui/Button';
import { ReferralCard } from './ReferralCard';
import { cn } from '../lib/utils';
import { Avatar } from './Avatar';

interface AccountViewProps {
  account: Account;
  currentAccount: Account | null;
  posts: DisplayablePost[];
  onEditAccount: (account: Account) => void;
  archivedPosts: DisplayablePost[];
  allAccounts: Account[];
  isLiked: boolean;
  onToggleLike: (accountId: string) => void;
  onShowOnMap: (account: Account) => void;
  isGeocoding: boolean;
  onOpenAnalytics: () => void;
}

const SocialLinkButton: React.FC<{ link: SocialLink }> = ({ link }) => {
    let Icon = GlobeAltIcon;
    let colorClass = 'text-gray-600';

    switch (link.platform) {
        case 'facebook': Icon = FacebookIcon; colorClass = 'text-blue-600'; break;
        case 'twitter': Icon = XIcon; colorClass = 'text-black'; break;
        case 'instagram': Icon = InstagramIcon; colorClass = 'text-pink-600'; break;
        case 'youtube': Icon = YouTubeIcon; colorClass = 'text-red-600'; break;
        case 'website': Icon = GlobeAltIcon; colorClass = 'text-gray-600'; break;
    }

    return (
        <Button 
            as="a"
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            variant="glass"
            size="icon-sm"
            className={colorClass}
        >
            <Icon className="w-5 h-5" />
        </Button>
    );
};

export const AccountView: React.FC<AccountViewProps> = ({ account, currentAccount, posts, onEditAccount, archivedPosts, allAccounts, isLiked, onToggleLike, onShowOnMap, isGeocoding, onOpenAnalytics }) => {
  const { addToast, openModal } = useUI();
  const [isAnimatingLike, setIsAnimatingLike] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const isOwnAccount = !!currentAccount && account.id === currentAccount.id;

  const accountPosts = useMemo(() => {
    return posts.filter(post => post.authorId === account.id);
  }, [posts, account.id]);
  
  const pinnedPosts = useMemo(() => {
    return accountPosts.filter(p => p.isPinned);
  }, [accountPosts]);

  const accountArchivedPosts = useMemo(() => {
    if (!isOwnAccount) return [];
    return archivedPosts.filter(post => post.authorId === account.id);
  }, [archivedPosts, account.id, isOwnAccount]);
  
  const isBusinessAccount = account.subscription.tier === 'Business' || account.subscription.tier === 'Business Pro';
  const isSellerAccount = account.subscription.tier !== 'Personal';

  const salePosts = useMemo(() => {
    if (!isBusinessAccount) return [];
    return accountPosts.filter(p => p.salePrice !== undefined && p.price && p.price > p.salePrice);
  }, [isBusinessAccount, accountPosts]);

  const postCategories = useMemo(() => {
    if (!isBusinessAccount) {
        return [];
    }
    const categories = new Set(accountPosts.map(p => p.category));
    return Array.from(categories).sort();
  }, [isBusinessAccount, accountPosts]);

  const categoryCounts = useMemo(() => {
    if (!isBusinessAccount) return new Map();
    const counts = new Map<string, number>();
    for (const post of accountPosts) {
        counts.set(post.category, (counts.get(post.category) || 0) + 1);
    }
    return counts;
  }, [isBusinessAccount, accountPosts]);
  
  const canHaveCatalog = account.subscription.tier !== 'Personal' && account.subscription.tier !== 'Basic';
  const hasCatalogContent = account.catalog && account.catalog.length > 0;
  
  // Tab Visibility Logic
  const showCatalogTab = canHaveCatalog && hasCatalogContent;
  const showSaleTab = isBusinessAccount && salePosts.length > 0;
  const showPinsTab = pinnedPosts.length > 0;
  const showArchivesTab = isOwnAccount && accountArchivedPosts.length > 0;
  const showPostsTab = accountPosts.length > 0;
  
  const hasAnyTab = showCatalogTab || showSaleTab || showPinsTab || showArchivesTab || showPostsTab || (isBusinessAccount && postCategories.length > 0);

  const [activeTab, setActiveTab] = useState<string>(() => {
    if (hasCatalogContent) return 'catalogue';
    if (showSaleTab) return 'sale';
    if (showPinsTab) return 'pins';
    return 'all';
  });

  // Ensure activeTab is valid when props change
  useEffect(() => {
    if (activeTab === 'catalogue' && !showCatalogTab) {
        setActiveTab('all');
    }
    if (activeTab === 'sale' && !showSaleTab) {
      setActiveTab(showPinsTab ? 'pins' : 'all');
    }
    if (activeTab === 'pins' && !showPinsTab) {
        setActiveTab('all');
    }
    if (activeTab === 'archives' && !showArchivesTab) {
        setActiveTab('all');
    }
    if (isBusinessAccount && activeTab !== 'sale' && activeTab !== 'pins' && activeTab !== 'all' && activeTab !== 'archives' && activeTab !== 'catalogue' && !postCategories.includes(activeTab)) {
        setActiveTab('all');
    }
  }, [showCatalogTab, showSaleTab, showPinsTab, showArchivesTab, activeTab, isBusinessAccount, postCategories]);

  const displayedPosts = useMemo(() => {
    if (activeTab === 'catalogue') return []; // Catalogue handled separately
    if (activeTab === 'sale') return salePosts;
    if (activeTab === 'pins') return pinnedPosts;
    if (activeTab === 'archives') return accountArchivedPosts;
    if (activeTab === 'all') return accountPosts;
    if (isBusinessAccount) {
        return accountPosts.filter(p => p.category === activeTab);
    }
    return accountPosts;
  }, [activeTab, salePosts, pinnedPosts, accountArchivedPosts, accountPosts, isBusinessAccount]);

  const hasBusinessDetails = account.taxInfo || (account.paymentMethods && account.paymentMethods.length > 0) || (account.deliveryOptions && account.deliveryOptions.length > 0);

  const isOnTrial = account.subscription.isTrial && account.subscription.trialEndDate && account.subscription.trialEndDate > Date.now();

  const contactMethods = useMemo(() => {
    const subject = encodeURIComponent(`Inquiry from Locale`);
    const body = encodeURIComponent(currentAccount ? `Hi ${account.name},\n\nI'm interested in your profile on Locale.\n\n[Your message here]\n\nThanks,\n${currentAccount.name}` : `Hi ${account.name},\n\nI'm interested in your profile on Locale.`);

    return [
        {
            key: 'email' as const,
            label: 'Email',
            Icon: EnvelopeIcon,
            href: `mailto:${account.email}?subject=${subject}&body=${body}`,
            toast: 'Opening your email client...',
            isVisible: account.contactOptions?.includes('email') && !!account.email,
        },
        {
            key: 'mobile' as const,
            label: 'Call',
            Icon: PhoneIcon,
            href: `tel:${account.mobile}`,
            toast: 'Opening your phone app...',
            isVisible: account.contactOptions?.includes('mobile') && !!account.mobile,
        },
        {
            key: 'message' as const,
            label: 'Message',
            Icon: ChatBubbleBottomCenterTextIcon,
            href: `https://wa.me/${account.messageNumber?.replace(/\D/g, '')}`,
            toast: 'Opening messaging app...',
            isVisible: account.contactOptions?.includes('message') && !!account.messageNumber,
        }
    ];
  }, [account, currentAccount]);

  const availableMethods = contactMethods.filter(method => method.isVisible);
  
  const handleViewCatalog = () => {
      if (account.catalog && account.catalog.length > 0) {
          openModal({ type: 'viewCatalog', data: { catalog: account.catalog } });
      }
  };
  
  const handleManageCatalog = () => {
      openModal({ type: 'manageCatalog' });
  };

  const handleOpenQR = () => {
      if (isSellerAccount) {
          openModal({ type: 'profileQR', data: account });
      }
  };

  const handleCopyLink = () => {
    const profileUrl = `${window.location.origin}/?account=${account.id}`;
    navigator.clipboard.writeText(profileUrl).then(() => {
        setIsCopied(true);
        addToast('Profile link copied!', 'success');
        setTimeout(() => setIsCopied(false), 2000);
    });
  };

  // Sort Social Links according to requested order
  const sortedSocialLinks = useMemo(() => {
    if (!account.socialLinks) return [];
    const platformOrder: SocialPlatform[] = ['website', 'youtube', 'instagram', 'facebook', 'twitter'];
    return [...account.socialLinks].sort((a, b) => {
        const indexA = platformOrder.indexOf(a.platform);
        const indexB = platformOrder.indexOf(b.platform);
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
  }, [account.socialLinks]);

  const showContactOptions = account.subscription.tier !== 'Personal' && availableMethods.length > 0;
  const showSocialLinks = sortedSocialLinks.length > 0;
  const showBusinessDetails = hasBusinessDetails && account.subscription.tier !== 'Personal';
  
  const cardTitle = isOwnAccount ? "Manage Profile" : "Connect";

  return (
    <div className="animate-fade-in-up p-4 sm:p-6 lg:p-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Banner */}
        <div className="h-32 sm:h-48 w-full bg-gray-200 relative">
            {account.bannerUrl ? (
                <img src={account.bannerUrl} alt="Profile Banner" className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full bg-gradient-to-r from-red-100 to-amber-100"></div>
            )}
        </div>
        
        <div className="px-6 pb-6">
            <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 mt-4 mb-6">
                <div 
                    className={cn("relative group", isSellerAccount && "cursor-pointer")} 
                    onClick={isSellerAccount ? handleOpenQR : undefined} 
                    title={isSellerAccount ? "Show Profile QR Code" : undefined}
                >
                    <Avatar 
                        src={account.avatarUrl} 
                        alt={account.name} 
                        size="3xl" 
                        tier={account.subscription.tier}
                        className={cn("border-4 border-white bg-white transition-all", isSellerAccount && "group-hover:brightness-90")}
                    />
                    {isSellerAccount && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 rounded-full">
                        </div>
                    )}
                </div>
                 <div className="flex-1 text-center sm:text-left mt-2 sm:mt-0 sm:mb-2 w-full min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-between">
                        <div className="min-w-0 flex-1">
                             <div className="flex flex-row items-center gap-2 justify-center sm:justify-start">
                                <h1 className="text-2xl font-bold text-gray-800 truncate">{account.businessName || account.name}</h1>
                                <SubscriptionBadge tier={account.subscription.tier} />
                            </div>
                             <div className="flex items-center gap-2 justify-center sm:justify-start">
                                <p className="text-md text-gray-500">@{account.username}</p>
                                <button
                                    onClick={handleCopyLink}
                                    className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                                    title="Copy profile link"
                                >
                                    {isCopied ? <CheckIcon className="w-4 h-4 text-green-600" /> : <DocumentDuplicateIcon className="w-4 h-4" />}
                                </button>
                             </div>
                             <p className="text-sm text-gray-500 mt-1">Joined {formatMonthYear(account.joinDate)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bio & Details */}
            <div className="space-y-4">
                 {isOnTrial && isOwnAccount && (
                  <p className="text-sm font-semibold text-amber-700 bg-amber-50 p-2 rounded-md inline-block">
                      Trial ends in {formatDaysRemaining(currentAccount!.subscription.trialEndDate!)}
                  </p>
                )}
                
                {account.description && (
                    <p className="text-base text-gray-700 leading-relaxed">{account.description}</p>
                )}
                
                 {(account.subscription.tier !== 'Personal' && (account.address || account.googleMapsUrl || account.appleMapsUrl)) && (
                     <div className="flex flex-wrap gap-y-2 gap-x-3 text-sm text-gray-600 items-center">
                        {account.googleMapsUrl && (
                            <Button 
                                as="a"
                                href={account.googleMapsUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                variant="glass"
                                size="xs"
                                title="Open in Google Maps"
                            >
                                Google
                            </Button>
                        )}
                        
                        {account.appleMapsUrl && (
                            <Button
                                as="a" 
                                href={account.appleMapsUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                variant="glass"
                                size="xs"
                                title="Open in Apple Maps"
                            >
                                Apple
                            </Button>
                        )}

                        {account.address && (
                            <Button 
                                onClick={() => onShowOnMap(account)} 
                                disabled={isGeocoding} 
                                variant="glass" 
                                size="xs" 
                                className="gap-1.5"
                                title={isGeocoding ? 'Locating...' : 'View on Map'}
                            >
                                {isGeocoding ? <SpinnerIcon className="w-4 h-4" /> : <MapPinIcon className="w-4 h-4" />}
                                Maps
                            </Button>
                        )}

                        {account.address && (
                            <span>{account.address.split(',').slice(-2).join(', ').trim()}</span>
                        )}
                     </div>
                 )}
            </div>
        </div>
      </div>

      {/* Info Cards Grid (Connect & Business) */}
      <div className="flex flex-col md:flex-row gap-4 mt-4 w-full">
        <div className="w-full md:w-full flex flex-col items-center">
            <div className={cn("w-full flex flex-row flex-wrap items-center justify-between gap-4 p-6 bg-white rounded-lg shadow-md", showBusinessDetails ? "mb-4" : "")}>
                <h3 className="text-lg font-bold text-gray-800">{cardTitle}</h3>
                
                {/* Actions Container: Primary Actions + Catalogue Actions + Socials */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Primary Actions */}
                    {isOwnAccount ? (
                        <>
                            <Button onClick={() => onEditAccount(account)} variant="glass" size="sm" className="gap-2">
                                <PencilIcon className="w-4 h-4" />
                                <span>Edit Profile</span>
                            </Button>
                            
                            {/* Catalogue Actions (Manage/Upload Only) */}
                            {canHaveCatalog && (
                                <Button onClick={handleManageCatalog} variant="glass" size="sm" className="gap-1.5 animate-fade-in-up">
                                    <Square2StackIcon className="w-4 h-4 text-gray-600" />
                                    <span>{hasCatalogContent ? 'Manage Catalogs' : 'Upload Catalogs'}</span>
                                </Button>
                            )}

                            {(account.subscription.tier !== 'Personal' && account.subscription.tier !== 'Basic') && (
                                <Button onClick={onOpenAnalytics} variant="glass" size="sm" className="gap-2">
                                    <ChartBarIcon className="w-4 h-4" />
                                    <span>Analytics</span>
                                </Button>
                            )}
                        </>
                    ) : (
                        <Button
                            onClick={() => {
                                onToggleLike(account.id);
                                setIsAnimatingLike(true);
                                if (navigator.vibrate) {
                                    navigator.vibrate(5);
                                }
                            }}
                            onAnimationEnd={() => setIsAnimatingLike(false)}
                            variant={isLiked ? "glass-red-light" : "glass"}
                            className={cn('gap-2', isAnimatingLike && 'animate-like-pop')}
                            size="sm"
                        >
                            <HeartIcon isFilled={isLiked} className="w-4 h-4" /> {isLiked ? 'Liked' : 'Like'}
                        </Button>
                    )}

                    {/* Social Links */}
                    {showSocialLinks && sortedSocialLinks.map((link, index) => (
                        <SocialLinkButton key={index} link={link} />
                    ))}
                </div>
            
                {/* Contact Options (in Body) */}
                {showContactOptions && (
                    <div className="flex flex-wrap w-full gap-3 mt-4 pt-4 border-t border-gray-100">
                        {availableMethods.map((method) => (
                            <Button
                                key={method.key}
                                as="a"
                                href={method.href}
                                onClick={(e) => {
                                    if (!currentAccount) {
                                        e.preventDefault();
                                        openModal({ type: 'login' });
                                        return;
                                    }
                                    addToast(method.toast, 'success');
                                }}
                                target={method.key === 'message' ? '_blank' : undefined}
                                rel={method.key === 'message' ? 'noopener noreferrer' : undefined}
                                variant="glass"
                                size="sm"
                                className="gap-2 flex-1 justify-center"
                            >
                                <method.Icon className="w-4 h-4 text-red-500" />
                                <span>{method.label}</span>
                            </Button>
                        ))}
                    </div>
                )}
            </div>

            {showBusinessDetails && (
                <div className="bg-white rounded-lg shadow-md p-6 w-full">
                    <div className="flex items-center justify-between mb-4 border-b pb-2">
                        <h3 className="text-lg font-bold text-gray-800">Business Details</h3>
                        {account.taxInfo && (
                            <p className="text-sm text-gray-500 font-mono">Tax ID: {account.taxInfo}</p>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Removed Tax Info from here as it is in header */}
                        {account.paymentMethods && account.paymentMethods.length > 0 && (
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-gray-100 rounded-full shrink-0">
                                    <WalletIcon className="w-5 h-5 text-gray-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-800 text-sm">Payment Methods</h4>
                                    <p className="text-sm text-gray-600 mt-0.5">{account.paymentMethods.join(', ')}</p>
                                </div>
                            </div>
                        )}
                        {account.deliveryOptions && account.deliveryOptions.length > 0 && (
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-gray-100 rounded-full shrink-0">
                                    <ShoppingBagIcon className="w-5 h-5 text-gray-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-800 text-sm">Delivery Options</h4>
                                    <p className="text-sm text-gray-600 mt-0.5">{account.deliveryOptions.join(', ')}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>

      {isOwnAccount && account.subscription.tier !== 'Personal' && (
        <div className="mt-6">
            <ReferralCard account={account} />
        </div>
      )}

      {/* Profile Content */}
      {account.subscription.tier !== 'Personal' ? (
        <>
            {hasAnyTab && (
                <nav className="mt-6 flex space-x-2 p-1 bg-gray-100 rounded-full overflow-x-auto hide-scrollbar" role="tablist" aria-label="Profile content">
                  {showCatalogTab && (
                      <TabButton onClick={() => setActiveTab('catalogue')} isActive={activeTab === 'catalogue'}>
                          Catalogs <span className={activeTab === 'catalogue' ? "text-red-600 font-normal" : "text-gray-400 font-normal"}>({account.catalog?.length || 0})</span>
                      </TabButton>
                  )}
                  
                  {showSaleTab && (
                    <TabButton onClick={() => setActiveTab('sale')} isActive={activeTab === 'sale'}>
                      Sale <span className={activeTab === 'sale' ? "text-red-600 font-normal" : "text-gray-400 font-normal"}>({salePosts.length})</span>
                    </TabButton>
                  )}
                  {showPinsTab && (
                    <TabButton onClick={() => setActiveTab('pins')} isActive={activeTab === 'pins'}>
                      Pins <span className={activeTab === 'pins' ? "text-red-600 font-normal" : "text-gray-400 font-normal"}>({pinnedPosts.length})</span>
                    </TabButton>
                  )}

                  {isBusinessAccount ? (
                    <>
                      {showPostsTab && (
                          <TabButton onClick={() => setActiveTab('all')} isActive={activeTab === 'all'}>
                            Posts <span className={activeTab === 'all' ? "text-red-600 font-normal" : "text-gray-400 font-normal"}>({accountPosts.length})</span>
                          </TabButton>
                      )}
                      {showArchivesTab && (
                        <TabButton onClick={() => setActiveTab('archives')} isActive={activeTab === 'archives'}>
                            Archives <span className={activeTab === 'archives' ? "text-red-600 font-normal" : "text-gray-400 font-normal"}>({accountArchivedPosts.length})</span>
                        </TabButton>
                      )}
                      {postCategories.map(cat => (
                        <TabButton key={cat} onClick={() => setActiveTab(cat)} isActive={activeTab === cat}>
                          {cat} <span className={activeTab === cat ? "text-red-600 font-normal" : "text-gray-400 font-normal"}>({categoryCounts.get(cat) || 0})</span>
                        </TabButton>
                      ))}
                    </>
                  ) : (
                    <>
                      {showPostsTab && (
                          <TabButton onClick={() => setActiveTab('all')} isActive={activeTab === 'all'}>
                            Posts <span className={activeTab === 'all' ? "text-red-600 font-normal" : "text-gray-400 font-normal"}>({accountPosts.length})</span>
                          </TabButton>
                      )}
                      {showArchivesTab && (
                        <TabButton onClick={() => setActiveTab('archives')} isActive={activeTab === 'archives'}>
                            Archives <span className={activeTab === 'archives' ? "text-red-600 font-normal" : "text-gray-400 font-normal"}>({accountArchivedPosts.length})</span>
                        </TabButton>
                      )}
                    </>
                  )}
                </nav>
            )}

          <div className="mt-6">
            {activeTab === 'catalogue' ? (
                <>
                    {hasCatalogContent ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {account.catalog!.map((item) => (
                                <div 
                                    key={item.id} 
                                    className="group cursor-pointer flex flex-col gap-2"
                                    onClick={handleViewCatalog}
                                >
                                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 relative shadow-sm group-hover:shadow-md transition-all hover:-translate-y-1">
                                         {item.type === 'image' ? (
                                             <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                                         ) : (
                                             <div className="w-full h-full flex items-center justify-center bg-red-50 text-red-500">
                                                 <DocumentDuplicateIcon className="w-12 h-12" />
                                             </div>
                                         )}
                                         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-800 truncate text-center px-1">{item.name}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        isOwnAccount ? (
                             <div className="text-center py-16 flex flex-col items-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                <Square2StackIcon className="w-16 h-16 text-gray-300" />
                                <h3 className="mt-4 text-xl font-semibold text-gray-700">Your Catalogs are Empty</h3>
                                <p className="text-gray-500 mt-1 mb-6 max-w-sm">Showcase your products or services by uploading images or PDFs to your catalogs.</p>
                                <Button onClick={handleManageCatalog} variant="glass-red">Upload to Catalogs</Button>
                            </div>
                        ) : (
                            <div className="text-center py-16 flex flex-col items-center">
                                <Square2StackIcon className="w-16 h-16 text-gray-300" />
                                <h3 className="mt-4 text-xl font-semibold text-gray-700">Catalogs Empty</h3>
                                <p className="text-gray-500 mt-1">This user hasn't added any items to their catalogs yet.</p>
                            </div>
                        )
                    )}
                </>
            ) : (
                displayedPosts.length > 0 ? (
                    <PostList
                        posts={displayedPosts}
                        currentAccount={currentAccount}
                        hideAuthorInfo={true}
                        isArchived={activeTab === 'archives'}
                    />
                ) : (
                    <div className="text-center py-16 flex flex-col items-center">
                        <ArchiveBoxIcon className="w-16 h-16 text-gray-300" />
                        <h3 className="mt-4 text-xl font-semibold text-gray-700">No Posts Here</h3>
                        <p className="text-gray-500 mt-1">
                            {activeTab === 'sale' ? 'This user has no items on sale.' :
                             activeTab === 'pins' ? 'This user has no pinned posts.' :
                             activeTab === 'archives' ? 'You have no archived posts.' :
                             activeTab === 'all' ? "This user hasn't posted anything yet." :
                             `There are no posts in the "${activeTab}" category.`}
                        </p>
                    </div>
                )
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};
