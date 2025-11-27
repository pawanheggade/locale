import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PostType, DisplayablePost, Account } from '../types';
import { MapPinIcon, ClockIcon, ShoppingBagIcon, ChatBubbleBottomCenterTextIcon, PencilIcon, PinIcon, BellIcon } from './Icons';
import { formatTimeRemaining } from '../utils/formatters';
import { getPostStatus, isAccountEligibleToPin } from '../utils/posts';
import { MediaCarousel } from './MediaCarousel';
import { PostAuthorInfo } from './PostAuthorInfo';
import { useAuth } from '../contexts/AuthContext';
import { LocaleChoiceBadge, CategoryBadge } from './Badges';
import { PriceDisplay } from './PriceDisplay';
import { Card, CardContent, CardFooter, CardHeader } from './ui/Card';
import { usePostActions } from '../contexts/PostActionsContext';
import { cn } from '../lib/utils';
import { LikeButton } from './LikeButton';
import { Button } from './ui/Button';

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
}

const PostCardComponent: React.FC<PostCardProps> = ({ post, index, currentAccount, isSearchResult = false, isArchived = false, hideAuthorInfo = false, variant = 'default', hideExpiry = false, enableEntryAnimation = false }) => {
  const { onToggleLikePost, onViewDetails, onAddToBag, onContactStore, onRequestService, onViewAccount, onShowOnMap, onEdit, onTogglePinPost, onViewBag, onToggleAvailabilityAlert, onFilterByCategory, onFilterByTag } = usePostActions();
  const { likedPostIds, bag, availabilityAlerts } = useAuth();
  
  const isAddedToBag = useMemo(() => bag.some(item => item.postId === post.id), [bag, post.id]);
  const isLiked = likedPostIds.has(post.id);
  const isAvailabilityAlertSet = useMemo(() => availabilityAlerts.some(alert => alert.postId === post.id), [availabilityAlerts, post.id]);

  const hasMedia = post.media && post.media.length > 0;
  const isCompact = variant === 'compact';
  
  const [isInView, setIsInView] = useState(!enableEntryAnimation);
  const [hasAnimated, setHasAnimated] = useState(!enableEntryAnimation);

  const cardRef = useRef<HTMLDivElement>(null);

  const dateForStatus = post.type === PostType.EVENT ? post.eventStartDate : post.expiryDate;
  const { isExpired } = getPostStatus(dateForStatus);
  const isOwnPost = post.authorId === currentAccount?.id;
  const isEligibleToPin = isOwnPost && isAccountEligibleToPin(currentAccount);

  const isPurchasable = post.type === PostType.PRODUCT || (post.type === PostType.SERVICE && post.price !== undefined && post.price > 0);

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
  
  const ActionIcon = useMemo(() => {
    if (isPurchasable) {
        return ShoppingBagIcon;
    }
    // For Service and Event, use ChatBubbleBottomCenterTextIcon
    return ChatBubbleBottomCenterTextIcon;
  }, [isPurchasable]);
  
  const handleActionClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isPurchasable) {
        if (isAddedToBag) {
          onViewBag();
        } else {
          onAddToBag(post.id);
        }
        return;
      }
      switch (post.type) {
          case PostType.SERVICE: onRequestService(post.authorId, post.id); break;
          case PostType.EVENT: onContactStore(post.authorId, post.id); break;
      }
  };

  const locationToDisplay = (post.type === PostType.EVENT && post.eventLocation) ? post.eventLocation : post.location;
  const coordsToUse = (post.type === PostType.EVENT && post.eventCoordinates) ? post.eventCoordinates : post.coordinates;

  return (
    <Card
      ref={cardRef}
      className={cn(
        'group cursor-pointer transition-all duration-300',
        enableEntryAnimation && (hasAnimated ? 'animate-fade-in-up' : 'opacity-0 translate-y-4')
      )}
      style={{ animationDelay: (enableEntryAnimation && !isCompact) ? `${Math.min(index * 75, 500)}ms` : '0ms' }}
      onClick={() => onViewDetails(post)}
      role="article"
      aria-labelledby={`post-title-${post.id}`}
    >
      <CardHeader className="relative">
        {hasMedia && (
          <MediaCarousel
            id={`postcard-${post.id}`}
            media={post.media}
            isInView={isInView}
            aspectRatio={isCompact ? 'aspect-square' : 'aspect-[4/3]'}
          />
        )}
        {post.isLocaleChoice && isSearchResult && <LocaleChoiceBadge className="top-3 left-3" />}
        <div className="absolute top-3 right-3 flex items-center gap-2">
            {isEligibleToPin ? (
                <Button
                    onClick={(e) => { e.stopPropagation(); onTogglePinPost(post.id); }}
                    variant="overlay"
                    size="icon-sm"
                    className={cn(
                        post.isPinned ? "text-red-600" : "text-white"
                    )}
                    aria-label={post.isPinned ? 'Unpin post' : 'Pin post'}
                    title={post.isPinned ? 'Unpin post' : 'Pin post'}
                >
                    <PinIcon isFilled={!!post.isPinned} className="w-5 h-5" />
                </Button>
            ) : !isOwnPost && (
              <LikeButton
                isLiked={isLiked}
                onToggle={() => onToggleLikePost(post.id)}
                variant="overlay"
                size="icon-sm"
                className={cn(
                    isLiked ? "text-red-600" : "text-white"
                )}
                iconClassName="w-5 h-5"
              />
            )}
        </div>
      </CardHeader>
      
      <CardContent className={isCompact ? 'p-3' : 'p-4'}>
        <div className="flex-grow">
          <h3
            id={`post-title-${post.id}`}
            className={cn(
              'font-bold text-gray-800 transition-colors line-clamp-2 leading-tight',
              isCompact ? 'text-base' : 'text-lg'
            )}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(post);
              }}
              className="text-left w-full focus:outline-none focus:underline decoration-2 underline-offset-2 transition-colors"
            >
              {post.title}
            </button>
          </h3>
          
          <PriceDisplay price={post.price} salePrice={post.salePrice} priceUnit={post.priceUnit} size={isCompact ? 'x-small' : 'small'} className="mt-2" isExpired={isExpired} showOriginalPriceOnSale={!isCompact} />
          
          <div className="flex flex-wrap items-center gap-2 mt-3 mb-1">
             <CategoryBadge 
                category={post.category} 
                onClick={(e) => { e.stopPropagation(); onFilterByCategory(post.category); }} 
                className="text-[10px] h-auto min-h-0" 
             />
             {!isCompact && post.tags.slice(0, 2).map(tag => (
                 <button 
                    key={tag}
                    onClick={(e) => { e.stopPropagation(); onFilterByTag(tag); }}
                    className="text-[10px] text-gray-600 cursor-pointer truncate max-w-[80px] focus:outline-none focus-visible:ring-1 focus-visible:ring-red-500 rounded-sm"
                 >
                    #{tag}
                 </button>
             ))}
          </div>

          <div className={cn("flex items-center gap-1.5 mt-2 min-w-0", isCompact ? 'text-xs' : 'text-sm')}>
             <div
                className={cn(
                    "flex items-center gap-1.5 min-w-0 text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-md",
                    coordsToUse ? "cursor-pointer group transition-colors" : ""
                )}
                onClick={(e) => {
                    if (coordsToUse) {
                        e.stopPropagation();
                        onShowOnMap(post.id);
                    }
                }}
                role={coordsToUse ? "button" : undefined}
                tabIndex={coordsToUse ? 0 : undefined}
                onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && coordsToUse) {
                        e.preventDefault();
                        e.stopPropagation();
                        onShowOnMap(post.id);
                    }
                }}
                title={coordsToUse ? "View on Map" : undefined}
             >
                <MapPinIcon className={cn("w-4 h-4 shrink-0", coordsToUse ? "text-red-400 transition-colors" : "text-red-400")} />
                <span className={cn("truncate", coordsToUse ? "decoration-red-400 underline-offset-2" : "")}>
                    {locationToDisplay}
                </span>
             </div>
          </div>
          
          {!hideExpiry && post.expiryDate && (
            <div className={cn("flex items-center gap-2 mt-3", isCompact ? 'text-xs' : 'text-sm', isExpired ? 'text-red-600' : 'text-gray-600')}>
              <ClockIcon className="w-4 h-4" />
              <span aria-label={`Expires ${formatTimeRemaining(post.expiryDate)}`}>{formatTimeRemaining(post.expiryDate)}</span>
            </div>
          )}
        </div>
      </CardContent>

      {!hideAuthorInfo && post.author && !isCompact && (
          <CardFooter className={isCompact ? 'p-2 border-t' : 'p-3 border-t'}>
            <PostAuthorInfo 
                author={post.author} 
                post={post} 
                onViewAccount={onViewAccount}
                showAvatar={!isCompact}
                subscriptionBadgeIconOnly={true}
            >
                {isOwnPost ? (
                    <Button
                      onClick={(e) => { e.stopPropagation(); onEdit(post.id); }}
                      variant="overlay-dark"
                      size="icon-sm"
                      className="flex-shrink-0 text-gray-500 active:scale-95"
                      aria-label="Edit post"
                      title="Edit post"
                    >
                        <PencilIcon className="w-5 h-5" />
                    </Button>
                ) : isExpired ? (
                    <Button
                        onClick={(e) => { e.stopPropagation(); onToggleAvailabilityAlert(post.id); }}
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
                    <Button
                      onClick={handleActionClick}
                      variant="ghost"
                      size="icon-sm"
                      className={cn(
                          "flex-shrink-0 active:scale-95",
                          isPurchasable && isAddedToBag ? "text-red-600" : "text-gray-500"
                      )}
                      aria-label={isPurchasable ? (isAddedToBag ? 'View in bag' : 'Add to bag') : (post.type === PostType.SERVICE ? 'Request service' : 'Contact organizer')}
                      title={isPurchasable ? (isAddedToBag ? 'View in bag' : 'Add to bag') : (post.type === PostType.SERVICE ? 'Request service' : 'Contact organizer')}
                    >
                        <ActionIcon className="w-5 h-5" isFilled={isPurchasable && isAddedToBag} />
                    </Button>
                )}
            </PostAuthorInfo>
          </CardFooter>
      )}
    </Card>
  );
};

export const PostCard = React.memo(PostCardComponent);