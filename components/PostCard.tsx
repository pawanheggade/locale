
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PostType, DisplayablePost, Account } from '../types';
import { MapPinIcon, ClockIcon, PencilIcon, PinIcon, BellIcon, AIIcon, CashIcon, ShoppingBagIcon, ArchiveBoxIcon, ArrowUturnLeftIcon, ChatBubbleBottomCenterTextIcon, PaperAirplaneIcon, HeartIcon } from './Icons';
import { formatTimeRemaining, formatFullDate, formatFullDateTime } from '../utils/formatters';
import { getPostStatus, isAccountEligibleToPin, isPostPurchasable } from '../utils/posts';
import { MediaCarousel } from './MediaCarousel';
import { PostAuthorInfo } from './PostAuthorInfo';
import { useAuth } from '../contexts/AuthContext';
import { useActivity } from '../contexts/ActivityContext';
import { LocaleChoiceBadge, CategoryBadge } from './Badges';
import { PriceDisplay } from './PriceDisplay';
import { Card, CardContent } from './ui/Card';
import { cn } from '../lib/utils';
import { LikeButton } from './LikeButton';
import { Button } from './ui/Button';
import { useNavigation } from '../contexts/NavigationContext';
import { usePosts } from '../contexts/PostsContext';
import { useUI } from '../contexts/UIContext';
import { useFilters } from '../contexts/FiltersContext';
import { PostActionsDropdown } from './PostActionsDropdown';

interface PostCardProps {
  post: DisplayablePost;
  index: number;
  currentAccount: Account | null;
  isSearchResult?: boolean;
  isArchived?: boolean;
  hideAuthorInfo?: boolean;
  variant?: 'default' | 'compact';
  hideExpiry?: boolean;
  enableEntryAnimation?: boolean;
  isInitiallyExpanded?: boolean;
}

const PostCardComponent: React.FC<PostCardProps> = ({ post, index, currentAccount, isSearchResult = false, isArchived = false, hideAuthorInfo = false, variant = 'default', hideExpiry = false, enableEntryAnimation = false, isInitiallyExpanded = false }) => {
  const { navigateTo, showOnMap } = useNavigation();
  const { toggleLikePost, toggleLikeAccount, bag, addPostToViewHistory } = useAuth();
  const { toggleAvailabilityAlert, availabilityAlerts, priceAlerts } = useActivity();
  const { openModal } = useUI();
  const { dispatchFilterAction } = useFilters();
  const { archivePost, unarchivePost, togglePinPost } = usePosts();
  
  const isPostLiked = currentAccount?.likedPostIds?.includes(post.id) ?? false;
  const isProfileLiked = currentAccount?.likedAccountIds?.includes(post.authorId) ?? false;
  const isAvailabilityAlertSet = useMemo(() => availabilityAlerts.some(alert => alert.postId === post.id), [availabilityAlerts, post.id]);
  const isPriceAlertSet = useMemo(() => priceAlerts.some(alert => alert.postId === post.id), [priceAlerts, post.id]);
  const isAddedToBag = useMemo(() => bag.some(item => item.postId === post.id), [bag, post.id]);

  const hasMedia = post.media && post.media.length > 0;
  const isCompact = variant === 'compact';
  
  const [isInView, setIsInView] = useState(!enableEntryAnimation);
  const [hasAnimated, setHasAnimated] = useState(!enableEntryAnimation);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(isInitiallyExpanded);

  const cardRef = useRef<HTMLDivElement>(null);

  const dateForStatus = post.type === PostType.EVENT ? post.eventStartDate : post.expiryDate;
  const { isExpired } = getPostStatus(dateForStatus);
  const isOwnPost = post.authorId === currentAccount?.id;
  const isEligibleToPin = isOwnPost && isAccountEligibleToPin(currentAccount);
  const isPurchasable = isPostPurchasable(post);

  useEffect(() => {
    if (!enableEntryAnimation) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (!hasAnimated) { // Only set animated once
            setHasAnimated(true);
          }
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px' }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => { if (cardRef.current) observer.unobserve(cardRef.current); };
  }, [enableEntryAnimation, hasAnimated]);
  
  const locationToDisplay = (post.type === PostType.EVENT && post.eventLocation) ? post.eventLocation : post.location;
  const coordsToUse = (post.type === PostType.EVENT && post.eventCoordinates) ? post.eventCoordinates : post.coordinates;

  // Determine description truncation
  const descriptionMaxLength = isCompact ? 60 : 90;
  const shouldTruncate = post.description.length > descriptionMaxLength;
  
  // Only show detailed metadata (Category, Tags) if expanded or if description is short enough to show fully
  const showDetails = !shouldTruncate || isDescriptionExpanded;

  const showHeader = !hideAuthorInfo && post.author;

  const handleExpandToggle = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsDescriptionExpanded(prev => !prev);
  };

  const LocationElement = ({ isOverlay = false }: { isOverlay?: boolean }) => (
     <div
        className={cn(
            "flex items-center gap-1.5 min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-md",
            isOverlay ? 'text-white/80' : 'text-red-400',
            coordsToUse ? "cursor-pointer group" : ""
        )}
        onClick={(e) => {
            if (coordsToUse) {
                e.stopPropagation();
                showOnMap(post.id);
            }
        }}
        role={coordsToUse ? "button" : undefined}
        tabIndex={coordsToUse ? 0 : undefined}
        onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && coordsToUse) {
                e.preventDefault();
                e.stopPropagation();
                showOnMap(post.id);
            }
        }}
        title={coordsToUse ? "View on Map" : undefined}
     >
        <MapPinIcon className={cn("w-3.5 h-3.5 shrink-0")} />
        <span className={cn("truncate text-xs", coordsToUse ? "underline-offset-2" : "")}>
            {locationToDisplay}
        </span>
     </div>
  );

  const ExpiryElement = post.type === PostType.EVENT && post.eventStartDate ? (
     <div className={cn("flex items-center gap-2", isCompact ? 'text-xs' : 'text-sm', 'text-gray-600')}>
        <ClockIcon className="w-4 h-4 shrink-0" />
        <span>{formatFullDate(post.eventStartDate)}</span>
     </div>
  ) : !hideExpiry && post.expiryDate ? (
    <div className={cn("flex items-center gap-2", isCompact ? 'text-xs' : 'text-sm', isExpired ? 'text-red-600' : 'text-gray-600')}>
      <ClockIcon className="w-4 h-4 shrink-0" />
      <span title={formatFullDateTime(post.expiryDate)}>
        {isExpired ? 'Expired' : `Expires on ${formatFullDate(post.expiryDate)}`}
      </span>
    </div>
  ) : null;

  return (
    <Card
      ref={cardRef}
      className={cn(
        'group cursor-pointer',
        enableEntryAnimation && (hasAnimated ? 'animate-fade-in-down' : 'opacity-0 -translate-y-6')
      )}
      style={{ animationDelay: (enableEntryAnimation && !isCompact) ? `${Math.min(index * 75, 500)}ms` : '0ms' }}
      onClick={() => handleExpandToggle()}
      role="article"
      aria-labelledby={`post-title-${post.id}`}
    >
      {/* Header Section: Author Info, Location & Profile Like Button */}
      {showHeader && !isCompact && (
          <div className="p-3 border-b border-gray-100">
            <PostAuthorInfo 
                author={post.author!} 
                subscriptionBadgeIconOnly={true}
                location={<LocationElement />}
            >
                {isOwnPost ? (
                    !isArchived && (
                        <Button
                          onClick={(e) => { e.stopPropagation(); navigateTo('editPost', { postId: post.id }); }}
                          variant="overlay-dark"
                          size="icon-sm"
                          className="flex-shrink-0 text-gray-500 active:scale-95"
                          aria-label="Edit post"
                          title="Edit post"
                        >
                            <PencilIcon className="w-5 h-5" />
                        </Button>
                    )
                ) : isExpired ? (
                    <Button
                        onClick={(e) => { e.stopPropagation(); if (currentAccount) toggleAvailabilityAlert(post.id); else openModal({ type: 'login' }); }}
                        variant="ghost"
                        size="icon-sm"
                        className={cn(
                            "flex-shrink-0 active:scale-95",
                            isAvailabilityAlertSet ? "text-red-600" : "text-gray-500"
                        )}
                        aria-label={isAvailabilityAlertSet ? "Remove availability alert" : "Notify when available"}
                        title={isAvailabilityAlertSet ? "Alert Set" : "Notify when available"}
                    >
                        <BellIcon className="w-5 h-5" isFilled={isAvailabilityAlertSet} />
                    </Button>
                ) : (
                    <>
                        <LikeButton
                            isLiked={isProfileLiked}
                            onToggle={() => {
                                if (currentAccount) {
                                    toggleLikeAccount(post.authorId);
                                } else {
                                    openModal({ type: 'login' });
                                }
                            }}
                            variant="ghost"
                            size="icon-sm"
                            className={cn(
                                "flex-shrink-0 active:scale-95",
                                isProfileLiked ? "text-red-600" : "text-gray-400"
                            )}
                            iconClassName="w-5 h-5"
                            aria-label={isProfileLiked ? "Unlike profile" : "Like profile"}
                            title={isProfileLiked ? "Liked" : "Like profile"}
                        />
                        <PostActionsDropdown 
                            post={post} 
                            isArchived={isArchived} 
                            currentAccount={currentAccount} 
                            variant="card"
                        />
                    </>
                )}
            </PostAuthorInfo>
          </div>
      )}

      {/* Media Section */}
      <div className="relative">
        {hasMedia && (
          <MediaCarousel
            id={`postcard-${post.id}`}
            media={post.media}
            isInView={isInView}
            aspectRatio={isCompact ? 'aspect-square' : 'aspect-[4/3]'}
          />
        )}
        
        {showHeader && isCompact && (
          <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/60 to-transparent">
            <PostAuthorInfo 
                author={post.author!}
                subscriptionBadgeIconOnly={true}
                variant="overlay"
                location={<LocationElement isOverlay={true} />}
            >
                {isOwnPost ? (
                    !isArchived && (
                        <Button
                          onClick={(e) => { e.stopPropagation(); navigateTo('editPost', { postId: post.id }); }}
                          variant="overlay"
                          size="icon-sm"
                          className="flex-shrink-0 text-white/80 active:scale-95"
                          aria-label="Edit post"
                          title="Edit post"
                        >
                            <PencilIcon className="w-5 h-5" />
                        </Button>
                    )
                ) : (
                    <>
                        <LikeButton
                            isLiked={isProfileLiked}
                            onToggle={() => {
                                if (currentAccount) {
                                    toggleLikeAccount(post.authorId);
                                } else {
                                    openModal({ type: 'login' });
                                }
                            }}
                            variant="overlay"
                            size="icon-sm"
                            className={cn(
                                "flex-shrink-0 active:scale-95",
                                isProfileLiked ? "text-red-400" : "text-white/80"
                            )}
                            iconClassName="w-5 h-5"
                            aria-label={isProfileLiked ? "Unlike profile" : "Like profile"}
                            title={isProfileLiked ? "Liked" : "Like profile"}
                        />
                        <PostActionsDropdown 
                            post={post} 
                            isArchived={isArchived} 
                            currentAccount={currentAccount} 
                            variant="overlay"
                        />
                    </>
                )}
            </PostAuthorInfo>
          </div>
        )}

        {post.isLocaleChoice && isSearchResult && <LocaleChoiceBadge className="top-3 left-3" />}
      </div>
      
      <CardContent className={isCompact ? 'p-3' : 'p-4'}>
        <div className="flex-grow">
          {/* Post Title */}
          <h3
            id={`post-title-${post.id}`}
            className={cn(
              'font-bold text-gray-800 line-clamp-2 leading-tight',
              isCompact ? 'text-base' : 'text-lg'
            )}
          >
            <button
              onClick={(e) => handleExpandToggle(e)}
              className="text-left w-full focus:outline-none focus:underline decoration-2 underline-offset-2"
            >
              {post.title}
            </button>
          </h3>

          {/* AI Insight (if available from search) */}
          {post.aiReasoning && (
             <div className="mt-2 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded flex items-start gap-1">
                <AIIcon className="w-3 h-3 mt-0.5 shrink-0" />
                <span>{post.aiReasoning}</span>
             </div>
          )}

          {/* Price & Alert Button - Moved above description */}
          <div className="mt-2 flex items-center justify-between">
              <PriceDisplay 
                price={post.price} 
                salePrice={post.salePrice} 
                priceUnit={post.priceUnit} 
                size={isCompact ? 'x-small' : 'small'} 
                isExpired={isExpired} 
                showOriginalPriceOnSale={!isCompact} 
              />
              
              {/* Explicit check to allow rendering for non-authors on valid items */}
              {!isOwnPost && !isExpired && !isArchived && (
                  <div className="flex items-center gap-1">
                      {isPurchasable && (
                          <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!currentAccount) {
                                    openModal({ type: 'login' });
                                    return;
                                }
                                openModal({ type: 'setPriceAlert', data: post });
                            }}
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-8 w-8 p-0 rounded-full flex items-center justify-center",
                                isPriceAlertSet
                                    ? "text-red-600"
                                    : "text-gray-500"
                            )}
                            aria-label={isPriceAlertSet ? "Manage price alert" : "Set price alert"}
                            title={isPriceAlertSet ? "Price alert set" : "Set price alert"}
                          >
                            <BellIcon className="w-5 h-5" isFilled={isPriceAlertSet} />
                          </Button>
                      )}
                      <LikeButton
                          isLiked={isPostLiked}
                          onToggle={() => { if (currentAccount) toggleLikePost(post.id); else openModal({ type: 'login' }); }}
                          variant="ghost"
                          size="icon"
                          className={cn(
                              "h-8 w-8 p-0 rounded-full flex items-center justify-center",
                              isPostLiked
                                  ? "text-red-600"
                                  : "text-gray-500"
                          )}
                          iconClassName="w-5 h-5"
                          aria-label={isPostLiked ? "Unlike post" : "Like post"}
                          title={isPostLiked ? "Unlike post" : "Like post"}
                      />
                  </div>
              )}
          </div>

          {/* Description Snippet with Expand Link */}
          <div className={cn("text-gray-600 mt-2", isCompact ? "text-xs" : "text-sm")}>
            {shouldTruncate && !isDescriptionExpanded ? (
                <>
                    {post.description.slice(0, descriptionMaxLength)}...
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            if (currentAccount) {
                                addPostToViewHistory(post.id);
                            }
                            setIsDescriptionExpanded(true);
                        }}
                        className="ml-1 font-medium text-red-600 focus:outline-none"
                        aria-label="Show full description"
                    >
                        details
                    </button>
                </>
            ) : (
                post.description
            )}
          </div>
          
          {/* Category, Tags, Payment, Delivery - Only visible when expanded */}
          {showDetails && (
            <div className="animate-fade-in">
                <div className="flex flex-wrap items-center gap-2 mt-3 mb-1">
                    <CategoryBadge 
                        category={post.category} 
                        onClick={(e) => { e.stopPropagation(); dispatchFilterAction({ type: 'SET_FILTER_CATEGORY', payload: post.category }); }} 
                        className="text-[10px] h-auto min-h-0" 
                    />
                    {post.tags.map(tag => (
                        <button 
                            key={tag}
                            onClick={(e) => { e.stopPropagation(); dispatchFilterAction({ type: 'SET_FILTER_TAGS', payload: [tag] }); }}
                            className="text-[10px] text-gray-600 cursor-pointer truncate max-w-[80px] focus:outline-none focus-visible:ring-1 focus-visible:ring-red-500 rounded-sm"
                        >
                            #{tag}
                        </button>
                    ))}
                </div>

                {/* Payment & Delivery Info */}
                {post.author && (
                    <div className="mt-2 space-y-1">
                        {post.author.paymentMethods && post.author.paymentMethods.length > 0 && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500" title="Payment Methods">
                                <CashIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{post.author.paymentMethods.join(', ')}</span>
                            </div>
                        )}
                        {post.author.deliveryOptions && post.author.deliveryOptions.length > 0 && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500" title="Delivery Options">
                                <ShoppingBagIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{post.author.deliveryOptions.join(', ')}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
          )}

          {/* Location & Expiry/Date Info */}
          <div className="flex items-center justify-between flex-wrap gap-x-4 gap-y-1 mt-2">
            {!showHeader && !isCompact && <LocationElement />}
            {ExpiryElement}
          </div>

          {/* Inline Action Footer - Only shown when expanded */}
          {isDescriptionExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-2 animate-fade-in">
                {isOwnPost ? (
                    <>
                        <div className="flex-1 flex items-center gap-2">
                            {isArchived ? (
                                <Button onClick={(e) => { e.stopPropagation(); unarchivePost(post.id); }} variant="overlay-dark" size={isCompact ? "icon-sm" : "sm"} className={cn("bg-gray-50", isCompact ? "flex-1" : "flex-1 gap-1.5")} title="Unarchive">
                                    <ArrowUturnLeftIcon className="w-5 h-5" /> {!isCompact && 'Unarchive'}
                                </Button>
                            ) : (
                                <>
                                    <Button onClick={(e) => { e.stopPropagation(); navigateTo('editPost', { postId: post.id }); }} variant="overlay-dark" size={isCompact ? "icon-sm" : "sm"} className={cn("bg-gray-50", isCompact ? "flex-1" : "flex-1 gap-1.5")} title="Edit">
                                        <PencilIcon className="w-5 h-5" /> {!isCompact && 'Edit'}
                                    </Button>
                                    <Button onClick={(e) => { e.stopPropagation(); archivePost(post.id); }} variant="overlay-dark" size={isCompact ? "icon-sm" : "sm"} className={cn("text-amber-600 bg-gray-50", isCompact ? "flex-1" : "flex-1 gap-1.5")} title="Archive">
                                        <ArchiveBoxIcon className="w-5 h-5" /> {!isCompact && 'Archive'}
                                    </Button>
                                </>
                            )}
                        </div>
                        {isEligibleToPin && !isArchived && (
                            <Button onClick={(e) => { e.stopPropagation(); togglePinPost(post.id); }} variant="overlay-dark" size="icon-sm" className={cn("bg-gray-50", post.isPinned ? "text-red-600" : "text-gray-500")} title={post.isPinned ? 'Unpin' : 'Pin'}>
                                <PinIcon isFilled={!!post.isPinned} className="w-5 h-5" />
                            </Button>
                        )}
                        <Button onClick={(e) => { e.stopPropagation(); openModal({ type: 'sharePost', data: post }); }} variant="overlay-dark" size="icon-sm" className="flex-none bg-gray-50 rounded-xl text-gray-500" title="Share post">
                            <PaperAirplaneIcon className="w-5 h-5" />
                        </Button>
                    </>
                ) : (
                    <>
                        {/* Primary actions on the left */}
                        <div className="flex items-center gap-2 flex-grow">
                            {!isArchived && (
                                <>
                                {isExpired ? (
                                    <Button onClick={(e) => { e.stopPropagation(); if (!currentAccount) { openModal({ type: 'login' }); return; } toggleAvailabilityAlert(post.id); }} variant={isAvailabilityAlertSet ? "pill-lightred" : "pill-red"} size={isCompact ? "icon-sm" : "sm"} className={cn(isCompact ? "flex-1" : "flex-1 gap-1.5 text-xs font-semibold")} title={isAvailabilityAlertSet ? 'Alert Set' : 'Notify when available'}>
                                        <BellIcon className="w-5 h-5" isFilled={isAvailabilityAlertSet} />
                                        {!isCompact && <span className="truncate">{isAvailabilityAlertSet ? 'Alert Set' : 'Notify'}</span>}
                                    </Button>
                                ) : (
                                    <>
                                        {isPurchasable ? (
                                            <Button onClick={(e) => { e.stopPropagation(); if (!currentAccount) { openModal({ type: 'login' }); return; } isAddedToBag ? navigateTo('bag') : openModal({ type: 'addToBag', data: post }); }} variant={isAddedToBag ? "pill-lightred" : "pill-red"} size={isCompact ? "icon-sm" : "sm"} className={cn(isCompact ? "flex-1" : "flex-1 gap-1.5 text-xs font-semibold")} title={isAddedToBag ? 'Go to Bag' : 'Add to Bag'}>
                                                <ShoppingBagIcon className="w-5 h-5" isFilled={isAddedToBag} />
                                                {!isCompact && <span className="truncate">{isAddedToBag ? 'Go to Bag' : 'Add to Bag'}</span>}
                                            </Button>
                                        ) : (
                                            <Button onClick={(e) => { e.stopPropagation(); if (!currentAccount) { openModal({ type: 'login' }); return; } const prefilledMessage = post.type === PostType.SERVICE ? `Hi, I'm interested in your service: "${post.title}".` : undefined; openModal({ type: 'contactStore', data: { author: post.author!, post, prefilledMessage } }); }} variant="pill-red" size={isCompact ? "icon-sm" : "sm"} className={cn(isCompact ? "flex-1" : "flex-1 gap-1.5 text-xs font-semibold")} title={post.type === PostType.SERVICE ? 'Request' : 'Contact'}>
                                                <ChatBubbleBottomCenterTextIcon className="w-5 h-5"/>
                                                {!isCompact && <span className="truncate">{post.type === PostType.SERVICE ? 'Request' : 'Contact'}</span>}
                                            </Button>
                                        )}
                                        {isPurchasable && (
                                        <Button onClick={(e) => { e.stopPropagation(); if (!currentAccount) { openModal({ type: 'login' }); return; } openModal({ type: 'contactStore', data: { author: post.author!, post } }); }} variant="overlay-dark" size={isCompact ? "icon-sm" : "icon-sm"} className="flex-none bg-gray-50 rounded-xl text-gray-500" title="Contact seller">
                                            <ChatBubbleBottomCenterTextIcon className="w-5 h-5" />
                                            {!isCompact && <span className="sr-only">Contact</span>}
                                        </Button>
                                        )}
                                    </>
                                )}
                                </>
                            )}
                        </div>
                        {/* Secondary actions on the right */}
                        {!isArchived && (
                        <div className="flex-shrink-0 flex items-center gap-1">
                            <Button onClick={(e) => { e.stopPropagation(); openModal({ type: 'sharePost', data: post }); }} variant="overlay-dark" size="icon-sm" className="bg-gray-50 rounded-xl text-gray-500" title="Share post">
                                <PaperAirplaneIcon className="w-5 h-5" />
                            </Button>
                        </div>
                        )}
                    </>
                )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const PostCard = React.memo(PostCardComponent);
