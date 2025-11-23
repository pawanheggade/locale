import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Account, DisplayablePost, SocialPlatform, SocialLink } from '../types';
import { PhoneIcon, ChatBubbleBottomCenterTextIcon, EnvelopeIcon, PencilIcon, HeartIcon, MapPinIcon, ChartBarIcon, FacebookIcon, XIcon, InstagramIcon, YouTubeIcon, GlobeAltIcon, ShareIcon, CalendarIcon, DocumentDuplicateIcon, ArchiveBoxIcon, GoogleIcon, AppleIcon } from './Icons';
import { formatMonthYear } from '../utils/formatters';
import { SubscriptionBadge } from './SubscriptionBadge';
import { useUI } from '../contexts/UIContext';
import { Button, TabButton, ButtonProps } from './ui/Button';
import { cn } from '../lib/utils';
import { Avatar } from './Avatar';
import { PostList } from './PostList';
import { ReferralCard } from './ReferralCard';

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

const getSocialIcon = (platform: SocialPlatform) => {
    switch (platform) {
        case 'facebook': return <FacebookIcon className="w-5 h-5" />;
        case 'twitter': return <XIcon className="w-5 h-5" />;
        case 'instagram': return <InstagramIcon className="w-5 h-5" />;
        case 'youtube': return <YouTubeIcon className="w-5 h-5" />;
        case 'website': return <GlobeAltIcon className="w-5 h-5" />;
        default: return <GlobeAltIcon className="w-5 h-5" />;
    }
};

const SocialsDropdown = ({ links, size = 'icon-sm' }: { links: SocialLink[], size?: ButtonProps['size'] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    if (!links || links.length === 0) return null;

    return (
        <div className="relative" ref={menuRef}>
            <Button
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                variant="glass"
                size={size}
                title="Social Profiles"
                className={isOpen ? 'ring-2 ring-red-500' : ''}
            >
                <GlobeAltIcon className="w-5 h-5" />
            </Button>
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-30 animate-zoom-in overflow-hidden origin-top-right">
                    <div className="py-1">
                        {links.map((link, idx) => (
                            <a
                                key={idx}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm text-gray-700"
                                onClick={() => setIsOpen(false)}
                            >
                                <span className="text-gray-500">{getSocialIcon(link.platform)}</span>
                                <span className="capitalize font-medium">{link.platform}</span>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export const AccountView: React.FC<AccountViewProps> = ({ account, currentAccount, posts, onEditAccount, archivedPosts, allAccounts, isLiked, onToggleLike, onShowOnMap, isGeocoding, onOpenAnalytics }) => {
  const { addToast, openModal } = useUI();
  const [isAnimatingLike, setIsAnimatingLike] = useState(false);
  
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
  
  const isBusinessAccount = account.subscription.tier === 'Business' || account.subscription.tier === 'Organisation';
  
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

  const canHaveCatalog = account.subscription.tier !== 'Personal' && account.subscription.tier !== 'Basic';
  const hasCatalogContent = account.catalog && account.catalog.length > 0;
  
  // Tab Visibility Logic
  const showCatalogTab = canHaveCatalog && (hasCatalogContent || isOwnAccount);
  const showSaleTab = isBusinessAccount && salePosts.length > 0;
  const showPinsTab = pinnedPosts.length > 0;
  const showArchivesTab = isOwnAccount && accountArchivedPosts.length > 0;
  
  // Initial Tab State
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
      if (showPinsTab) {
          setActiveTab('pins');
      } else if (showCatalogTab && !accountPosts.length && hasCatalogContent) {
          setActiveTab('catalogue');
      } else {
          setActiveTab('all');
      }
  }, [showPinsTab, showCatalogTab, hasCatalogContent, accountPosts.length]);

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
    if (activeTab === 'catalogue') return [];
    if (activeTab === 'sale') return salePosts;
    if (activeTab === 'pins') return pinnedPosts;
    if (activeTab === 'archives') return accountArchivedPosts;
    if (activeTab === 'all') return accountPosts;
    // Category filter
    return accountPosts.filter(p => p.category === activeTab);
  }, [activeTab, salePosts, pinnedPosts, accountArchivedPosts, accountPosts]);

  const handleLike = () => {
      if (!currentAccount) {
          openModal({ type: 'login' });
          return;
      }
      if (!isLiked) setIsAnimatingLike(true);
      onToggleLike(account.id);
  };

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
              // Handle share cancellation errors robustly
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
    <div className="pb-20 bg-white min-h-screen animate-fade-in">
      {/* Banner Section */}
      <div className="relative h-40 sm:h-60 w-full bg-gray-200 overflow-hidden">
        {account.bannerUrl ? (
          <img src={account.bannerUrl} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400"></div>
        )}
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Content Wrapper */}
        <div className="relative mt-4 pb-6">
            
            {/* Top Row: Avatar, Identity, Desktop Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-end gap-4 mb-6">
                <div className="flex items-end gap-4 w-full sm:w-auto">
                    <div 
                        className="relative p-1 bg-white rounded-full shadow-sm shrink-0 cursor-pointer transition-transform hover:scale-105 active:scale-95 group focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                        onClick={() => openModal({ type: 'profileQR', data: account })}
                        title="View Profile QR Code"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { 
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                openModal({ type: 'profileQR', data: account });
                            }
                        }}
                    >
                        <Avatar 
                            src={account.avatarUrl} 
                            alt={account.name} 
                            size="3xl" 
                            tier={account.subscription.tier} 
                            className="w-24 h-24 sm:w-32 sm:h-32 border-2 border-white shadow-inner"
                        />
                    </div>
                    
                    {/* Identity - Moved beside Avatar */}
                    <div className="mb-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{account.name}</h1>
                            <SubscriptionBadge tier={account.subscription.tier} className="mt-1" />
                        </div>
                        <div className="mt-1 flex flex-col gap-1">
                            <p className="text-gray-500 font-medium text-sm">@{account.username}</p>
                            <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                                <CalendarIcon className="w-3.5 h-3.5" />
                                <span>Joined {formatMonthYear(account.joinDate)}</span>
                            </div>
                            {account.taxInfo && (
                                <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                                    <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                                    <span>Tax ID: {account.taxInfo}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Desktop Actions */}
                <div className="hidden sm:flex gap-2 mb-1 shrink-0">
                    {isOwnAccount ? (
                        <>
                            <Button variant="glass-dark" size="sm" onClick={() => onEditAccount(account)} className="gap-2 px-4">
                                <PencilIcon className="w-4 h-4" />
                                Edit Profile
                            </Button>
                            <Button variant="glass" size="sm" onClick={onOpenAnalytics} className="gap-2">
                                <ChartBarIcon className="w-4 h-4" />
                                Analytics
                            </Button>
                            <SocialsDropdown links={sortedSocialLinks} size="sm" />
                            <Button variant="glass" size="sm" onClick={handleShareProfile} title="Share Profile">
                                <ShareIcon className="w-4 h-4" />
                            </Button>
                        </>
                    ) : (
                        <>
                            {contactMethods.map(method => (
                                <Button
                                    key={method.key}
                                    as="a"
                                    href={method.href}
                                    target={method.key === 'message' ? '_blank' : undefined}
                                    rel={method.key === 'message' ? 'noopener noreferrer' : undefined}
                                    onClick={(e) => handleContactAction(e, method)}
                                    variant="glass"
                                    size="icon-sm"
                                    title={method.label}
                                >
                                    <method.icon className="w-5 h-5" />
                                </Button>
                            ))}

                            <SocialsDropdown links={sortedSocialLinks} size="icon-sm" />

                            <Button variant="glass" size="icon-sm" onClick={handleShareProfile} title="Share Profile">
                                <ShareIcon className="w-5 h-5" />
                            </Button>

                            <Button 
                                onClick={handleLike} 
                                onAnimationEnd={() => setIsAnimatingLike(false)}
                                variant={isLiked ? "glass-red-light" : "glass-red"} 
                                size="sm" 
                                className={cn(
                                    "gap-2 px-6 ml-2", 
                                    isLiked ? "text-red-600" : "text-white", 
                                    isAnimatingLike && "animate-like-pop"
                                )}
                                title={isLiked ? 'Unlike' : 'Like'}
                            >
                                <HeartIcon isFilled={isLiked} className="w-4 h-6" />
                                <span>{isLiked ? 'Liked' : 'Like'}</span>
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Bio */}
            {account.description && (
                <p className="text-gray-700 text-sm sm:text-base leading-relaxed mt-4 mb-4">
                    {account.description}
                </p>
            )}

            {/* Meta Info Row - Unified Address and Icons */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
                
                {/* Unified Map Icons Group - Moved to front */}
                {(account.googleMapsUrl || account.appleMapsUrl) && (
                    <div className="flex items-center gap-3 shrink-0">
                        {/* Google Maps */}
                        {account.googleMapsUrl && (
                            <a href={account.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#EA4335] transition-colors p-1" title="Google Maps">
                                <GoogleIcon className="w-5 h-5" />
                            </a>
                        )}
                        {/* Apple Maps */}
                        {account.appleMapsUrl && (
                            <a href={account.appleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black transition-colors p-1" title="Apple Maps">
                                <AppleIcon className="w-5 h-5" />
                            </a>
                        )}
                    </div>
                )}

                {/* Internal Map Link (Pin + Address) */}
                {account.address && (
                    <div 
                        className="flex items-center gap-1.5 cursor-pointer hover:text-gray-900 transition-colors group min-w-0"
                        onClick={() => onShowOnMap(account)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onShowOnMap(account); } }}
                        title="View on Map"
                    >
                        <MapPinIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors shrink-0" />
                        <span>{account.address}</span>
                    </div>
                )}
            </div>

            {/* Mobile Actions */}
            <div className="mt-6 flex gap-3 sm:hidden">
                {isOwnAccount ? (
                    <>
                        <Button variant="glass-dark" className="flex-1 justify-center gap-2" onClick={() => onEditAccount(account)}>
                            <PencilIcon className="w-4 h-4" />
                            Edit
                        </Button>
                        <Button variant="glass" className="flex-1 justify-center gap-2" onClick={onOpenAnalytics}>
                            <ChartBarIcon className="w-4 h-4" />
                            Analytics
                        </Button>
                        <SocialsDropdown links={sortedSocialLinks} size="icon" />
                        <Button variant="glass" size="icon" onClick={handleShareProfile} title="Share">
                            <ShareIcon className="w-5 h-5" />
                        </Button>
                    </>
                ) : (
                    <>
                        <Button 
                            onClick={handleLike} 
                            onAnimationEnd={() => setIsAnimatingLike(false)}
                            variant={isLiked ? "glass-red-light" : "glass-red"}
                            className={cn(
                                "flex-1 justify-center gap-2", 
                                isLiked ? "text-red-600" : "text-white",
                                isAnimatingLike && "animate-like-pop"
                            )}
                        >
                            <HeartIcon isFilled={isLiked} className="w-5 h-5" />
                            <span>{isLiked ? 'Liked' : 'Like'}</span>
                        </Button>

                        {contactMethods.map(method => (
                            <Button
                                key={method.key}
                                as="a"
                                href={method.href}
                                target={method.key === 'message' ? '_blank' : undefined}
                                rel={method.key === 'message' ? 'noopener noreferrer' : undefined}
                                onClick={(e) => handleContactAction(e, method)}
                                variant="glass"
                                size="icon"
                                title={method.label}
                            >
                                <method.icon className="w-5 h-5" />
                            </Button>
                        ))}

                        <SocialsDropdown links={sortedSocialLinks} size="icon" />

                        <Button variant="glass" size="icon" onClick={handleShareProfile} title="Share">
                            <ShareIcon className="w-5 h-5" />
                        </Button>
                    </>
                )}
            </div>
        </div>

        {/* Seller Info / Referral Section for Own Profile - Moved Above Tabs */}
        {isOwnAccount && (
            <div className="mb-6 border-t border-gray-100 pt-6">
                <ReferralCard account={account} />
            </div>
        )}

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 mb-6 py-2 overflow-x-auto hide-scrollbar">
            <div className="flex space-x-2 px-4 min-w-max">
                {showPinsTab && (
                    <TabButton onClick={() => setActiveTab('pins')} isActive={activeTab === 'pins'}>
                        Pinned
                    </TabButton>
                )}
                <TabButton onClick={() => setActiveTab('all')} isActive={activeTab === 'all'}>
                    Posts
                </TabButton>
                {showSaleTab && (
                    <TabButton onClick={() => setActiveTab('sale')} isActive={activeTab === 'sale'}>
                        Sale
                    </TabButton>
                )}
                {showCatalogTab && (
                    <TabButton onClick={() => setActiveTab('catalogue')} isActive={activeTab === 'catalogue'}>
                        Catalogue
                    </TabButton>
                )}
                {postCategories.map(cat => (
                    <TabButton key={cat} onClick={() => setActiveTab(cat)} isActive={activeTab === cat}>
                        {cat}
                    </TabButton>
                ))}
                {showArchivesTab && (
                    <TabButton onClick={() => setActiveTab('archives')} isActive={activeTab === 'archives'}>
                        Archived
                    </TabButton>
                )}
            </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
            {activeTab === 'catalogue' ? (
                <div className="space-y-4 animate-fade-in">
                    {isOwnAccount && (
                        <div className="flex justify-end items-center mb-4">
                            <Button variant="glass" size="sm" onClick={() => openModal({ type: 'manageCatalog' })}>
                                Manage
                            </Button>
                        </div>
                    )}
                    
                    {account.catalog && account.catalog.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {account.catalog.map((item) => (
                                <div 
                                    key={item.id} 
                                    onClick={() => openModal({ type: 'viewCatalog', data: { catalog: account.catalog } })}
                                    className="group cursor-pointer bg-gray-50 rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 aspect-[3/4] flex flex-col"
                                >
                                    <div className="flex-1 bg-white flex items-center justify-center p-4 overflow-hidden relative">
                                        {item.type === 'image' ? (
                                            <img src={item.url} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                        ) : (
                                            <DocumentDuplicateIcon className="w-12 h-12 text-red-500 opacity-80 group-hover:opacity-100 transition-opacity" />
                                        )}
                                    </div>
                                    <div className="p-3 border-t border-gray-100 bg-white relative z-10">
                                        <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <DocumentDuplicateIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No catalog items available.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="animate-fade-in">
                    {isOwnAccount && activeTab === 'archives' && displayedPosts.length === 0 ? (
                        <div className="text-center py-20">
                            <ArchiveBoxIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700">No Archived Posts</h3>
                            <p className="text-gray-500">Posts you archive will appear here.</p>
                        </div>
                    ) : (
                        <PostList 
                            posts={displayedPosts} 
                            currentAccount={currentAccount}
                            isArchived={activeTab === 'archives'}
                            variant="compact"
                        />
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
