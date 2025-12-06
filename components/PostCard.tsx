import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PostType, DisplayablePost, Account } from '../types';
import { MapPinIcon, ClockIcon, PencilIcon, PinIcon, BellIcon, AIIcon, CashIcon, ShoppingBagIcon, ArchiveBoxIcon, ArrowUturnLeftIcon, ChatBubbleBottomCenterTextIcon, PaperAirplaneIcon, HeartIcon } from './Icons';
import { formatTimeRemaining, formatFullDate, formatFullDateTime } from '../utils/formatters';
import { getPostStatus, isAccountEligibleToPin, isPostPurchasable, wasPostEdited } from '../utils/posts';
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
import { useNavigation } from '../App';
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
  const { toggleLikePost, toggleLikeAccount, bag } = useAuth();
  const { togglePinPost, archivePost, unarchivePost } = usePosts();
  const { toggleAvailabilityAlert, availabilityAlerts, priceAlerts } = useActivity();
  const { openModal } = useUI();
  const { dispatchFilterAction } = useFilters();
  
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

  const showHeader = !hideAuthorInfo && post.author && !isCompact;

  const handleExpandToggle = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsDescriptionExpanded(prev => !prev);
  };

  const LocationElement = (
     <div
        className={cn(
            "flex items-center gap-1.5 min-w-0 text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-md",
            coordsToUse ? "cursor-pointer group transition-colors hover:text-red-500" : ""
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
        <MapPinIcon className={cn("w-3.5 h-3.5 shrink-0", coordsToUse ? "text-gray-400 group-hover:text-red-500 transition-colors" : "text-gray-400")} />
        <span className={cn("truncate text-xs", coordsToUse ? "underline-offset-2" : "")}>
            {locationToDisplay}
        </span>
     </div>
  );

  return (
    <Card
      ref={cardRef}
      className={cn(
        'group cursor-pointer transition-all duration-300',
        enableEntryAnimation && (hasAnimated ? 'animate-fade-in-down' : 'opacity-0 -translate-y-6')
      )}
      style={{ animationDelay: (enableEntryAnimation && !isCompact) ? `${Math.min(index * 75, 500)}ms` : '0ms' }}
      onClick={() => handleExpandToggle()}
      role="article"
      aria-labelledby={`post-title-${post.id}`}
    >
      {/* Header Section: Author Info, Location & Profile Like Button */}
      {showHeader && (
          <div className="p-3 border-b border-gray-100">
            <PostAuthorInfo 
                author={post.author!}
                timestamp={post.lastUpdated}
                isEdited={wasPostEdited(post)}
                subscriptionBadgeIconOnly={true}
                location={LocationElement}
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
                                isProfileLiked ? "text-red-600" : "text-gray-400 hover:text-gray-600"
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
                            onReport={() => {
                                if (!currentAccount) {
                                    openModal({ type: 'login' });
                                    return;
                                }
                                openModal({ type: 'reportItem', data: { item: post } });
                            }}
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
        {post.isLocaleChoice && isSearchResult && <LocaleChoiceBadge className="top-3 left-3" />}
      </div>
      
      <CardContent className={isCompact ? 'p-3' : 'p-4'}>
        <div className="flex-grow">
          {/* Post Title */}
          <h3
            id={`post-title-${post.id}`}
            className={cn(
              'font-bold text-gray-800 transition-colors line-clamp-2 leading-tight',
              isCompact ? 'text-base' : 'text-lg'
            )}
          >
            <button
              onClick={(e) => handleExpandToggle(e)}
              className="text-left w-full focus:outline-none focus:underline decoration-2 underline-offset-2 transition-colors"
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
              {!isOwnPost && isPurchasable && !isExpired && (
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
                        "h-8 w-8 p-0 rounded-full flex items-center justify-center transition-colors",
                        isPriceAlertSet 
                            ? "text-red-600 bg-red-100" 
                            : "text-gray-400 hover:bg-gray-100"
                    )}
                    aria-label={isPriceAlertSet ? "Price alert is set" : "Set price alert"}
                    title={isPriceAlertSet ? "Price alert is set" : "Set price alert"}
                >
                    <CashIcon className="w-5 h-5" />
                </Button>
              )}
          </div>

          {/* Description & metadata (conditional rendering) */}
          <div className={cn("overflow-hidden transition-all duration-300", showDetails ? 'mt-2' : 'mt-0')}>
              <p className={cn("text-gray-600", isCompact ? 'text-xs' : 'text-sm', !showDetails ? 'line-clamp-2' : '')}>
                {post.description}
              </p>

              {showDetails && (
                  <div className="mt-3 space-y-3">
                      {isCompact && showHeader && LocationElement}
                      {post.tags.length > 0 && (
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            {post.tags.slice(0, 3).map(tag => (
                              <button
                                key={tag}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  dispatchFilterAction({ type: 'SET_FILTER_TAGS', payload: [tag] });
                                }}
                                className="text-xs font-medium text-gray-500 hover:text-red-600 focus:outline-none focus:underline"
                              >
                                #{tag}
                              </button>
                            ))}
                          </div>
                      )}
                  </div>
              )}
          </div>
        </div>

        {/* Expiry, Type, and Category Section */}
        <div className="mt-3 flex items-center justify-between text-gray-500">
            <div className="flex items-center gap-1.5 min-w-0">
                {!hideExpiry && dateForStatus && (
                    <>
                      <ClockIcon className="w-3.5 h-3.5" />
                      <span className="text-xs truncate" title={formatFullDateTime(dateForStatus)}>
                        {post.type === PostType.EVENT ? formatFullDate(dateForStatus) : formatTimeRemaining(dateForStatus)}
                      </span>
                      <span className="text-gray-300 mx-1">|</span>
                    </>
                )}
                 <CategoryBadge
                    category={post.category}
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatchFilterAction({ type: 'SET_FILTER_CATEGORY', payload: post.category });
                    }}
                    className={cn(isCompact ? "text-[10px]" : "text-xs", "font-bold tracking-wider")}
                  />
            </div>
            {!isOwnPost && !isCompact && (
              <LikeButton
                  isLiked={isPostLiked}
                  onToggle={() => {
                      if (currentAccount) {
                          toggleLikePost(post.id);
                      } else {
                          openModal({ type: 'login' });
                      }
                  }}
                  variant="ghost"
                  size="icon-sm"
                  className={cn(
                      "flex-shrink-0 active:scale-95",
                      isPostLiked ? "text-red-600" : "text-gray-400 hover:text-gray-600"
                  )}
                  iconClassName="w-5 h-5"
                  aria-label={isPostLiked ? "Unlike post" : "Like post"}
                  title={isPostLiked ? "Liked" : "Like post"}
              />
            )}
        </div>
        
        {/* Expanded Footer Actions */}
        {isDescriptionExpanded && (
            <div className="pt-4 mt-4 border-t border-gray-100 flex items-center gap-2 animate-fade-in-up">
              {isOwnPost ? (
                  <>
                      {isArchived ? (
                          <Button onClick={(e) => { e.stopPropagation(); unarchivePost(post.id); }} variant="pill-dark" className={cn("flex-1 gap-2", isCompact && "min-w-0 px-2 h-9")} title="Unarchive">
                              <ArrowUturnLeftIcon className="w-5 h-5" />
                              {!isCompact && "Unarchive"}
                          </Button>
                      ) : (
                          <>
                              {isEligibleToPin && (
                                <Button onClick={(e) => { e.stopPropagation(); togglePinPost(post.id); }} variant="outline" size="icon" className={cn("h-10", isCompact && "!w-9 !h-9 text-xs", post.isPinned && "bg-amber-100 border-amber-200 text-amber-700")} title="Pin Post">
                                    <PinIcon className="w-5 h-5" isFilled={post.isPinned} />
                                </Button>
                              )}
                              <Button onClick={(e) => { e.stopPropagation(); archivePost(post.id); }} variant="outline" className={cn("flex-1 gap-2", isCompact && "min-w-0 px-2 h-9")} title="Archive">
                                  <ArchiveBoxIcon className="w-5 h-5" />
                                  {!isCompact && "Archive"}
                              </Button>
                          </>
                      )}
                  </>
              ) : (
                  <>
                      <LikeButton isLiked={isPostLiked} onToggle={() => { if (currentAccount) { toggleLikePost(post.id); } else { openModal({ type: 'login' }); } }} variant="ghost" className={cn("gap-2", isCompact ? "min-w-0 px-2 h-9 !rounded-xl" : "", isPostLiked ? "text-red-600" : "text-gray-500")} title="Like">
                          {!isCompact && "Like"}
                      </LikeButton>
                      <Button onClick={(e) => { e.stopPropagation(); openModal({ type: 'sharePost', data: post }) }} variant="ghost" className={cn("gap-2", isCompact && "min-w-0 px-2 h-9 !rounded-xl")} title="Share">
                          <PaperAirplaneIcon className="w-5 h-5" />
                          {!isCompact && "Share"}
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (currentAccount) {
                            openModal({ type: 'contactStore', data: { author: post.author!, post } });
                          } else {
                            openModal({ type: 'login' });
                          }
                        }}
                        variant="ghost"
                        className={cn("gap-2", isCompact && "min-w-0 px-2 h-9 !rounded-xl")}
                        title="Contact"
                      >
                         <ChatBubbleBottomCenterTextIcon className="w-5 h-5" />
                         {!isCompact && "Contact"}
                      </Button>
                      {isPurchasable && (
                        <Button onClick={(e) => { e.stopPropagation(); if (currentAccount) openModal({ type: 'addToBag', data: post }); else openModal({ type: 'login' }); }} variant="pill-red" className={cn("flex-1 gap-2", isCompact && "min-w-0 px-2 h-9")} title="Add to Bag">
                          <ShoppingBagIcon className="w-5 h-5" isFilled={isAddedToBag} />
                          {!isCompact && (isAddedToBag ? "In Bag" : "Add to Bag")}
                        </Button>
                      )}
                  </>
              )}
            </div>
        )}
      </CardContent>
    </Card>
  );
};

export const PostCard = React.memo(PostCardComponent);