


import React, { useState, useCallback, useEffect, useMemo, useRef, Suspense, createContext, useContext } from 'react';
import { DisplayablePost, NotificationSettings, Notification, Account, ModalState, Subscription, Report, AdminView, AppView, SavedSearch, SavedSearchFilters, Post, PostType, ContactOption, ForumPost, ForumComment, DisplayableForumPost, DisplayableForumComment, Feedback } from './types';
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
import { ForumsPostDetailView } from './components/ForumsPostDetailView';
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
import { NavigationContext, useNavigation } from './contexts/NavigationContext';

// Lazy loaded components to reduce initial bundle size
const MapView = React.lazy(() => import('./components/MapView').then(module => ({ default: module.MapView })));
const AdminPanel = React.lazy(() => import('./components/AdminPanel').then(module => ({ default: module.AdminPanel })));
const AccountView = React.lazy(() => import('./components/AccountView').then(module => ({ default: module.AccountView })));
const LikesView = React.lazy(() => import('./components/LikesView').then(module => ({ default: module.LikesView })));
const BagView = React.lazy(() => import('./components/BagView').then(module => ({ default: module.BagView })));
const AccountAnalyticsView = React.lazy(() => import('./components/AccountAnalyticsView').then(module => ({ default: module.AccountAnalyticsView })));
const NearbyPostsView = React.lazy(() => import('./components/NearbyPostsView').then(module => ({ default: module.NearbyPostsView })));
const ForumsView = React.lazy(() => import('./components/ForumsView').then(module => ({ default: module.ForumsView })));
const EditPageView = React.lazy(() => import('./components/EditPageView').then(module => ({ default: module.EditPageView })));
const EditProfilePage = React.lazy(() => import('./components/EditProfilePage').then(module => ({ default: module.EditProfilePage })));
const ManageCatalogPage = React.lazy(() => import('./components/ManageCatalogPage').then(module => ({ default: module.ManageCatalogPage })));
const CreateForumPostPage = React.lazy(() => import('./components/CreateForumPostPage').then(module => ({ default: module.CreateForumPostPage })));

interface HistoryItem {
    view: AppView;
    mainView: 'grid' | 'map';
    viewingPostId: string | null;
    viewingAccount: Account | null;
    viewingForumPostId: string | null;
    editingAdminPageKey: 'terms' | 'privacy' | null;
    scrollPosition: number;
}

const NOTIFICATION_SETTINGS_KEY = 'localeAppNotifSettings';


export const App: React.FC = () => {
  const { 
    currentAccount, accounts, accountsById, signOut, 
    likedPostIds, deleteAccount, toggleAccountStatus, updateSubscription, updateAccountRole, approveAccount, rejectAccount, upgradeToSeller, updateAccountDetails,
    bag, 
    addPostToViewHistory, viewedPostIds, savedSearches,
    reports, setReports, feedbackList, setFeedbackList, termsContent, setTermsContent, privacyContent, setPrivacyContent,
    addReport, addForumReport, addFeedback, incrementProfileViews
  } = useAuth();
  
  const { 
    notifications, markAsRead
  } = useActivity();

  const { 
    posts: allDisplayablePosts, archivedPosts, categories, allAvailableTags, createPost: createPostInContext, updatePost: updatePostInContext, deletePostPermanently, addCategory, updateCategory, deleteCategory, findPostById,
    priceUnits, addPriceUnit, updatePriceUnit, deletePriceUnit, refreshPosts
  } = usePosts();
  
  const { posts: forumPosts, getPostWithComments, deletePost: deleteForumPost, deleteComment: deleteForumComment, findForumPostById, categories: forumCategories, addCategory: addForumCategory, updateCategory: updateForumCategory, deleteCategory: deleteForumCategory, addPost: createForumPost } = useForum();
  const { activeModal, openModal, closeModal, addToast } = useUI();
  const showConfirmation = useConfirmationModal();
  const isMounted = useIsMounted();

  const { filterState, dispatchFilterAction, handleAiSearchSubmit, handleToggleAiSearch, onClearFilters, isAnyFilterActive } = useFilters();
  
  const [view, setView] = useState<AppView>('all');
  const [mainView, setMainView] = useState<'grid' | 'map'>('grid');
  const [gridView, setGridView] = usePersistentState<'default' | 'compact'>('localeAppGridView', 'default');
  const [viewingPostId, setViewingPostId] = useState<string | null>(null);
  const [viewingForumPostId, setViewingForumPostId] = useState<string | null>(null);
  const [editingAdminPageKey, setEditingAdminPageKey] = useState<'terms' | 'privacy' | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isFindingNearby, setIsFindingNearby] = useState(false);
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
  };

  const navigateTo = useCallback((
      newView: AppView,
      options: { postId?: string; account?: Account, forumPostId?: string, pageKey?: 'terms' | 'privacy' } = {}
  ) => {
      const isSameView = view === newView;
      const isSamePost = viewingPostId === (options.postId || null);
      const isSameAccount = viewingAccount?.id === (options.account?.id || null);
      const isSameForumPost = viewingForumPostId === (options.forumPostId || null);
      const isSamePageKey = editingAdminPageKey === (options.pageKey || null);

      if (isSameView && isSamePost && isSameAccount && isSameForumPost && isSamePageKey) return;

      if (newView === 'createPost' && currentAccount?.subscription.tier === 'Personal') {
          navigateTo('subscription');
          return;
      }

      if (newView === 'accountAnalytics') {
          // Analytics can only be viewed by the logged-in owner of the account
          if (!currentAccount || !options.account || options.account.id !== currentAccount.id) {
              // This case shouldn't happen with the UI, so we can just block navigation
              return; 
          }
          const isPaidTier = ['Verified', 'Business', 'Organisation'].includes(currentAccount.subscription.tier);
          if (!isPaidTier) {
              navigateTo('subscription'); // Redirect to upgrade
              return;
          }
      }

      if (newView === 'account' && options.account) {
          incrementProfileViews(options.account.id);
      }

      // Capture current scroll position before navigating away
      const currentScrollPosition = mainContentRef.current ? mainContentRef.current.scrollTop : 0;

      setHistory(h => [...h, { 
          view, 
          mainView, 
          viewingPostId, 
          viewingAccount, 
          viewingForumPostId,
          editingAdminPageKey,
          scrollPosition: currentScrollPosition
      }]);

      setView(newView);
      setViewingPostId(options.postId || null);
      setViewingAccount(options.account || null);
      setViewingForumPostId(options.forumPostId || null);
      setEditingAdminPageKey(options.pageKey || null);
      
      // Reset scroll for the new view
      if (mainContentRef.current) mainContentRef.current.scrollTop = 0;
  }, [view, mainView, viewingPostId, viewingAccount, viewingForumPostId, editingAdminPageKey, currentAccount, incrementProfileViews]);

  const handleNotificationClick = useCallback((notification: Notification) => {
    markAsRead(notification.id);
    
    if (notification.postId) {
        const post = findPostById(notification.postId);
        if (post) {
            openModal({ type: 'viewPost', data: post });
        } else {
            addToast("The related post is no longer available.", "error");
        }
    } else if (notification.relatedAccountId) {
        const account = accountsById.get(notification.relatedAccountId);
        if (account) navigateTo('account', { account });
    } else if (notification.forumPostId) {
        navigateTo('forumPostDetail', { forumPostId: notification.forumPostId });
    }
  }, [markAsRead, navigateTo, accountsById, findPostById, openModal, addToast]);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    refreshPosts(); 
    setTimeout(() => {
        if (isMounted()) {
            setIsRefreshing(false);
        }
    }, 800);
  }, [isRefreshing, refreshPosts, isMounted]);

  const { pullPosition, touchHandlers, isPulling, pullThreshold } = usePullToRefresh({ onRefresh: handleRefresh, mainContentRef, isRefreshing, disabled: view !== 'all' || mainView !== 'grid' });
  
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
  };

  const handleDeleteFeedback = (feedbackId: string) => {
      showConfirmation({
        title: 'Delete Feedback',
        message: 'Are you sure you want to delete this feedback?',
        onConfirm: () => {
            setFeedbackList(prev => prev.filter(f => f.id !== feedbackId));
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
      }
  };

  const handleClearRecentSearchesConfirm = useCallback(() => {
      if (recentSearches.length === 0) return;
      showConfirmation({
        title: 'Clear Recent Searches',
        message: 'Are you sure you want to clear your search history?',
        onConfirm: () => {
            setRecentSearches([]);
        },
        confirmText: 'Clear History',
        confirmClassName: 'bg-red-600 text-white',
      });
  }, [recentSearches.length, showConfirmation, setRecentSearches]);

  const handleAiSearchSubmitWithHistory = useCallback((query: string) => {
    handleSearchSubmit(query);
    handleAiSearchSubmit(query);
  }, [handleAiSearchSubmit, handleSearchSubmit]);

  const performSignOut = useCallback(() => {
    signOut();
    setView('all');
    setMainView('grid');
    setViewingAccount(null);
    setViewingPostId(null);
    setViewingForumPostId(null);
    setEditingAdminPageKey(null);
    setHistory([]);
    if (mainContentRef.current) {
        mainContentRef.current.scrollTop = 0;
    }
  }, [signOut]);

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
          setEditingAdminPageKey(previousState.editingAdminPageKey);
          
          // Restore scroll position after render
          requestAnimationFrame(() => {
              if (mainContentRef.current) {
                  mainContentRef.current.scrollTop = previousState.scrollPosition;
              }
          });
      }
  }, [history, view, isAnyFilterActive, onClearFilters]);

  const handleMainViewChange = useCallback((newMainView: 'grid' | 'map') => {
      if (mainView === newMainView) return;
      // When switching main view modes, we don't necessarily want to save scroll position of the previous mode
      // as they are different representations. However, saving state allows 'back' to work.
      const currentScrollPosition = mainContentRef.current ? mainContentRef.current.scrollTop : 0;
      setHistory(h => [...h, { 
          view, 
          mainView, 
          viewingPostId, 
          viewingAccount, 
          viewingForumPostId,
          editingAdminPageKey,
          scrollPosition: currentScrollPosition
      }]);
      setMainView(newMainView);
  }, [view, mainView, viewingPostId, viewingAccount, viewingForumPostId, editingAdminPageKey]);

  const showOnMap = useCallback(async (target: string | Account) => {
    const currentScrollPosition = mainContentRef.current ? mainContentRef.current.scrollTop : 0;
    setHistory(h => [...h, { 
        view, 
        mainView, 
        viewingPostId, 
        viewingAccount, 
        viewingForumPostId,
        editingAdminPageKey,
        scrollPosition: currentScrollPosition
    }]);
    
    if (typeof target === 'string') {
      setView('all'); setMainView('map'); setPostToFocusOnMap(target);
    } else {
      const account = target as Account;
      let coords = account.coordinates;
      if (!coords && account.address) {
        try { coords = await geocodeLocation(account.address); } 
        catch (e) { console.error(e); } 
      }
      if (coords) { setLocationToFocus({ coords, name: account.name }); setView('all'); setMainView('map'); } 
      else { console.error(`Could not find location for ${account.name}.`); }
    }
  }, [isMounted, mainView, view, viewingAccount, viewingForumPostId, viewingPostId, editingAdminPageKey]);

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
          console.error('Failed to find nearby posts', error);
      } finally {
          if (isMounted()) setIsFindingNearby(false);
      }
  }, [isFindingNearby, allDisplayablePosts, closeModal, navigateTo, isMounted]);

  const handleEnableLocation = useCallback(async () => {
      if (!navigator.geolocation) {
          addToast("Geolocation is not supported by your browser.", 'error');
          return;
      }

      return new Promise<void>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
              (position) => {
                  const coords = {
                      lat: position.coords.latitude,
                      lng: position.coords.longitude
                  };
                  setUserLocation(coords);
                  addToast("Location enabled successfully.", 'success');
                  resolve();
              },
              (error) => {
                  let message = "Could not get your location.";
                  switch (error.code) {
                      case error.PERMISSION_DENIED:
                          message = "Location access denied. Please enable it in your browser settings.";
                          break;
                      case error.POSITION_UNAVAILABLE:
                          message = "Location information is unavailable.";
                          break;
                      case error.TIMEOUT:
                          message = "The request to get user location timed out.";
                          break;
                  }
                  addToast(message, 'error');
                  reject(error);
              }
          );
      });
  }, [addToast]);
  
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

  const handleCreateForumPost = useCallback(async (postData: any) => {
    const newPost = createForumPost(postData);
    if (newPost) {
        // Navigate to the new post, but modify history so "back" goes to the forum list, not the create page.
        setHistory(h => h.slice(0, -1)); // remove the 'createForumPost' view from history
        navigateTo('forumPostDetail', { forumPostId: newPost.id });
    } else {
        handleBack(); // Fallback if creation fails
    }
  }, [createForumPost, navigateTo, handleBack, setHistory]);

  const navigationContextValue = useMemo(() => ({
      navigateTo,
      handleBack,
      showOnMap,
  }), [navigateTo, handleBack, showOnMap]);

  const viewManagerContent = (
    <ErrorBoundary>
      <ViewManager
        view={view}
        mainView={mainView}
        gridView={gridView}
        isInitialLoading={isInitialLoading}
        isFiltering={isFiltering}
        userLocation={userLocation}
        postToFocusOnMap={postToFocusOnMap}
        onPostFocusComplete={() => setPostToFocusOnMap(null)}
        locationToFocus={locationToFocus}
        onLocationFocusComplete={() => setLocationToFocus(null)}
        viewingAccount={viewingAccount}
        viewingPostId={viewingPostId}
        viewingForumPostId={viewingForumPostId}
        editingAdminPageKey={editingAdminPageKey}
        nearbyPostsResult={nearbyPostsResult}
        notificationSettings={notificationSettings}
        onUpdateNotificationSettings={handleUpdateNotificationSettings}
        requestArchiveAccount={requestArchiveAccount}
        requestSignOut={requestSignOut}
        handleNotificationClick={handleNotificationClick}
        adminInitialView={adminInitialView}
        handleDeleteFeedback={handleDeleteFeedback}
        handleToggleFeedbackArchive={handleToggleFeedbackArchive}
        handleMarkFeedbackAsRead={handleMarkFeedbackAsRead}
        handleBulkFeedbackAction={handleBulkFeedbackAction}
        handleCreateForumPost={handleCreateForumPost}
      />
    </ErrorBoundary>
  );

  return (
    <NavigationContext.Provider value={navigationContextValue}>
      <div className="flex flex-col h-screen" {...touchHandlers}>
        <Header 
          recentSearches={recentSearches}
          onRemoveRecentSearch={(q) => setRecentSearches(p => p.filter(s => s !== q))}
          onClearRecentSearches={handleClearRecentSearchesConfirm}
          onGoHome={() => { setView('all'); setMainView('grid'); setHistory([]); onClearFilters(); handleRefresh(); if (mainContentRef.current) mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' }); }}
          onRefresh={handleRefresh}
          viewingAccount={viewingAccount}
          isScrolled={isScrolled}
          isVisible={isHeaderVisible}
          onBack={(view === 'all' && isAnyFilterActive) || history.length > 0 ? handleBack : undefined}
          view={view}
          mainView={mainView}
          onMainViewChange={handleMainViewChange}
          gridView={gridView}
          onGridViewChange={setGridView}
        />
        <main ref={mainContentRef} onScroll={handleScroll} className={cn("relative flex-1 overflow-y-auto bg-gray-50 pt-16", isInitialLoading && "overflow-hidden", isPulling && "overflow-hidden")}>
          {view === 'all' && mainView === 'grid' ? (
            <>
              <PullToRefreshIndicator pullPosition={pullPosition} isRefreshing={isRefreshing} pullThreshold={pullThreshold} />
              <div style={{ transform: `translateY(${isRefreshing ? pullThreshold : pullPosition}px)` }} className={!isPulling ? 'transition-transform duration-300' : ''}>
                {viewManagerContent}
              </div>
            </>
          ) : (
            viewManagerContent
          )}
        </main>
        <OfflineIndicator />
        {!currentAccount && (view === 'all' || view === 'account') && (
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
            onEnableLocation={handleEnableLocation}
        />
      </div>
    </NavigationContext.Provider>
  );
};

// --- View Manager Component ---
// Encapsulates the logic for rendering the current view.
const ViewManager: React.FC<any> = (props) => {
    const { 
        currentAccount, accounts, likedPostIds, viewedPostIds,
        deleteAccount, updateAccountRole, toggleAccountStatus, approveAccount, rejectAccount, updateSubscription, updateAccountDetails,
        reports, setReports, feedbackList, termsContent, setTermsContent, privacyContent, setPrivacyContent
    } = useAuth();
    const { 
        notifications, markAsRead
    } = useActivity();
    const { 
        posts: allDisplayablePosts, archivedPosts, categories, 
        createPost: createPostInContext, updatePost: updatePostInContext, deletePostPermanently,
        addCategory, updateCategory, deleteCategory, findPostById,
        priceUnits, addPriceUnit, updatePriceUnit, deletePriceUnit
    } = usePosts();
    const { 
        posts: forumPosts, getPostWithComments, 
        categories: forumCategories, addCategory: addForumCategory, updateCategory: updateForumCategory, deleteCategory: deleteForumCategory 
    } = useForum();
    const { openModal } = useUI();
    const { filterState, isAnyFilterActive } = useFilters();
    const { navigateTo, handleBack } = useNavigation();
    
    // Props passed down from App
    const {
        view, mainView, gridView, isInitialLoading, isFiltering, userLocation, postToFocusOnMap, onPostFocusComplete, locationToFocus, onLocationFocusComplete,
        viewingAccount, viewingPostId, viewingForumPostId, editingAdminPageKey, nearbyPostsResult, notificationSettings, onUpdateNotificationSettings,
        requestArchiveAccount, requestSignOut, handleNotificationClick, adminInitialView,
        handleDeleteFeedback, handleToggleFeedbackArchive, handleMarkFeedbackAsRead, handleBulkFeedbackAction, handleCreateForumPost
    } = props;
    
    // --- Data derived for rendering ---
    const [recommendedPostIds, setRecommendedPostIds] = useState<string[]>([]);

    useEffect(() => {
        if (isInitialLoading) return;
        if (!currentAccount) { setRecommendedPostIds([]); return; }
        const likedPosts = allDisplayablePosts.filter(p => likedPostIds.has(p.id));
        const viewedPosts = viewedPostIds.map(id => allDisplayablePosts.find(p => p.id === id)).filter((p): p is DisplayablePost => !!p);
        const newRecs = generateHistoryBasedRecommendations(likedPosts, viewedPosts, allDisplayablePosts);
        setRecommendedPostIds(newRecs.map(p => p.id));
    }, [currentAccount?.id, isInitialLoading, allDisplayablePosts, likedPostIds, viewedPostIds]);

    const recommendations = useMemo(() => {
        if (recommendedPostIds.length === 0) return [];
        const postMap = new Map(allDisplayablePosts.map(p => [p.id, p]));
        return recommendedPostIds.map(id => postMap.get(id)).filter((p): p is DisplayablePost => !!p);
    }, [recommendedPostIds, allDisplayablePosts]);
    
    const sortedAndFilteredPosts = usePostFilters(allDisplayablePosts, allDisplayablePosts, userLocation, currentAccount, accounts);
    const showRecommendations = !isAnyFilterActive && recommendations.length > 0 && view === 'all' && mainView === 'grid';
    const recommendationIdsSet = useMemo(() => new Set(recommendedPostIds), [recommendedPostIds]);
    const postsForMainList = useMemo(() => showRecommendations ? sortedAndFilteredPosts.filter(p => !recommendationIdsSet.has(p.id)) : sortedAndFilteredPosts, [sortedAndFilteredPosts, showRecommendations, recommendationIdsSet]);
    const { displayedItems: paginatedPosts, hasMore, loadMore, isLoadingMore } = useInfiniteScroll(postsForMainList, isInitialLoading);
    const displayPosts = filterState.searchQuery ? postsForMainList : paginatedPosts;
    const likedPosts = useMemo(() => allDisplayablePosts.filter(p => likedPostIds.has(p.id)), [allDisplayablePosts, likedPostIds]);
    const viewingPost = useMemo(() => viewingPostId ? findPostById(viewingPostId) : null, [viewingPostId, findPostById]);
    
    switch (view) {
        case 'all':
            if (mainView === 'grid') return <div className="p-4 sm:p-6 lg:p-8">{showRecommendations && <div className="mb-8 animate-fade-in-down"><PostList posts={recommendations} currentAccount={currentAccount} isLoading={false} variant={gridView} enableEntryAnimation={true} /></div>}<PostList posts={displayPosts} currentAccount={currentAccount} onLoadMore={loadMore} hasMore={hasMore} isLoadingMore={isLoadingMore} isLoading={isInitialLoading} isFiltering={isFiltering} variant={gridView} enableEntryAnimation={true} /></div>;
            if (mainView === 'map') return <Suspense fallback={<LoadingFallback/>}><MapView posts={displayPosts.filter(p => p.coordinates || p.eventCoordinates)} userLocation={userLocation} isLoading={isInitialLoading} onFindNearby={() => openModal({ type: 'findNearby' })} isFindingNearby={props.isFindingNearby} postToFocusOnMap={postToFocusOnMap} onPostFocusComplete={onPostFocusComplete} onViewPostDetails={(post) => openModal({ type: 'viewPost', data: post })} locationToFocus={locationToFocus} onLocationFocusComplete={onLocationFocusComplete} /></Suspense>;
            return null;
        case 'likes': return currentAccount ? <Suspense fallback={<LoadingFallback/>}><LikesView likedPosts={likedPosts} currentAccount={currentAccount} allAccounts={accounts} /></Suspense> : null;
        case 'bag': return currentAccount ? <Suspense fallback={<LoadingFallback/>}><BagView allAccounts={accounts} onViewDetails={(post) => openModal({ type: 'viewPost', data: post })} /></Suspense> : null;
        case 'admin':
            return currentAccount?.role === 'admin' ? <Suspense fallback={<LoadingFallback/>}><AdminPanel initialView={adminInitialView} feedbackList={feedbackList} onDeleteFeedback={handleDeleteFeedback} onToggleFeedbackArchive={handleToggleFeedbackArchive} onMarkFeedbackAsRead={handleMarkFeedbackAsRead} onBulkFeedbackAction={handleBulkFeedbackAction} /></Suspense> : null;
        case 'account': return viewingAccount ? <Suspense fallback={<LoadingFallback/>}><AccountView account={viewingAccount} currentAccount={currentAccount} posts={allDisplayablePosts} archivedPosts={archivedPosts} allAccounts={accounts} /></Suspense> : null;
        case 'forums': return <Suspense fallback={<LoadingFallback/>}><ForumsView /></Suspense>;
        case 'forumPostDetail': return viewingForumPostId ? <ForumsPostDetailView postId={viewingForumPostId} onBack={handleBack} /> : null;
        case 'createPost':
            if (currentAccount?.subscription.tier === 'Personal') { return null; }
            return currentAccount ? <CreatePostPage onBack={handleBack} onSubmitPost={(d) => createPostInContext(d, currentAccount!.id)} onNavigateToPost={handleBack} currentAccount={currentAccount} categories={categories} onUpdateCurrentAccountDetails={(data) => updateAccountDetails({ ...currentAccount, ...data })} /> : null;
        case 'editPost': return currentAccount && viewingPost ? <CreatePostPage onBack={handleBack} onSubmitPost={(d) => createPostInContext(d, currentAccount!.id)} onUpdatePost={updatePostInContext} onNavigateToPost={handleBack} editingPost={viewingPost} currentAccount={currentAccount} categories={categories} /> : null;
        case 'nearbyPosts': return nearbyPostsResult && currentAccount ? <Suspense fallback={<LoadingFallback/>}><NearbyPostsView result={nearbyPostsResult} currentAccount={currentAccount} /></Suspense> : null;
        case 'accountAnalytics': return viewingAccount ? <Suspense fallback={<LoadingFallback/>}><AccountAnalyticsView account={viewingAccount} accountPosts={allDisplayablePosts.filter(p => p.authorId === viewingAccount.id)} allCategories={categories} allAccounts={accounts} /></Suspense> : null;
        case 'subscription': return currentAccount ? <SubscriptionPage currentAccount={currentAccount} onUpdateSubscription={(tier) => updateSubscription(currentAccount.id, tier)} openModal={openModal} /> : null;
        case 'settings':
            return currentAccount ? <SettingsPage
                settings={notificationSettings}
                onSettingsChange={onUpdateNotificationSettings}
                currentAccount={currentAccount}
                onArchiveAccount={requestArchiveAccount}
                onSignOut={requestSignOut}
            /> : null;
        case 'activity':
            return currentAccount ? <ActivityPage
                notifications={notifications}
                onDismiss={(id) => markAsRead(id)}
                onDismissAll={() => notifications.forEach(n => markAsRead(n.id))}
                onNotificationClick={handleNotificationClick}
            /> : null;
        case 'editAdminPage':
            return editingAdminPageKey ? <Suspense fallback={<LoadingFallback/>}><EditPageView pageKey={editingAdminPageKey} initialContent={editingAdminPageKey === 'terms' ? termsContent : privacyContent} onSave={editingAdminPageKey === 'terms' ? setTermsContent : setPrivacyContent} onBack={handleBack} /></Suspense> : null;
        case 'editProfile':
            return viewingAccount ? <Suspense fallback={<LoadingFallback/>}><EditProfilePage account={viewingAccount} onBack={handleBack} /></Suspense> : null;
        case 'manageCatalog':
            return viewingAccount ? <Suspense fallback={<LoadingFallback/>}><ManageCatalogPage account={viewingAccount} onBack={handleBack} /></Suspense> : null;
        case 'createForumPost':
            return <Suspense fallback={<LoadingFallback />}><CreateForumPostPage onBack={handleBack} onSubmit={handleCreateForumPost} /></Suspense>;
        default: return null;
    }
};
