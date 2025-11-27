
import React, { useMemo, useState, useEffect } from 'react';
import { PostType, DisplayablePost, Account } from '../types';
import { SparklesIcon, ClockIcon, BellIcon, ShoppingBagIcon, ChatBubbleBottomCenterTextIcon, ArchiveBoxIcon, ArrowUturnLeftIcon, MapPinIcon, FlagIcon, ShareIcon, CashIcon, PinIcon, PencilIcon } from './Icons';
import { formatTimeRemaining, formatFullDate, renderWithMentions, formatFullDateTime } from '../utils/formatters';
import { getPostStatus, findSimilarPosts, isAccountEligibleToPin } from '../utils/posts';
import { MediaCarousel } from './MediaCarousel';
import { PostAuthorInfo } from './PostAuthorInfo';
import { PostActionsDropdown } from './PostActionsDropdown';
import { usePosts } from '../contexts/PostsContext';
import { useAuth } from '../contexts/AuthContext';
import { useActivity } from '../contexts/ActivityContext';
import { LocaleChoiceBadge, CategoryBadge, TypeBadge } from './Badges';
import { PriceDisplay } from './PriceDisplay';
import { usePostActions } from '../contexts/PostActionsContext';
import { cn } from '../lib/utils';
import { PostList } from './PostList';
import { Button } from './ui/Button';
import { LikeButton } from './LikeButton';

interface PostDetailViewProps {
  post: DisplayablePost;
  onBack: () => void;
  currentAccount: Account | null;
}

// Helper component to reduce JSX repetition
const InfoRow: React.FC<{ icon: React.ElementType; children: React.ReactNode; className?: string; onClick?: () => void }> = ({ icon: Icon, children, className, onClick }) => (
    <div 
        className={cn("flex items-center gap-2 text-sm", className)}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
    >
        <Icon className={cn("w-4 h-4 shrink-0", onClick ? "text-red-400 transition-colors" : "text-gray-400")} />
        <span className={cn("truncate min-w-0", onClick ? "decoration-red-400 underline-offset-2" : "")}>
            {children}
        </span>
    </div>
);

const PostDetailViewComponent: React.FC<PostDetailViewProps> = ({ 
  post,
  onBack, 
  currentAccount,
}) => {
  const postActions = usePostActions();
  const { onToggleLikePost, onArchive, onEdit, onViewMedia, onSetPriceAlert, onAddToBag, onContactStore, onRequestService, onViewAccount, onFilterByTag, onShowOnMap, onUnarchive, onToggleLikeAccount, onFilterByCategory, onReportItem, onShare, onFilterByType, onTogglePinPost, onViewBag, onToggleAvailabilityAlert } = postActions;
  
  const { posts } = usePosts();
  const { accountsById, likedPostIds, bag } = useAuth();
  const { priceAlerts, availabilityAlerts } = useActivity();
  const { archivedPosts } = usePosts();

  useEffect(() => {
    if (!post) return;

    const previousTitle = document.title;
    document.title = `${post.title} | Locale`;

    // Simplified meta tag update logic
    const updateMeta = (property: string, content: string) => {
        let element = document.querySelector(`meta[property="${property}"]`) || document.createElement('meta');
        element.setAttribute('property', property);
        element.setAttribute('content', content);
        document.head.appendChild(element);
    };

    const description = post.description.length > 150 ? `${post.description.substring(0, 147)}...` : post.description;
    updateMeta('og:title', post.title);
    updateMeta('og:description', description);
    
    return () => { document.title = previousTitle; };
  }, [post]);

  const allPostsWithData = useMemo(() => {
      return posts.map(p => ({...p, author: accountsById.get(p.authorId)}))
  }, [posts, accountsById]);

  const relatedPosts = useMemo(() => {
      if (!post) return [];
      return findSimilarPosts(post, allPostsWithData, 3);
  }, [post, allPostsWithData]);
  
  const isLoadingRelated = false; 

  const isAddedToBag = useMemo(() => bag.some(item => item.postId === post.id), [bag, post.id]);
  const isAlertSet = useMemo(() => priceAlerts.some(alert => alert.postId === post.id), [priceAlerts, post.id]);
  const isAvailabilityAlertSet = useMemo(() => availabilityAlerts.some(alert => alert.postId === post.id), [availabilityAlerts, post.id]);

  if (!post) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-semibold text-gray-600">Post not found.</h2>
        <Button onClick={onBack} variant="overlay-red" className="mt-4">Go Back</Button>
      </div>
    );
  }

  const isSearchResult = !!post.aiReasoning;
  const isAuthorLiked = currentAccount?.likedAccountIds?.includes(post.authorId) ?? false;
  const isArchived = archivedPosts.some(p => p.id === post.id);

  const { isExpired } = getPostStatus(post.expiryDate);
  const isOwnPost = post.authorId === currentAccount?.id;
  const isEligibleToPin = isOwnPost && isAccountEligibleToPin(currentAccount);
  const isPurchasable = post.type === PostType.PRODUCT || (post.type === PostType.SERVICE && post.price !== undefined && post.price > 0);

  const handleMapClick = () => {
      if (post.type === PostType.EVENT ? post.eventCoordinates : post.coordinates) {
          onShowOnMap(post.id);
      }
  };
  
  return (
    <div>
      <div className="animate-fade-in-up pb-28 p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Media Section */}
            <div className="relative">
              {post.isLocaleChoice && isSearchResult && <LocaleChoiceBadge className="top-4 left-4" />}
              <MediaCarousel
                id={`postdetail-${post.id}`}
                media={post.media}
                onMediaClick={(idx) => onViewMedia(post.media, idx)}
                maxHeight="max-h-[70vh]"
              />
            </div>

            {/* Details Section */}
            <div className="flex flex-col">
              <div className="p-6 flex-grow">
                {/* Header Actions */}
                <div className="flex justify-between items-center gap-4 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <TypeBadge type={post.type} onClick={() => onFilterByType(post.type)} />
                    <span className="text-gray-400 font-light text-sm">/</span>
                    <CategoryBadge category={post.category} onClick={() => onFilterByCategory(post.category)} />
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                      {!isOwnPost && (
                          <Button 
                            onClick={() => onReportItem(post)} 
                            variant="ghost" 
                            size="icon-sm"
                            className="text-gray-500"
                            aria-label="Report post"
                            title="Report post"
                          >
                              <FlagIcon className="w-5 h-5"/>
                          </Button>
                      )}
                      <Button
                        onClick={() => onShare(post.id)}
                        variant="ghost"
                        size="icon-sm"
                        className="text-gray-500"
                        aria-label="Share post"
                        title="Share post"
                      >
                          <ShareIcon className="w-5 h-5" />
                      </Button>
                      <PostActionsDropdown post={post} isArchived={isArchived} currentAccount={currentAccount} variant="modal" />
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{post.title}</h1>
                
                {post.aiReasoning && (
                    <div className="mt-4 p-3 bg-amber-50 rounded-lg text-sm text-amber-900 flex items-start gap-2">
                        <SparklesIcon className="w-5 h-5 text-amber-50 shrink-0 mt-0.5" />
                        <span><span className="font-semibold">AI Insight:</span> {post.aiReasoning}</span>
                    </div>
                )}
                
                <div className="flex items-center gap-3 mt-4">
                    <PriceDisplay price={post.price} salePrice={post.salePrice} priceUnit={post.priceUnit} isExpired={isExpired} size="small" />
                    {!isOwnPost && isPurchasable && !isExpired && (
                        <Button
                            onClick={() => onSetPriceAlert(post.id)}
                            variant="ghost"
                            size="icon-sm"
                            className={cn(isAlertSet ? "text-red-600" : "text-gray-500")}
                            aria-label={isAlertSet ? "Manage price alert" : "Set price alert"}
                            title={isAlertSet ? "Price alert set" : "Set price alert"}
                        >
                            <BellIcon className="w-5 h-5" isFilled={isAlertSet} />
                        </Button>
                    )}
                </div>

                {/* Info Rows */}
                <div className="mt-4 pt-4 border-t space-y-3">
                    {post.type === PostType.EVENT ? (
                        <>
                            {post.eventStartDate && (
                                <InfoRow icon={ClockIcon} className="text-gray-600">
                                    Starts: <span className="font-semibold text-gray-800">{formatFullDateTime(post.eventStartDate)}</span>
                                </InfoRow>
                            )}
                             {post.eventEndDate && (
                                <InfoRow icon={ClockIcon} className="text-gray-600">
                                    Ends: <span className="font-semibold text-gray-800">{formatFullDateTime(post.eventEndDate)}</span>
                                </InfoRow>
                            )}
                             {post.eventLocation && (
                                <InfoRow 
                                    icon={MapPinIcon} 
                                    className={cn("group", post.eventCoordinates && "cursor-pointer")} 
                                    onClick={post.eventCoordinates ? handleMapClick : undefined}
                                >
                                    <span className={cn("font-semibold", post.eventCoordinates ? "text-red-400" : "text-gray-600")}>{post.eventLocation}</span>
                                </InfoRow>
                            )}
                        </>
                    ) : (
                        <>
                            {post.expiryDate && (
                                <InfoRow icon={ClockIcon} className={isExpired ? 'text-red-500' : 'text-gray-600'}>
                                    <span className={isExpired ? 'font-semibold' : ''}>{formatTimeRemaining(post.expiryDate)}</span>
                                    <span className="ml-1 text-gray-600">(Expires on {formatFullDate(post.expiryDate)})</span>
                                </InfoRow>
                            )}
                            <InfoRow 
                                icon={MapPinIcon} 
                                className={cn("group", post.coordinates && "cursor-pointer")}
                                onClick={post.coordinates ? handleMapClick : undefined}
                            >
                                <span className={cn(post.coordinates ? "text-red-400" : "text-gray-600")}>{post.location}</span>
                            </InfoRow>
                        </>
                    )}
                </div>
                
                <div className="mt-6 prose prose-sm max-w-none">
                  <p>{renderWithMentions(post.description, Array.from(accountsById.values()), onViewAccount, onFilterByTag)}</p>
                </div>
                
                {post.tags.length > 0 && (
                  <div className="mt-6 pt-4 border-t">
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
                        {post.tags.map(tag => (
                          <button
                            key={tag} 
                            onClick={() => onFilterByTag(tag)} 
                            className="text-sm text-gray-600 font-medium hover:text-gray-900 hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-red-500 rounded-sm"
                          >
                            #{tag}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Author Info */}
        {post.author && (
            <div className="mt-6 bg-white rounded-xl overflow-hidden p-6">
                <PostAuthorInfo author={post.author} post={post} onViewAccount={onViewAccount} size="medium" subscriptionBadgeIconOnly={true}>
                    {!isOwnPost && (
                        <LikeButton
                            isLiked={isAuthorLiked}
                            onToggle={() => { if (onToggleLikeAccount && post.author) onToggleLikeAccount(post.author); }}
                            className={cn(
                                'p-0',
                                isAuthorLiked ? 'text-red-600' : 'text-gray-500'
                            )}
                            variant="overlay-dark"
                            size="icon"
                            iconClassName="w-6 h-6"
                        />
                    )}
                </PostAuthorInfo>
                {post.author.subscription.tier !== 'Personal' && (
                  <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      {post.author.paymentMethods?.length ? (
                          <div className="flex items-start gap-2 text-gray-600">
                              <CashIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                              <div>
                                  <h4 className="font-semibold text-gray-800">Payment Methods</h4>
                                  <p>{post.author.paymentMethods.join(', ')}</p>
                              </div>
                          </div>
                      ) : null}
                      {post.author.deliveryOptions?.length ? (
                           <div className="flex items-start gap-2 text-gray-600">
                              <ShoppingBagIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                              <div>
                                  <h4 className="font-semibold text-gray-800">Delivery Options</h4>
                                  <p>{post.author.deliveryOptions.join(', ')}</p>
                              </div>
                          </div>
                      ) : null}
                  </div>
                )}
            </div>
        )}

        {/* Related Posts */}
        <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 px-4 sm:px-0">You might also like</h2>
            <PostList 
                posts={relatedPosts}
                isLoading={isLoadingRelated}
                currentAccount={currentAccount}
                variant="compact"
                hideAuthorInfo={true}
                hideExpiry={true}
            />
        </div>
      </div>

      {/* Persistent Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] animate-slide-in-up" style={{ animationDelay: '200ms' }}>
          <div className="bg-white border-t border-gray-100">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
                  <div className="flex flex-row items-center gap-3">
                      {isOwnPost ? (
                          <div className="flex flex-row gap-3 w-full">
                              {isArchived ? (
                                  <Button onClick={() => { if (onUnarchive) { onUnarchive(post.id); onBack(); }}} variant="overlay-dark" className="w-full gap-2 font-semibold text-gray-800">
                                      <ArrowUturnLeftIcon className="w-5 h-5"/> Unarchive
                                  </Button>
                              ) : (
                                  <>
                                    {isEligibleToPin && (
                                        <Button onClick={() => onTogglePinPost(post.id)} variant="overlay-red" className="flex-1 gap-2 font-semibold">
                                            <PinIcon className="w-5 h-5" isFilled={post.isPinned} /> {post.isPinned ? 'Unpin' : 'Pin'}
                                        </Button>
                                    )}
                                    <Button onClick={() => onEdit(post.id)} variant="overlay-dark" className="flex-1 gap-2 font-semibold text-gray-800">
                                        <PencilIcon className="w-5 h-5"/> Edit
                                    </Button>
                                    <Button onClick={() => onArchive(post.id)} variant="overlay-amber" className="flex-1 gap-2 font-semibold">
                                        <ArchiveBoxIcon className="w-5 h-5"/> Archive
                                    </Button>
                                  </>
                              )}
                          </div>
                      ) : (
                          <>
                              {isExpired && !isArchived ? (
                                  <Button onClick={() => onToggleAvailabilityAlert(post.id)} variant={isAvailabilityAlertSet ? "pill-lightred" : "pill-red"} className="flex-1 gap-2 font-semibold">
                                      <BellIcon className="w-5 h-5" isFilled={isAvailabilityAlertSet} />
                                      <span>{isAvailabilityAlertSet ? 'Alert Set' : 'Notify when available'}</span>
                                  </Button>
                              ) : (
                                  <>
                                      {isPurchasable && (
                                          <Button 
                                              onClick={() => onContactStore(post.authorId, post.id)}
                                              variant="overlay-dark"
                                              size="icon"
                                              className="text-gray-500 flex-shrink-0"
                                              aria-label="Contact Seller"
                                              title="Contact Seller"
                                          >
                                              <ChatBubbleBottomCenterTextIcon className="w-6 h-6"/> 
                                          </Button>
                                      )}
                                      <Button 
                                        onClick={() => {
                                            if (isPurchasable) isAddedToBag ? onViewBag() : onAddToBag(post.id);
                                            else if (post.type === PostType.SERVICE) onRequestService(post.authorId, post.id);
                                            else onContactStore(post.authorId, post.id);
                                        }}
                                        variant={isAddedToBag ? "pill-lightred" : "pill-red"}
                                        className="flex-1 gap-2 font-semibold"
                                      >
                                          {isPurchasable ? <ShoppingBagIcon className="w-5 h-5" isFilled={isAddedToBag} /> : <ChatBubbleBottomCenterTextIcon className="w-5 h-5"/>}
                                          <span>{isPurchasable ? (isAddedToBag ? 'Go to Bag' : 'Add to Bag') : (post.type === PostType.SERVICE ? 'Request Service' : 'Contact Organizer')}</span>
                                      </Button>
                                  </>
                              )}
                              
                              <LikeButton 
                                isLiked={likedPostIds.has(post.id)}
                                onToggle={() => onToggleLikePost(post.id)}
                                variant="overlay-dark"
                                size="icon"
                                className={likedPostIds.has(post.id) ? "text-red-600" : "text-gray-500"}
                                iconClassName="w-6 h-6"
                              />
                          </>
                      )}
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export const PostDetailView = React.memo(PostDetailViewComponent);
