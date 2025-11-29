

import React, { useState, useCallback, useEffect, useMemo, useRef, Suspense } from 'react';
import { DisplayablePost, PostActions, NotificationSettings, Notification, Account, ModalState, Subscription, Report, AdminView, AppView, SavedSearch, SavedSearchFilters, Post, PostType, ContactOption, ForumPost, ForumComment, DisplayableForumPost, DisplayableForumComment, Feedback } from './types';
import { Header } from './components/Header';
import { PostList } from './components/PostList';
import PullToRefreshIndicator from './components/PullToRefreshIndicator';
import { useUI } from './contexts/UIContext';
import { useFilters } from './contexts/FiltersContext';
import { useAuth } from './contexts/AuthContext';
import { usePosts } from './contexts/PostsContext';
import { useForum } from './contexts/ForumContext';
import { useActivity } from './contexts/ActivityContext';
import { usePostFilters } from './hooks/usePostFilters';
import { usePersistentState } from './hooks/usePersistentState';
import { usePullToRefresh } from './hooks/usePullToRefresh';
import { useInfiniteScroll } from './hooks/useInfiniteScroll';
import ErrorBoundary from './components/ErrorBoundary';
import { AppModals } from './components/AppModals';
import { PostDetailView } from './components/PostDetailView';
import { ForumsPostDetailView } from './components/ForumsPostDetailView';
import { PostActionsContext } from './contexts/PostActionsContext';
import { GuestPrompt } from './components/GuestPrompt';
import { CreatePostPage } from './components/CreatePostPage';
import { useDebounce } from './hooks/useDebounce';
import { cn } from './lib/utils';
import { SubscriptionPage } from './components/SubscriptionPage';
import { generateHistoryBasedRecommendations } from './utils/posts';
import { geocodeLocation, reverseGeocode, haversineDistance } from './utils/geocoding';
import { OfflineIndicator } from './components/OfflineIndicator';
import { SettingsPage } from './components/SettingsPage';
import { ActivityPage } from './components/ActivityPage';
import { useConfirmationModal } from './hooks/useConfirmationModal';
import { useIsMounted } from './hooks/useIsMounted';
import { LoadingFallback } from './components/ui/LoadingFallback';

// Lazy loaded components to reduce initial bundle size
const MapView = React.lazy(() => import('./components/MapView').then(module => ({ default: module.MapView })));
const AdminPanel = React.lazy(() => import('./components/AdminPanel').then(module => ({ default: module.AdminPanel })));
const AccountView = React.lazy(() => import('./components/AccountView').then(module => ({ default: module.AccountView })));
const LikesView = React.lazy(() => import('./components/LikesView').then(module => ({ default: module.LikesView })));
const BagView = React.lazy(() => import('./components/BagView').then(module => ({ default: module.BagView })));
const AccountAnalyticsView = React.lazy(() => import('./components/AccountAnalyticsView').then(module => ({ default: module.AccountAnalyticsView })));
const NearbyPostsView = React.lazy(() => import('./components/NearbyPostsView').then(module => ({ default: module.NearbyPostsView })));
const ForumsView = React.lazy(() => import('./components/ForumsView').then(module => ({ default: module.ForumsView })));

interface HistoryItem {
    view: AppView;
    mainView: 'grid' | 'map';
    viewingPostId: string | null;
    viewingAccount: Account | null;
    viewingForumPostId: string | null;
}

const NOTIFICATION_SETTINGS_KEY = 'localeAppNotifSettings';

export const App: React.FC = () => {
  const { 
    currentAccount, accounts, accountsById, signOut: authSignOut, 
    likedPostIds, deleteAccount, toggleAccountStatus, updateSubscription, updateAccountRole, approveAccount, rejectAccount, upgradeToSeller, updateAccountDetails,
    bag, 
    addPostToViewHistory, viewedPostIds, savedSearches,
    reports, setReports, feedbackList, setFeedbackList, termsContent, setTermsContent, privacyContent, setPrivacyContent,
    addReport, addForumReport, addFeedback, toggleLikePost, toggleLikeAccount, incrementProfileViews
  } = useAuth();
  
  const { 
    notifications, markAsRead, priceAlerts, setPriceAlert, deletePriceAlert, availabilityAlerts, setAvailabilityAlert, deleteAvailabilityAlert,
    addNotification
  } = useActivity();

  const { 
    posts: allDisplayablePosts, archivedPosts, categories, allAvailableTags, createPost: createPostInContext, updatePost: updatePostInContext, archivePost, unarchivePost, deletePostPermanently, addCategory, updateCategory, deleteCategory, findPostById,
    togglePinPost, priceUnits, addPriceUnit, updatePriceUnit, deletePriceUnit, refreshPosts
  } = usePosts();
  
  const { posts: forumPosts, getPostWithComments, deletePost: deleteForumPost, deleteComment: deleteForumComment, findForumPostById, categories: forumCategories, addCategory: addForumCategory, updateCategory: updateForumCategory, deleteCategory: deleteForumCategory } = useForum();
  const { activeModal, openModal, closeModal, addToast } = useUI();
  const showConfirmation = useConfirmationModal();
  const isMounted = useIsMounted();

  const { filterState, dispatchFilterAction, handleAiSearchSubmit, handleToggleAiSearch, onClearFilters, isAnyFilterActive } = useFilters();
  const debouncedSearchQuery = useDebounce(filterState.searchQuery, 300);

  const [view, setView] = useState<AppView>('all');
  const [mainView, setMainView] = useState<'grid' | 'map'>('grid');
  const [gridView, setGridView] = usePersistentState<'default' | 'compact'>('localeAppGridView', 'default');
  const [viewingPostId, setViewingPostId] = useState<string | null>(null);
  const [viewingForumPostId, setViewingForumPostId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isFindingNearby, setIsFindingNearby] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [viewingAccount, setViewingAccount] = useState<Account | null>(null);
  const [postToFocusOnMap, setPostToFocusOnMap] = useState<string | null>(null);
  const [locationToFocus, setLocationToFocus] = useState<{ coords: { lat: number; lng: number; }; name: string; } | null>(null);
  const [adminInitialView, setAdminInitialView] = useState<AdminView>();
  const [isScrolled, setIsScrolled] = useState(false);
  const [nearbyPostsResult, setNearbyPostsResult] = useState<{ posts: DisplayablePost[], locationName: string | null } | null>(null);
  const [recentSearches, setRecentSearches] = usePersistentState<string[]>('localeAppRecentSearches', []);
  
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollTopRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const mainContentRef = useRef<HTMLDivElement>(null);

  const [notificationSettings, setNotificationSettings] = usePersistentState<NotificationSettings>(NOTIFICATION_SETTINGS_KEY, { expiryAlertsEnabled: true, expiryThresholdDays: 3 });

  useEffect(() => {
    setIsInitialLoading(false); 
  }, []);

  useEffect(() => {
    if (viewingAccount && accountsById.has(viewingAccount.id)) {
      const freshAccount = accountsById.get(viewingAccount.id);
      if (freshAccount && JSON.stringify(freshAccount) !== JSON.stringify(viewingAccount)) {
        setViewingAccount(freshAccount);
      }
    }
  }, [accountsById, viewingAccount]);

  const handleUpdateNotificationSettings = (newSettings: NotificationSettings) => {
    setNotificationSettings(newSettings);
    addToast('Settings saved!', 'success');
  };

  const navigateTo = useCallback((
      newView: AppView,
      options: { postId?: string; account?: Account, forumPostId?: string } = {}
  ) => {
      const isSameView = view === newView;
      const isSamePost = viewingPostId === (options.postId || null);
      const isSameAccount = viewingAccount?.id === (options.account?.id || null);
      const isSameForumPost = viewingForumPostId === (options.forumPostId || null);

      if (isSameView && isSamePost && isSameAccount && isSameForumPost) return;

      if (newView === 'createPost' && currentAccount?.subscription.tier === 'Personal') {
          setView('subscription');
          addToast('You need a seller account to create posts.', 'error');
          return;
      }

      if (newView === 'postDetail' && options.postId && currentAccount) {
        addPostToViewHistory(options.postId);
      }

      if (newView === 'account' && options.account) {
          incrementProfileViews(options.account.id);
      }

      setHistory(h => [...h, { view, mainView, viewingPostId, viewingAccount, viewingForumPostId }]);

      setView(newView);
      setViewingPostId(options.postId || null);
      setViewingAccount(options.account || null);
      setViewingForumPostId(options.forumPostId || null);
      if (mainContentRef.current) mainContentRef.current.scrollTop = 0;
  }, [view, mainView, viewingPostId, viewingAccount, viewingForumPostId, currentAccount, addPostToViewHistory, addToast, incrementProfileViews]);

  const handleNotificationClick = useCallback((notification: Notification) => {
    markAsRead(notification.id);
    
    if (notification.postId) {
        navigateTo('postDetail', { postId: notification.postId });
    } else if (notification.relatedAccountId) {
        const account = accountsById.get(notification.relatedAccountId);
        if (account) navigateTo('account', { account });
    } else if (notification.forumPostId) {
        navigateTo('forumPostDetail', { forumPostId: notification.forumPostId });
    }
  }, [markAsRead, navigateTo, accountsById]);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    refreshPosts(); 
    setTimeout(() => {
        if (isMounted()) {
            setIsRefreshing(false);
            addToast('Refreshed', 'success');
        }
    }, 800);
  }, [isRefreshing, refreshPosts, addToast, isMounted]);

  const { pullPosition, touchHandlers, isPulling, pullThreshold } = usePullToRefresh({ onRefresh: handleRefresh, mainContentRef, isRefreshing, disabled: view !== 'all' || mainView !== 'grid' });

  const withAuthCheck = useCallback((action: (...args: any[]) => any) => {
    return (...args: any[]) => {
        if (!currentAccount) {
            openModal({ type: 'login' });
            return;
        }
        return action(...args);
    };
  }, [currentAccount, openModal]);

  const handleSearchSubmit = useCallback((query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;
    setRecentSearches(prev => {
      const lowercasedQuery = trimmedQuery.toLowerCase();
      const newSearches = [trimmedQuery, ...prev.filter(s => s.toLowerCase() !== lowercasedQuery)];
      return newSearches.slice(0, 10);
    });
  }, [setRecentSearches]);

  const handleToggleFeedbackArchive = (feedbackId: string) => {
      setFeedbackList(prev => prev.map(f => f.id === feedbackId ? { ...f, isArchived: !f.isArchived } : f));
      addToast('Feedback updated.', 'success');
  };

  const handleDeleteFeedback = (feedbackId: string) => {
      showConfirmation({
        title: 'Delete Feedback',
        message: 'Are you sure you want to delete this feedback?',
        onConfirm: () => {
            setFeedbackList(prev => prev.filter(f => f.id !== feedbackId));
            addToast('Feedback deleted.', 'success');
        },
        confirmText: 'Delete',
        confirmClassName: 'bg-red-600 text-white',
      });
  };

  const handleMarkFeedbackAsRead = (feedbackId: string) => {
    setFeedbackList(prev => prev.map(f => f.id === feedbackId ? { ...f, isRead: true } : f));
  };

  const handleBulkFeedbackAction = (ids: string[], action: 'markRead' | 'archive' | 'unarchive' | 'delete') => {
      if (action === 'delete') {
          showConfirmation({
            title: 'Delete Feedback',
            message: `Are you sure you want to delete ${ids.length} feedback items?`,
            onConfirm: () => {
                setFeedbackList(prev => prev.filter(f => !ids.includes(f.id)));
                addToast(`${ids.length} feedback items deleted.`, 'success');
            },
            confirmText: 'Delete',
            confirmClassName: 'bg-red-600 text-white',
          });
      } else {
          setFeedbackList(prev => {
              return prev.map(f => {
                  if (ids.includes(f.id)) {
                      if (action === 'markRead') return { ...f, isRead: true };
                      if (action === 'archive') return { ...f, isArchived: true };
                      if (action === 'unarchive') return { ...f, isArchived: false };
                  }
                  return f;
              });
          });
          addToast(`${ids.length} feedback items updated.`, 'success');
      }
  };

  const handleClearRecentSearchesConfirm = useCallback(() => {
      if (recentSearches.length === 0) return;
      showConfirmation({
        title: 'Clear Recent Searches',
        message: 'Are you sure you want to clear your search history?',
        onConfirm: () => {
            setRecentSearches([]);
            addToast('Search history cleared.', 'success');
        },
        confirmText: 'Clear History',
        confirmClassName: 'bg-red-600 text-white',
      });
  }, [recentSearches.length, showConfirmation, setRecentSearches, addToast]);

  const handleAiSearchSubmitWithHistory = useCallback((query: string) => {
    handleSearchSubmit(query);
    handleAiSearchSubmit(query);
  }, [handleAiSearchSubmit, handleSearchSubmit]);

  const performSignOut = useCallback(() => {
    authSignOut();
    setView('all');
    setMainView('grid');
    setViewingAccount(null);
    setViewingPostId(null);
    setViewingForumPostId(null);
    setHistory([]);
    if (mainContentRef.current) {
        mainContentRef.current.scrollTop = 0;
    }
  }, [authSignOut]);

  const requestSignOut = useCallback(() => {
    showConfirmation({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      onConfirm: performSignOut,
      confirmText: 'Sign Out',
      confirmClassName: 'bg-red-600 text-white',
    });
  }, [showConfirmation, performSignOut]);

  const archiveAndSignOut = () => {
    if (currentAccount) {
        toggleAccountStatus(currentAccount.id);
        performSignOut();
        addToast('Account archived and signed out.', 'success');
    }
  };

  const requestArchiveAccount = () => {
    showConfirmation({
      title: 'Archive Account',
      message: 'Are you sure you want to archive your account? You will be signed out and your posts will be hidden. You can reactivate by signing in again.',
      onConfirm: archiveAndSignOut,
      confirmText: 'Archive & Sign Out',
      confirmClassName: 'bg-amber-600 text-white',
    });
  };

  const handleBack = useCallback(() => {
      if (view === 'all' && isAnyFilterActive) {
          onClearFilters();
          return;
      }
      if (history.length > 0) {
          const previousState = history[history.length - 1];
          setHistory(h => h.slice(0, -1));

          setView(previousState.view);
          setMainView(previousState.mainView);
          setViewingPostId(previousState.viewingPostId);
          setViewingAccount(previousState.viewingAccount);
          setViewingForumPostId(previousState.viewingForumPostId);
          if (mainContentRef.current) mainContentRef.current.scrollTop = 0;
      }
  }, [history, view, isAnyFilterActive, onClearFilters]);

  const handleMainViewChange = useCallback((newMainView: 'grid' | 'map') => {
      if (mainView === newMainView) return;
      setHistory(h => [...h, { view, mainView, viewingPostId, viewingAccount, viewingForumPostId }]);
      setMainView(newMainView);
  }, [view, mainView, viewingPostId, viewingAccount, viewingForumPostId]);

  const postActions: PostActions = useMemo(() => ({
    onToggleLikePost: (postId) => {
        if (!currentAccount) { openModal({ type: 'login' }); return; }
        return toggleLikePost(postId); 
    },
    onArchive: archivePost,
    onUnarchive: unarchivePost,
    onDeletePermanently: deletePostPermanently,
    onEdit: (postId) => navigateTo('editPost', { postId }),
    onViewMedia: (media, startIndex) => openModal({ type: 'viewMedia', data: { media, startIndex } }),
    onViewDetails: (post) => navigateTo('postDetail', { postId: post.id }),
    onShare: (postId) => { const post = findPostById(postId); if (post) openModal({ type: 'sharePost', data: post }); },
    onReportItem: withAuthCheck((item) => openModal({ type: 'reportItem', data: { item } })),
    onSetPriceAlert: withAuthCheck((postId) => { const post = findPostById(postId); if (post) openModal({ type: 'setPriceAlert', data: post }); }),
    onToggleAvailabilityAlert: withAuthCheck((postId) => {
       const existing = availabilityAlerts.find(a => a.postId === postId);
       existing ? deleteAvailabilityAlert(postId) : setAvailabilityAlert(postId);
    }),
    onAddToBag: withAuthCheck((postId) => { const post = findPostById(postId); if (post) openModal({ type: 'addToBag', data: post }); }),
    onViewBag: () => navigateTo('bag'),
    onContactStore: withAuthCheck((authorId, postId) => {
      const author = accountsById.get(authorId);
      const post = findPostById(postId);
      if (author && post) openModal({ type: 'contactStore', data: { author, post } });
    }),
    onRequestService: withAuthCheck((authorId, postId) => {
      const author = accountsById.get(authorId);
      const post = findPostById(postId);
      if (author && post) openModal({ type: 'contactStore', data: { author, post, prefilledMessage: `Hi, I'm interested in your service: "${post.title}".` } });
    }),
    onViewAccount: (accountId) => { 
        const account = accountsById.get(accountId); 
        if (account) {
            incrementProfileViews(accountId);
            navigateTo('account', { account }); 
        }
    },
    onFilterByCategory: (category) => {
      if (mainView !== 'grid' || view !== 'all') { setMainView('grid'); setView('all'); }
      dispatchFilterAction({ type: 'SET_FILTER_CATEGORY', payload: category });
      if (mainContentRef.current) mainContentRef.current.scrollTop = 0;
    },
    onFilterByType: (type) => {
      if (mainView !== 'grid' || view !== 'all') { setMainView('grid'); setView('all'); }
      dispatchFilterAction({ type: 'SET_FILTER_TYPE', payload: type });
      if (mainContentRef.current) mainContentRef.current.scrollTop = 0;
    },
    onFilterByTag: (tag) => {
      if (mainView !== 'grid' || view !== 'all') { setMainView('grid'); setView('all'); }
      dispatchFilterAction({ type: 'SET_FILTER_TAGS', payload: [tag] });
      if (mainContentRef.current) mainContentRef.current.scrollTop = 0;
    },
    onShowOnMap: async (target) => {
      setHistory(h => [...h, { view, mainView, viewingPostId, viewingAccount, viewingForumPostId }]);
      if (typeof target === 'string') {
        setView('all'); setMainView('map'); setPostToFocusOnMap(target);
      } else {
        const account = target as Account;
        let coords = account.coordinates;
        if (!coords && account.address) {
          setIsGeocoding(true);
          try { coords = await geocodeLocation(account.address); } 
          catch (e) { addToast('Failed to find location', 'error'); } 
          finally { if (isMounted()) setIsGeocoding(false); }
        }
        if (coords) { setLocationToFocus({ coords, name: account.name }); setView('all'); setMainView('map'); } 
        else { addToast(`Could not find location for ${account.name}.`, 'error'); }
      }
    },
    onToggleLikeAccount: (account: Account) => { if(!currentAccount) openModal({type:'login'}); else toggleLikeAccount(account.id); },
    onTogglePinPost: togglePinPost,
    onViewForumPost: (postId) => navigateTo('forumPostDetail', { forumPostId: postId }),
    onCreateForumPost: withAuthCheck(() => openModal({ type: 'createForumPost' })),
  }), [
    currentAccount, openModal, archivePost, unarchivePost, deletePostPermanently, navigateTo, findPostById,
    withAuthCheck, accountsById, dispatchFilterAction, setPostToFocusOnMap,
    setLocationToFocus, togglePinPost, addToast, setIsGeocoding, availabilityAlerts, setAvailabilityAlert, deleteAvailabilityAlert,
    view, mainView, viewingPostId, viewingAccount, viewingForumPostId, priceAlerts, toggleLikePost, toggleLikeAccount, showConfirmation,
    deletePriceAlert, setPriceAlert, incrementProfileViews, isMounted
  ]);

  const handleFindNearby = useCallback(async (coords: { lat: number; lng: number }) => {
      if (isFindingNearby) return;
      setIsFindingNearby(true);
      try {
          const locationName = await reverseGeocode(coords.lat, coords.lng);
          const nearby = allDisplayablePosts.map(post => {
            const postCoords = post.type === PostType.EVENT ? post.eventCoordinates : post.coordinates;
            if (!postCoords) return null;
            const distance = haversineDistance(coords, postCoords);
            return { ...post, distance };
          }).filter((p): p is DisplayablePost & { distance: number } => p !== null && p.distance <= 50)
            .sort((a,b) => a.distance - b.distance);

          setNearbyPostsResult({ posts: nearby, locationName });
          closeModal();
          navigateTo('nearbyPosts');
      } catch (error) {
          addToast('Failed to find nearby posts', 'error');
      } finally {
          if (isMounted()) setIsFindingNearby(false);
      }
  }, [isFindingNearby, allDisplayablePosts, addToast, closeModal, navigateTo, isMounted]);
  
  // Optimized Scroll Handler using requestAnimationFrame
  const handleScroll = useCallback(() => {
    if (!mainContentRef.current) return;
    
    if (rafRef.current) {
        return;
    }

    rafRef.current = requestAnimationFrame(() => {
        if (!mainContentRef.current) return;
        const { scrollTop } = mainContentRef.current;
        const currentScrollTop = Math.max(0, scrollTop);
        const scrollDelta = currentScrollTop - lastScrollTopRef.current;
        
        if (Math.abs(scrollDelta) > 4) {
            if (scrollDelta > 0 && currentScrollTop > 60) { 
                setIsHeaderVisible(prev => !prev ? prev : false); // Only update if changing
            } else if (scrollDelta < 0) { 
                setIsHeaderVisible(prev => prev ? prev : true); 
            }
        }
        
        lastScrollTopRef.current = currentScrollTop;
        setIsScrolled(prev => {
            const isNowScrolled = currentScrollTop > 10;
            return prev === isNowScrolled ? prev : isNowScrolled;
        });
        
        rafRef.current = null;
    });
  }, []);

  const [recommendedPostIds, setRecommendedPostIds] = useState<string[]>([]);

  useEffect(() => {
      if (isInitialLoading || isRefreshing) return;
      if (!currentAccount) { setRecommendedPostIds([]); return; }
      const likedPosts = allDisplayablePosts.filter(p => likedPostIds.has(p.id));
      const viewedPosts = viewedPostIds.map(id => allDisplayablePosts.find(p => p.id === id)).filter((p): p is DisplayablePost => !!p);
      const newRecs = generateHistoryBasedRecommendations(likedPosts, viewedPosts, allDisplayablePosts);
      setRecommendedPostIds(newRecs.map(p => p.id));
  }, [currentAccount?.id, isRefreshing, isInitialLoading, allDisplayablePosts, likedPostIds, viewedPostIds]);

  const recommendations = useMemo(() => {
      if (recommendedPostIds.length === 0) return [];
      const postMap = new Map(allDisplayablePosts.map(p => [p.id, p]));
      return recommendedPostIds.map(id => postMap.get(id)).filter((p): p is DisplayablePost => !!p);
  }, [recommendedPostIds, allDisplayablePosts]);

  const sortedAndFilteredPosts = usePostFilters(allDisplayablePosts, allDisplayablePosts, userLocation, currentAccount);
  const showRecommendations = !isAnyFilterActive && recommendations.length > 0 && view === 'all' && mainView === 'grid';
  const recommendationIdsSet = useMemo(() => new Set(recommendedPostIds), [recommendedPostIds]);
  const postsForMainList = useMemo(() => showRecommendations ? sortedAndFilteredPosts.filter(p => !recommendationIdsSet.has(p.id)) : sortedAndFilteredPosts, [sortedAndFilteredPosts, showRecommendations, recommendationIdsSet]);
  const { displayedItems: paginatedPosts, hasMore, loadMore, isLoadingMore } = useInfiniteScroll(postsForMainList, isInitialLoading);
  const displayPosts = filterState.searchQuery ? postsForMainList : paginatedPosts;
  const likedPosts = useMemo(() => allDisplayablePosts.filter(p => likedPostIds.has(p.id)), [allDisplayablePosts, likedPostIds]);
  const viewingPost = useMemo(() => viewingPostId ? findPostById(viewingPostId) : null, [viewingPostId, findPostById]);

  const renderCurrentView = () => {
    switch (view) {
        case 'all':
            if (mainView === 'grid') return <div className="p-4 sm:p-6 lg:p-8">{showRecommendations && <div className="mb-8 animate-fade-in-up"><PostList posts={recommendations} currentAccount={currentAccount} isLoading={false} variant={gridView} enableEntryAnimation={true} /></div>}<PostList posts={displayPosts} currentAccount={currentAccount} onLoadMore={loadMore} hasMore={hasMore} isLoadingMore={isLoadingMore} isLoading={isInitialLoading} isFiltering={isFiltering} variant={gridView} enableEntryAnimation={true} /></div>;
            if (mainView === 'map') return <Suspense fallback={<LoadingFallback/>}><MapView posts={displayPosts.filter(p => p.coordinates || p.eventCoordinates)} userLocation={userLocation} isLoading={isInitialLoading} onFindNearby={() => openModal({ type: 'findNearby' })} isFindingNearby={isFindingNearby} postToFocusOnMap={postToFocusOnMap} onPostFocusComplete={() => setPostToFocusOnMap(null)} onViewPostDetails={(post) => navigateTo('postDetail', { postId: post.id })} locationToFocus={locationToFocus} onLocationFocusComplete={() => setLocationToFocus(null)} /></Suspense>;
            return null;
        case 'likes': return currentAccount ? <Suspense fallback={<LoadingFallback/>}><LikesView likedPosts={likedPosts} onViewAccount={(account) => postActions.onViewAccount(account.id)} currentAccount={currentAccount} allAccounts={accounts} /></Suspense> : null;
        case 'bag': return currentAccount ? <Suspense fallback={<LoadingFallback/>}><BagView onViewDetails={(post) => navigateTo('postDetail', { postId: post.id })} allAccounts={accounts} /></Suspense> : null;
        case 'admin':
            return currentAccount?.role === 'admin' ? <Suspense fallback={<LoadingFallback/>}><AdminPanel accounts={accounts} allPosts={allDisplayablePosts} currentAccount={currentAccount} onDeleteAccount={(account) => deleteAccount(account.id)} onUpdateAccountRole={updateAccountRole} onEditAccount={(acc) => openModal({ type: 'editAccount', data: acc })} onToggleAccountStatus={(acc) => toggleAccountStatus(acc.id, true)} onApproveAccount={(id) => { approveAccount(id); addNotification({ recipientId: id, message: 'Your account has been approved.', type: 'account_approved' }); }} onRejectAccount={(acc) => rejectAccount(acc.id)} categories={categories} onAddCategory={addCategory} onUpdateCategory={updateCategory} onDeleteCategory={deleteCategory} onUpdateSubscription={updateSubscription} reports={reports} onReportAction={(report, action) => { if(action==='delete') { /* delete logic handled in context */ } setReports(prev => prev.filter(r => r.id !== report.id)); addToast('Report handled.', 'success'); }} feedbackList={feedbackList} onDeleteFeedback={handleDeleteFeedback} onToggleFeedbackArchive={handleToggleFeedbackArchive} onMarkFeedbackAsRead={handleMarkFeedbackAsRead} onBulkFeedbackAction={handleBulkFeedbackAction} onViewPost={(post) => navigateTo('postDetail', { postId: post.id })} onEditPost={(postId) => navigateTo('editPost', { postId })} onDeletePost={deletePostPermanently} termsContent={termsContent} onUpdateTerms={setTermsContent} privacyContent={privacyContent} onUpdatePrivacy={setPrivacyContent} initialView={adminInitialView} forumPosts={forumPosts} getPostWithComments={getPostWithComments} onViewForumPost={(postId) => navigateTo('forumPostDetail', { forumPostId: postId })} forumCategories={forumCategories} onAddForumCategory={addForumCategory} onUpdateForumCategory={updateForumCategory} onDeleteForumCategory={deleteForumCategory} priceUnits={priceUnits} onAddPriceUnit={addPriceUnit} onUpdatePriceUnit={updatePriceUnit} onDeletePriceUnit={deletePriceUnit} /></Suspense> : null;
        case 'account': return viewingAccount ? <Suspense fallback={<LoadingFallback/>}><AccountView account={viewingAccount} currentAccount={currentAccount} posts={allDisplayablePosts} onEditAccount={() => openModal({ type: 'editAccount', data: viewingAccount })} archivedPosts={archivedPosts} allAccounts={accounts} isLiked={currentAccount?.likedAccountIds?.includes(viewingAccount.id) ?? false} onToggleLike={(account: Account) => postActions.onToggleLikeAccount!(account)} onShowOnMap={postActions.onShowOnMap} isGeocoding={isGeocoding} onOpenAnalytics={() => navigateTo('accountAnalytics', { account: viewingAccount })} onOpenSubscriptionPage={() => navigateTo('subscription')} /></Suspense> : null;
        case 'postDetail': return viewingPost ? <PostDetailView post={viewingPost} onBack={handleBack} currentAccount={currentAccount} /> : null;
        case 'forums': return <Suspense fallback={<LoadingFallback/>}><ForumsView /></Suspense>;
        case 'forumPostDetail': return viewingForumPostId ? <ForumsPostDetailView postId={viewingForumPostId} onBack={handleBack} /> : null;
        case 'createPost':
            if (currentAccount?.subscription.tier === 'Personal') { setView('subscription'); addToast('You need a seller account.', 'error'); return null; }
            return currentAccount ? <CreatePostPage onBack={handleBack} onSubmitPost={(d) => createPostInContext(d, currentAccount!.id)} onNavigateToPost={(id) => navigateTo('postDetail', { postId: id })} currentAccount={currentAccount} categories={categories} onUpdateCurrentAccountDetails={(data) => updateAccountDetails({ ...currentAccount, ...data })} /> : null;
        case 'editPost': return currentAccount && viewingPost ? <CreatePostPage onBack={handleBack} onSubmitPost={(d) => createPostInContext(d, currentAccount!.id)} onUpdatePost={updatePostInContext} onNavigateToPost={(id) => navigateTo('postDetail', { postId: id })} editingPost={viewingPost} currentAccount={currentAccount} categories={categories} /> : null;
        case 'nearbyPosts': return nearbyPostsResult && currentAccount ? <Suspense fallback={<LoadingFallback/>}><NearbyPostsView result={nearbyPostsResult} currentAccount={currentAccount} /></Suspense> : null;
        case 'accountAnalytics': return viewingAccount ? <Suspense fallback={<LoadingFallback/>}><AccountAnalyticsView account={viewingAccount} accountPosts={allDisplayablePosts.filter(p => p.authorId === viewingAccount.id)} allCategories={categories} allAccounts={accounts} /></Suspense> : null;
        case 'subscription': return currentAccount ? <SubscriptionPage currentAccount={currentAccount} onUpdateSubscription={(tier) => updateSubscription(currentAccount.id, tier)} openModal={openModal} /> : null;
        case 'settings':
            return currentAccount ? <SettingsPage
                settings={notificationSettings}
                onSettingsChange={handleUpdateNotificationSettings}
                currentAccount={currentAccount}
                onArchiveAccount={requestArchiveAccount}
                onSignOut={requestSignOut}
            /> : null;
        case 'activity':
            return currentAccount ? <ActivityPage
                notifications={notifications}
                alerts={priceAlerts}
                availabilityAlerts={availabilityAlerts}
                posts={allDisplayablePosts as Post[]}
                onDismiss={(id) => markAsRead(id)}
                onDismissAll={() => notifications.forEach(n => markAsRead(n.id))}
                onNotificationClick={handleNotificationClick}
                onDeleteAlert={deletePriceAlert}
                onDeleteAvailabilityAlert={deleteAvailabilityAlert}
                onViewPost={(postId) => navigateTo('postDetail', { postId })}
            /> : null;
        default: return null;
    }
  };

  return (
    <PostActionsContext.Provider value={postActions}>
      <div className="flex flex-col h-screen" {...touchHandlers}>
        <Header 
          searchQuery={filterState.searchQuery}
          onSearchChange={(q) => dispatchFilterAction({ type: 'SET_SEARCH_QUERY', payload: q })}
          onSearchSubmit={filterState.isAiSearchEnabled ? handleAiSearchSubmitWithHistory : handleSearchSubmit}
          autoCompleteSuggestions={allAvailableTags}
          recentSearches={recentSearches}
          onRemoveRecentSearch={(q) => setRecentSearches(p => p.filter(s => s !== q))}
          onClearRecentSearches={handleClearRecentSearchesConfirm}
          isAiSearchEnabled={filterState.isAiSearchEnabled}
          onToggleAiSearch={handleToggleAiSearch}
          isAiSearching={filterState.isAiSearching}
          onAiSearchSubmit={handleAiSearchSubmitWithHistory}
          mainView={mainView}
          onMainViewChange={handleMainViewChange}
          gridView={gridView}
          onGridViewChange={setGridView}
          onGoHome={() => { setView('all'); setMainView('grid'); setHistory([]); onClearFilters(); handleRefresh(); if (mainContentRef.current) mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' }); }}
          onRefresh={handleRefresh}
          currentView={view}
          onViewChange={(newView) => navigateTo(newView)}
          bagCount={bag.length}
          unreadNotificationsCount={notifications.filter(n => !n.isRead).length}
          currentAccount={currentAccount}
          onOpenAccount={() => navigateTo('account', { account: currentAccount! })}
          onEditProfile={() => openModal({ type: 'editAccount', data: currentAccount! })}
          onOpenSubscriptionPage={() => navigateTo('subscription')}
          onOpenActivityPage={() => navigateTo('activity')}
          onOpenCreateModal={() => navigateTo('createPost')}
          onOpenLoginModal={() => openModal({ type: 'login' })}
          onOpenSettingsModal={() => navigateTo('settings')}
          onOpenCreateAccountModal={() => openModal({ type: 'createAccount' })}
          viewingAccount={viewingAccount}
          onClearFilters={onClearFilters}
          isAnyFilterActive={isAnyFilterActive}
          onOpenFilterPanel={() => openModal({ type: 'filterPanel' })}
          isScrolled={isScrolled}
          isVisible={isHeaderVisible}
          onBack={(view === 'all' && isAnyFilterActive) || history.length > 0 ? handleBack : undefined}
        />
        <main ref={mainContentRef} onScroll={handleScroll} className={cn("relative flex-1 overflow-y-auto bg-gray-50 pt-16", isInitialLoading && "overflow-hidden", isPulling && "overflow-hidden")}>
          {view === 'all' && mainView === 'grid' ? (
            <>
              <PullToRefreshIndicator pullPosition={pullPosition} isRefreshing={isRefreshing} pullThreshold={pullThreshold} />
              <div style={{ transform: `translateY(${isRefreshing ? pullThreshold : pullPosition}px)` }} className={!isPulling ? 'transition-transform duration-300' : ''}>
                <ErrorBoundary>{renderCurrentView()}</ErrorBoundary>
              </div>
            </>
          ) : (
             <ErrorBoundary>{renderCurrentView()}</ErrorBoundary>
          )}
        </main>
        <OfflineIndicator />
        {!currentAccount && (view === 'all' || view === 'postDetail' || view === 'account') && (
          <GuestPrompt onSignIn={() => openModal({ type: 'login' })} onCreateAccount={() => openModal({ type: 'createAccount' })} />
        )}
        <AppModals
            activeModal={activeModal}
            closeModal={closeModal}
            openModal={openModal}
            isFindingNearby={isFindingNearby}
            handleFindNearby={handleFindNearby}
            userLocation={userLocation}
            onSignOut={requestSignOut}
        />
      </div>
    </PostActionsContext.Provider>
  );
};
