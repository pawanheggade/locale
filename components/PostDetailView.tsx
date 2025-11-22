
import React, { useMemo, useState, useEffect } from 'react';
import { PostType, DisplayablePost, Account } from '../types';
import { HeartIcon, PencilIcon, SparklesIcon, ClockIcon, HashtagIcon, BellIcon, ShoppingBagIcon, ChatBubbleBottomCenterTextIcon, ArchiveBoxIcon, ArrowUturnLeftIcon, MapPinIcon, FlagIcon, ShareIcon, WalletIcon, PinIcon } from './Icons';
import { formatTimeRemaining, formatFullDate, renderWithMentions, formatFullDateTime, formatCurrency } from '../utils/formatters';
import { getPostStatus, findSimilarPosts, isAccountEligibleToPin } from '../utils/posts';
import { MediaCarousel } from './MediaCarousel';
import { PostAuthorInfo } from './PostAuthorInfo';
import { PostActionsDropdown } from './PostActionsDropdown';
import { usePosts } from '../contexts/PostsContext';
import { useAuth } from '../contexts/AuthContext';
import { LocaleChoiceBadge, CategoryBadge, TypeBadge } from './Badges';
import { PriceDisplay } from './PriceDisplay';
import { usePostActions } from '../contexts/PostActionsContext';
import { cn } from '../lib/utils';
import { PostList } from './PostList';
import { Button } from './ui/Button';

interface PostDetailViewProps {
  post: DisplayablePost;
  onBack: () => void;
  currentAccount: Account | null;
}

const PostDetailViewComponent: React.FC<PostDetailViewProps> = ({ 
  post,
  onBack, 
  currentAccount,
}) => {
  const postActions = usePostActions();
  const { onToggleLikePost, onArchive, onEdit, onViewMedia, onSetPriceAlert, onAddToBag, onContactStore, onRequestService, onViewAccount, onFilterByTag, onShowOnMap, onUnarchive, onToggleLikeAccount, onFilterByCategory, onReportItem, onShare, onFilterByType, onTogglePinPost, onViewBag, onToggleAvailabilityAlert } = postActions;
  
  const { posts } = usePosts();
  const { accountsById, likedPostIds, bag, priceAlerts, availabilityAlerts } = useAuth();
  const { archivedPosts } = usePosts();
  const [isAnimatingLike, setIsAnimatingLike] = useState(false);
  const [isAnimatingProfileLike, setIsAnimatingProfileLike] = useState(false);

  useEffect(() => {
    if (!post) return;

    const previousTitle = document.title;
    document.title = `${post.title} | Locale`;

    const setMeta = (name: string, content: string, attr: 'name' | 'property' = 'name') => {
      let element = document.querySelector(`meta[${attr}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    const shareUrl = `${window.location.origin}?post=${post.id}`;
    const description = post.description.length > 150 ? `${post.description.substring(0, 147)}...` : post.description;
    const image = post.media.length > 0 && post.media[0].type === 'image' ? post.media[0].url : '';

    setMeta('description', description);
    
    // Open Graph
    setMeta('og:title', post.title, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:url', shareUrl, 'property');
    setMeta('og:type', post.type === 'PRODUCT' ? 'product' : 'article', 'property');
    if (image) setMeta('og:image', image, 'property');

    // Twitter
    setMeta('twitter:card', image ? 'summary_large_image' : 'summary');
    setMeta('twitter:title', post.title);
    setMeta('twitter:description', description);
    if (image) setMeta('twitter:image', image);

    return () => {
      document.title = previousTitle;
    };
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
        <h2 className="text-2xl font-semibold text-gray-700">Post not found.</h2>
        <p className="text-gray-500 mt-2">This post may have been removed.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md">Go Back</button>
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

  const handleLikeClick = () => {
    const result = onToggleLikePost(post.id);
    if (result && !result.wasLiked) {
        setIsAnimatingLike(true);
    }
  };
  
  const handleProfileLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleLikeAccount) {
        if (!isAuthorLiked) {
            setIsAnimatingProfileLike(true);
        }
        onToggleLikeAccount(post.authorId);
    }
  };
  
  return (
    <div>
      <div className="animate-fade-in-up pb-28 p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
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
                <div className="flex justify-between items-center gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <TypeBadge type={post.type} onClick={() => onFilterByType(post.type)} />
                    <CategoryBadge category={post.category} onClick={() => onFilterByCategory(post.category)} />
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                      {!isOwnPost && (
                          <Button 
                            onClick={() => onReportItem(post)} 
                            variant="glass"
                            size="icon-sm"
                            className="text-gray-700"
                            aria-label="Report post"
                          >
                              <FlagIcon className="w-5 h-5 text-gray-500"/>
                          </Button>
                      )}
                      <Button 
                        onClick={() => onShare(post.id)} 
                        variant="glass"
                        size="icon-sm"
                        className="text-gray-700"
                        aria-label="Share post"
                      >
                          <ShareIcon className="w-5 h-5 text-gray-500" />
                      </Button>
                      {isOwnPost && (
                          <PostActionsDropdown 
                              post={post}
                              isArchived={isArchived}
                              currentAccount={currentAccount}
                              variant="modal"
                          />
                      )}
                  </div>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-4 leading-tight">{post.title}</h1>
                
                {post.aiReasoning && (
                    <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                        <p className="text-sm text-amber-900 flex items-start gap-2">
                            <SparklesIcon className="w-5 h-5 text-amber-50 shrink-0 mt-0.5" />
                            <span><span className="font-semibold">AI Insight:</span> {post.aiReasoning}</span>
                        </p>
                    </div>
                )}
                
                <PriceDisplay price={post.price} salePrice={post.salePrice} priceUnit={post.priceUnit} isExpired={isExpired} size="small" className="mt-4" />

                <div className="mt-4 pt-4 border-t space-y-3 text-sm text-gray-600">
                    {post.type === PostType.EVENT ? (
                        <>
                            {post.eventStartDate && (
                                <div className="flex items-center gap-2">
                                    <ClockIcon className="w-5 h-5 text-gray-400" />
                                    <span>Starts: <span className="font-semibold text-gray-800">{formatFullDateTime(post.eventStartDate)}</span></span>
                                </div>
                            )}
                             {post.eventEndDate && (
                                <div className="flex items-center gap-2">
                                    <ClockIcon className="w-5 h-5 text-gray-400" />
                                    <span>Ends: <span className="font-semibold text-gray-800">{formatFullDateTime(post.eventEndDate)}</span></span>
                                </div>
                            )}
                             {post.eventLocation && (
                                <div className="flex items-center gap-2">
                                    {post.eventCoordinates && (
                                        <Button
                                            onClick={() => onShowOnMap(post.id)}
                                            variant="glass"
                                            size="xs"
                                            className="flex-shrink-0 gap-1.5"
                                            aria-label="Maps"
                                        >
                                            <MapPinIcon className="w-4 h-4" />
                                            Maps
                                        </Button>
                                    )}
                                    <span className="truncate">Location: <span className="font-semibold text-gray-800">{post.eventLocation}</span></span>
                                </div>
                            )}
                        </>
                    ) : (
                        post.expiryDate && (
                            <div className="flex items-center gap-2">
                                <ClockIcon className={`w-5 h-5 ${isExpired ? 'text-red-500' : 'text-gray-400'}`} />
                                <span className={`${isExpired ? 'text-red-600 font-semibold' : ''}`}>{formatTimeRemaining(post.expiryDate)}</span>
                                <span>(Expires on {formatFullDate(post.expiryDate)})</span>
                            </div>
                        )
                    )}

                    <div className="flex items-center gap-2">
                      {post.type !== PostType.EVENT && post.coordinates && (
                        <Button
                          onClick={() => onShowOnMap(post.id)}
                          variant="glass"
                          size="xs"
                          className="flex-shrink-0 gap-1.5"
                          aria-label="Maps"
                        >
                          <MapPinIcon className="w-4 h-4" />
                          Maps
                        </Button>
                      )}
                      <span className="truncate">{post.location}</span>
                    </div>
                </div>
                
                <div className="mt-6 prose prose-sm max-w-none">
                  <p>{renderWithMentions(post.description, Array.from(accountsById.values()), onViewAccount)}</p>
                </div>
                
                {post.tags.length > 0 && (
                  <div className="mt-6 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <HashtagIcon className="w-5 h-5 text-gray-400" />
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map(tag => (
                          <button key={tag} onClick={() => onFilterByTag(tag)} className="px-2.5 py-1 text-gray-700 rounded-full text-xs font-medium glass-button-pill">
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Author and Seller Info */}
        {post.author && (
            <div className="mt-6 bg-white rounded-xl shadow-lg overflow-hidden p-6">
                <PostAuthorInfo author={post.author} post={post} onViewAccount={onViewAccount} size="medium" subscriptionBadgeIconOnly={true}>
                    {!isOwnPost && (
                        <button 
                            onClick={handleProfileLikeClick}
                            onAnimationEnd={() => setIsAnimatingProfileLike(false)}
                            className={cn(
                                'flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full transition-colors',
                                isAuthorLiked ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100',
                                isAnimatingProfileLike && 'animate-like-pop'
                            )}
                            aria-label={isAuthorLiked ? `Unlike ${post.author.name}'s profile` : `Like ${post.author.name}'s profile`}
                            title={isAuthorLiked ? 'Unlike profile' : 'Like profile'}
                        >
                            <HeartIcon isFilled={isAuthorLiked} className="w-6 h-6" /> 
                        </button>
                    )}
                </PostAuthorInfo>
                {post.author.subscription.tier !== 'Personal' && (
                  <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
                      {post.author.paymentMethods && post.author.paymentMethods.length > 0 && (
                          <div className="flex items-start gap-2 text-gray-600">
                              <WalletIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                              <div>
                                  <h4 className="font-semibold text-gray-800">Payment Methods</h4>
                                  <p>{post.author.paymentMethods.join(', ')}</p>
                              </div>
                          </div>
                      )}
                      {post.author.deliveryOptions && post.author.deliveryOptions.length > 0 && (
                           <div className="flex items-start gap-2 text-gray-600">
                              <ShoppingBagIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                              <div>
                                  <h4 className="font-semibold text-gray-800">Delivery Options</h4>
                                  <p>{post.author.deliveryOptions.join(', ')}</p>
                              </div>
                          </div>
                      )}
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
          <div className="backdrop-blur-lg shadow-[0_-8px_32px_rgba(0,0,0,0.1)] border-t border-black/5">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="py-3">
                      <div className="flex items-center gap-3">
                          {isOwnPost ? (
                              isArchived ? (
                                  <div className="grid grid-cols-1 gap-3 w-full">
                                      <Button
                                        onClick={() => {
                                          if (onUnarchive) {
                                            onUnarchive(post.id);
                                            onBack();
                                          }
                                        }}
                                        variant="glass"
                                        className="w-full gap-2 text-base font-semibold text-gray-800"
                                      >
                                          <ArrowUturnLeftIcon className="w-5 h-5"/>
                                          <span>Unarchive</span>
                                      </Button>
                                  </div>
                              ) : (
                                  <div className={cn("grid w-full gap-3", isEligibleToPin ? 'grid-cols-3' : 'grid-cols-2')}>
                                      <Button onClick={() => onEdit(post.id)} variant="glass" className="w-full gap-2 text-base font-semibold text-gray-800">
                                          <PencilIcon className="w-5 h-5"/>
                                          <span>Edit</span>
                                      </Button>
                                      {isEligibleToPin && (
                                          <Button onClick={() => onTogglePinPost(post.id)} variant="glass-red-light" className="w-full gap-2 text-base font-semibold">
                                              <PinIcon className="w-5 h-5" isFilled={post.isPinned} />
                                              <span>{post.isPinned ? 'Unpin' : 'Pin'}</span>
                                          </Button>
                                      )}
                                      <Button onClick={() => onArchive(post.id)} variant="glass-amber-light" className="w-full gap-2 text-base font-semibold">
                                          <ArchiveBoxIcon className="w-5 h-5"/>
                                          <span>Archive</span>
                                      </Button>
                                  </div>
                              )
                          ) : (
                              <>
                                  {isExpired && !isArchived ? (
                                      <Button
                                          onClick={() => onToggleAvailabilityAlert(post.id)}
                                          variant={isAvailabilityAlertSet ? "glass-red-light" : "glass-red"}
                                          className="flex-1 gap-2 text-base font-semibold"
                                          aria-label={isAvailabilityAlertSet ? "Remove availability alert" : "Notify when available"}
                                      >
                                          <BellIcon className="w-5 h-5" isFilled={isAvailabilityAlertSet} />
                                          <span>{isAvailabilityAlertSet ? 'Alert Set' : 'Notify when available'}</span>
                                      </Button>
                                  ) : isPurchasable ? (
                                      <Button
                                          onClick={isAddedToBag ? onViewBag : () => onAddToBag(post.id)}
                                          variant={isAddedToBag ? "glass-red-light" : "glass-red"}
                                          className="flex-1 gap-2 text-base font-semibold"
                                      >
                                          <ShoppingBagIcon className="w-5 h-5" isFilled={isAddedToBag} />
                                          <span>{isAddedToBag ? 'Go to Bag' : 'Add to Bag'}</span>
                                      </Button>
                                  ) : post.type === PostType.SERVICE ? (
                                      <Button onClick={() => onRequestService(post.authorId, post.id)} variant="glass-red" className="flex-1 gap-2 text-base font-semibold">
                                          <ChatBubbleBottomCenterTextIcon className="w-5 h-5"/>
                                          <span>Request Service</span>
                                      </Button>
                                  ) : (
                                      <Button onClick={() => onContactStore(post.authorId, post.id)} variant="glass-red" className="flex-1 gap-2 text-base font-semibold">
                                          <ChatBubbleBottomCenterTextIcon className="w-5 h-5"/>
                                          <span>Contact Organizer</span>
                                      </Button>
                                  )}
                                  <Button 
                                      onClick={handleLikeClick} 
                                      onAnimationEnd={() => setIsAnimatingLike(false)}
                                      variant={likedPostIds.has(post.id) ? "glass-red-light" : "glass"}
                                      size="icon-lg"
                                      className={cn(
                                          'flex-shrink-0 rounded-full transition-colors',
                                          isAnimatingLike && 'animate-like-pop'
                                      )}
                                      aria-label={likedPostIds.has(post.id) ? 'Unlike post' : 'Like post'}
                                      title={likedPostIds.has(post.id) ? 'Unlike post' : 'Like post'}
                                  >
                                      <HeartIcon isFilled={likedPostIds.has(post.id)} className="w-6 h-6"/>
                                  </Button>
                                  {isPurchasable && !isExpired && (
                                      <>
                                          <Button
                                              onClick={() => onSetPriceAlert(post.id)}
                                              variant={isAlertSet ? "glass-red-light" : "glass"}
                                              size="icon-lg"
                                              className="flex-shrink-0 rounded-full transition-colors"
                                              aria-label={isAlertSet ? 'Update price alert' : 'Set price alert'}
                                              title={isAlertSet ? 'Update price alert' : 'Set price alert'}
                                          >
                                              <BellIcon isFilled={isAlertSet} className="w-6 h-6"/>
                                          </Button>
                                          <Button
                                              onClick={() => onContactStore(post.authorId, post.id)}
                                              variant="glass"
                                              size="icon-lg"
                                              className="flex-shrink-0 rounded-full transition-colors text-gray-700"
                                              aria-label="Contact seller"
                                              title="Contact seller"
                                          >
                                              <ChatBubbleBottomCenterTextIcon className="w-6 h-6 text-red-600" />
                                          </Button>
                                      </>
                                  )}
                              </>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export const PostDetailView = React.memo(PostDetailViewComponent);
