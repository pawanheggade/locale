
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PostType, DisplayablePost, Account } from '../types';
import { HeartIcon, MapPinIcon, ClockIcon, ShoppingBagIcon, ChatBubbleBottomCenterTextIcon, PencilIcon, PinIcon, BellIcon } from './Icons';
import { formatTimeRemaining } from '../utils/formatters';
import { getPostStatus, isAccountEligibleToPin } from '../utils/posts';
import { MediaCarousel } from './MediaCarousel';
import { PostAuthorInfo } from './PostAuthorInfo';
import { useAuth } from '../contexts/AuthContext';
import { LocaleChoiceBadge } from './Badges';
import { PriceDisplay } from './PriceDisplay';
import { Card, CardContent, CardFooter, CardHeader } from './ui/Card';
import { usePostActions } from '../contexts/PostActionsContext';
import { cn } from '../lib/utils';
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
  const { onToggleLikePost, onViewDetails, onAddToBag, onContactStore, onRequestService, onViewAccount, onShowOnMap, onEdit, onTogglePinPost, onViewBag, onToggleAvailabilityAlert } = usePostActions();
  const { likedPostIds, bag, availabilityAlerts } = useAuth();
  
  const isAddedToBag = useMemo(() => bag.some(item => item.postId === post.id), [bag, post.id]);
  const isLiked = likedPostIds.has(post.id);
  const isAvailabilityAlertSet = useMemo(() => availabilityAlerts.some(alert => alert.postId === post.id), [availabilityAlerts, post.id]);

  const hasMedia = post.media && post.media.length > 0;
  const isCompact = variant === 'compact';
  
  const [isInView, setIsInView] = useState(!enableEntryAnimation);
  const [hasAnimated, setHasAnimated] = useState(!enableEntryAnimation);
  const [isAnimatingLike, setIsAnimatingLike] = useState(false);

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

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = onToggleLikePost(post.id);
    
    // Animate only on "liking", not "unliking".
    if (result && !result.wasLiked) {
      setIsAnimatingLike(true);
    }
  };
  
  const actionIcon = useMemo(() => {
    if (isPurchasable) {
        return <ShoppingBagIcon className="w-5 h-5 text-red-600" isFilled={isAddedToBag} />;
    }
    switch (post.type) {
      case PostType.SERVICE:
        return <ChatBubbleBottomCenterTextIcon className="w-5 h-5 text-red-600" />;
      case PostType.EVENT:
        return <ChatBubbleBottomCenterTextIcon className="w-5 h-5 text-red-600" />;
      default:
        return <ChatBubbleBottomCenterTextIcon className="w-5 h-5 text-red-600" />;
    }
  }, [post.type, isPurchasable, isAddedToBag]);
  
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
        'group cursor-pointer shadow-lg shadow-gray-900/5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
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
                    variant="glass-dark"
                    size="icon-sm"
                    className={cn(post.isPinned ? 'text-red-500' : 'text-white')}
                    aria-label={post.isPinned ? 'Unpin post' : 'Pin post'}
                    title={post.isPinned ? 'Unpin post' : 'Pin post'}
                >
                    <PinIcon isFilled={!!post.isPinned} className="w-5 h-5" />
                </Button>
            ) : !isOwnPost && (
              <Button
                onClick={handleLikeClick}
                onAnimationEnd={() => setIsAnimatingLike(false)}
                variant="glass-dark"
                size="icon-sm"
                className={cn(isLiked ? 'text-red-500' : 'text-white', isAnimatingLike && 'animate-like-pop')}
                aria-label={isLiked ? 'Unlike post' : 'Like post'}
                title={isLiked ? 'Unlike post' : 'Like post'}
              >
                  <HeartIcon isFilled={isLiked} className="w-5 h-5" />
              </Button>
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
              className="text-left w-full focus:outline-none focus:underline decoration-2 underline-offset-2 hover:text-red-600 transition-colors"
            >
              {post.title}
            </button>
          </h3>
          
          <PriceDisplay price={post.price} salePrice={post.salePrice} priceUnit={post.priceUnit} size={isCompact ? 'x-small' : 'small'} className="mt-2" isExpired={isExpired} showOriginalPriceOnSale={!isCompact} />
          
          <div className={cn("flex items-center gap-1.5 mt-2 min-w-0", isCompact ? 'text-xs' : 'text-sm')}>
             <div
                className={cn(
                    "flex items-center gap-1.5 min-w-0 text-red-400",
                    coordsToUse ? "cursor-pointer hover:text-red-600 group transition-colors" : ""
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
                <MapPinIcon className={cn("w-4 h-4 shrink-0", coordsToUse ? "text-red-400 group-hover:text-red-600 transition-colors" : "text-red-400")} />
                <span className={cn("truncate", coordsToUse ? "group-hover:underline decoration-red-400 underline-offset-2" : "")}>
                    {locationToDisplay}
                </span>
             </div>
          </div>
          
          {!hideExpiry && post.expiryDate && (
            <div className={cn("flex items-center gap-2 mt-3", isCompact ? 'text-xs' : 'text-sm', isExpired ? 'text-red-600' : 'text-gray-500')}>
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
                      variant="glass"
                      size={isCompact ? 'icon-sm' : 'icon'}
                      className="flex-shrink-0 text-gray-600"
                      aria-label="Edit post"
                      title="Edit post"
                    >
                        <PencilIcon className="w-5 h-5" />
                    </Button>
                ) : isExpired ? (
                    <Button
                        onClick={(e) => { e.stopPropagation(); onToggleAvailabilityAlert(post.id); }}
                        variant={isAvailabilityAlertSet ? "glass-red-light" : "glass"}
                        size={isCompact ? 'icon-sm' : 'icon'}
                        className="flex-shrink-0 text-red-600"
                        aria-label={isAvailabilityAlertSet ? "Remove availability alert" : "Notify when available"}
                        title={isAvailabilityAlertSet ? "Alert Set" : "Notify when available"}
                    >
                        <BellIcon className="w-5 h-5" isFilled={isAvailabilityAlertSet} />
                    </Button>
                ) : (
                    <Button
                      onClick={handleActionClick}
                      variant="glass"
                      size={isCompact ? 'icon-sm' : 'icon'}
                      className="flex-shrink-0 text-red-600"
                      aria-label={isPurchasable ? (isAddedToBag ? 'View in bag' : 'Add to bag') : (post.type === PostType.SERVICE ? 'Request service' : 'Contact organizer')}
                      title={isPurchasable ? (isAddedToBag ? 'View in bag' : 'Add to bag') : (post.type === PostType.SERVICE ? 'Request service' : 'Contact organizer')}
                    >
                        {actionIcon}
                    </Button>
                )}
            </PostAuthorInfo>
          </CardFooter>
      )}
    </Card>
  );
};

export const PostCard = React.memo(PostCardComponent);
