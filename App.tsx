import React, { useState, useCallback, useEffect, useMemo, useRef, Suspense } from 'react';
import { Account, ActivityTab, AdminView, AppView, DisplayablePost, FiltersState, ModalState, Notification, NotificationSettings, Post, PostType } from './types';
import { Header } from './components/Header';
import { ViewRenderer } from './components/ViewRenderer';
import PullToRefreshIndicator from './components/PullToRefreshIndicator';
import { useUI } from './contexts/UIContext';
import { useFilters } from './contexts/FiltersContext';
import { useAuth } from './contexts/AuthContext';
import { usePosts } from './contexts/PostsContext';
import { usePersistentState } from './hooks/usePersistentState';
import { usePullToRefresh } from './hooks/usePullToRefresh';
import ErrorBoundary from './components/ErrorBoundary';
import { AppModals } from './AppModals';
import { GuestPrompt } from './components/GuestPrompt';
import { cn } from './lib/utils';
// FIX: Import haversineDistance function.
import { reverseGeocode, haversineDistance } from './utils/geocoding';
import { OfflineIndicator } from './components/OfflineIndicator';
import { useIsMounted } from './hooks/useIsMounted';
import { LoadingFallback } from './components/ui/LoadingFallback';
import { NavigationContext } from './contexts/NavigationContext';
import { STORAGE_KEYS } from './lib/constants';

interface HistoryItem {
    view: AppView;
    mainView: 'grid' | 'map';
    viewingPostId: string | null;
    viewingAccount: Account | null;
    viewingForumPostId: string | null;
    editingAdminPageKey: 'terms' | 'privacy' | null;
    scrollPosition: number;
    filters: FiltersState;
}

const PROTECTED_VIEWS: AppView[] = [
  'likes', 'bag', 'admin', 'createPost', 'editPost', 'nearbyPosts', 'accountAnalytics', 
  'subscription', 'activity', 'editProfile', 'manageCatalog', 'createForumPost'
];

export const App: React.FC = () => {
  const { currentAccount, accountsById, signOut, addPostToViewHistory, incrementProfileViews } = useAuth();
  // FIX: Destructure 'posts' instead of 'allDisplayablePosts' to match the context provider.
  const { posts, findPostById, refreshPosts } = usePosts();
  
  const { activeModal, openModal, closeModal, addToast } = useUI();
  const isMounted = useIsMounted();

  const { filterState, dispatchFilterAction, onClearFilters, isAnyFilterActive } = useFilters();
  
  const [view, setView] = useState<AppView>('all');
  const [mainView, setMainView] = useState<'grid' | 'map'>('grid');
  
  const [viewingPostId, setViewingPostId] = useState<string | null>(null);
  const [viewingForumPostId, setViewingForumPostId] = useState<string | null>(null);
  const [editingAdminPageKey, setEditingAdminPageKey] = useState<'terms' | 'privacy' | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isFindingNearby, setIsFindingNearby] = useState(false);
  const [viewingAccount, setViewingAccount] = useState<Account | null>(null);
  const [postToFocusOnMap, setPostToFocusOnMap] = useState<string | null>(null);
  const [locationToFocus, setLocationToFocus] = useState<{ coords: { lat: number; lng: number; }; name: string; } | null>(null);
  const [adminInitialView, setAdminInitialView] = useState<AdminView>();
  const [isScrolled, setIsScrolled] = useState(false);
  const [nearbyPostsResult, setNearbyPostsResult] = useState<{ posts: DisplayablePost[], locationName: string | null } | null>(null);
  const [recentSearches, setRecentSearches] = usePersistentState<string[]>(STORAGE_KEYS.RECENT_SEARCHES, []);
  const [activityInitialTab, setActivityInitialTab] = useState<ActivityTab>('notifications');
  
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollTopRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const mainContentRef = useRef<HTMLDivElement>(null);

  const isEditorView = useMemo(() => ['createPost', 'editPost', 'editProfile', 'manageCatalog', 'createForumPost', 'editAdminPage'].includes(view), [view]);

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

  const pushHistoryState = useCallback(() => {
    const currentScrollPosition = mainContentRef.current ? mainContentRef.current.scrollTop : 0;
    setHistory(h => [...h, { 
        view, 
        mainView, 
        viewingPostId, 
        viewingAccount, 
        viewingForumPostId,
        editingAdminPageKey,
        scrollPosition: currentScrollPosition,
        filters: filterState,
    }]);
  }, [view, mainView, viewingPostId, viewingAccount, viewingForumPostId, editingAdminPageKey, filterState]);

  const navigateTo = useCallback((
      newView: AppView,
      options: { postId?: string; account?: Account, forumPostId?: string, pageKey?: 'terms' | 'privacy', activityTab?: ActivityTab } = {}
  ) => {
      if (!currentAccount && PROTECTED_VIEWS.includes(newView)) {
          openModal({ type: 'login' });
          return;
      }

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
      
      if (newView === 'activity' && options.activityTab) {
          setActivityInitialTab(options.activityTab);
      } else {
          setActivityInitialTab('notifications'); // Reset to default for any other navigation.
      }

      pushHistoryState();

      setView(newView);
      setViewingPostId(options.postId || null);
      setViewingAccount(options.account || null);
      setViewingForumPostId(options.forumPostId || null);
      setEditingAdminPageKey(options.pageKey || null);
      
      // Reset scroll for the new view
      if (mainContentRef.current) mainContentRef.current.scrollTop = 0;
  }, [view, viewingPostId, viewingAccount, viewingForumPostId, editingAdminPageKey, currentAccount, incrementProfileViews, pushHistoryState, openModal]);

  const navigateToAccount = useCallback((accountId: string) => {
    const account = accountsById.get(accountId);
    if (account) {
      navigateTo('account', { account });
    }
  }, [accountsById, navigateTo]);

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
  
  const handleBack = useCallback(() => {
    const lastHistoryItem = history.length > 0 ? history[history.length - 1] : null;
    if (lastHistoryItem) {
      if(lastHistoryItem.filters) {
          dispatchFilterAction({ type: 'SET_ALL_FILTERS', payload: lastHistoryItem.filters });
      }
      setView(lastHistoryItem.view);
      setMainView(lastHistoryItem.mainView);
      setViewingPostId(lastHistoryItem.viewingPostId);
      setViewingAccount(lastHistoryItem.viewingAccount);
      setViewingForumPostId(lastHistoryItem.viewingForumPostId);
      setEditingAdminPageKey(lastHistoryItem.editingAdminPageKey);
      setHistory(h => h.slice(0, -1));

      // Restore scroll position after a short delay to allow content to render
      setTimeout(() => {
        if (mainContentRef.current) {
            mainContentRef.current.scrollTop = lastHistoryItem.scrollPosition;
        }
      }, 50);
    } else {
      // Default back action if history is empty
      if (view !== 'all') {
        navigateTo('all');
      }
    }
  }, [history, navigateTo, view, dispatchFilterAction]);

  const showBackButton = (view !== 'all' && history.length > 0) || (view === 'all' && isAnyFilterActive);

  const backAction = useCallback(() => {
    if (view === 'all' && isAnyFilterActive) {
        onClearFilters();
    } else {
        handleBack();
    }
  }, [view, isAnyFilterActive, onClearFilters, handleBack]);

  const handleGoHome = useCallback(() => {
    onClearFilters();
    if (mainView === 'map') {
      setMainView('grid');
    }
  
    // This is a hard reset to the home screen.
    // Clear history so the back button doesn't show.
    setHistory([]);

    // Manually reset view state instead of using navigateTo, which manages history.
    setView('all');
    setViewingPostId(null);
    setViewingAccount(null);
    setViewingForumPostId(null);
    setEditingAdminPageKey(null);

    // Scroll to top
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
    
    // Refresh content
    handleRefresh();
  }, [onClearFilters, mainView, handleRefresh]);

  useEffect(() => {
    // If the user signs out while on a protected page, navigate them to the home feed.
    if (!currentAccount && PROTECTED_VIEWS.includes(view)) {
      handleGoHome();
    }
  }, [currentAccount, view, handleGoHome]);

  const handleMainViewChange = useCallback((newMainView: 'grid' | 'map') => {
      pushHistoryState();
      setMainView(newMainView);
  }, [pushHistoryState]);

  const showOnMap = useCallback((target: string | Account) => {
    const isPostId = typeof target === 'string';
    const post = isPostId ? findPostById(target) : null;
    const account = !isPostId ? target as Account : null;

    if (post) {
      if (!post.coordinates && !(post.type === PostType.EVENT && post.eventCoordinates)) {
        addToast("This post does not have a location.", "error");
        return;
      }
      setPostToFocusOnMap(post.id);
    } else if (account) {
      if (!account.coordinates) {
        addToast("This user's location is not available.", "error");
        return;
      }
      setLocationToFocus({ coords: account.coordinates, name: account.name });
    }
    
    pushHistoryState();
    setMainView('map');
  }, [findPostById, addToast, pushHistoryState]);

  const handleFindNearby = useCallback(async (coords: { lat: number, lng: number }) => {
    setIsFindingNearby(true);
    closeModal();
    const locationName = await reverseGeocode(coords.lat, coords.lng);
    // FIX: Use 'posts' instead of 'allDisplayablePosts'.
    const nearby = posts.filter(post => {
        const postCoords = post.coordinates || post.eventCoordinates;
        if (!postCoords) return false;
        // FIX: Use imported `haversineDistance` function.
        const distance = haversineDistance(coords, postCoords);
        return distance <= 50; // 50km radius
    // FIX: Use imported `haversineDistance` function.
    }).map(post => ({...post, distance: haversineDistance(coords, post.coordinates || post.eventCoordinates!)}));
    
    nearby.sort((a, b) => a.distance! - b.distance!);

    setNearbyPostsResult({ posts: nearby, locationName });
    setIsFindingNearby(false);
    navigateTo('nearbyPosts');
  // FIX: Update dependency array.
  }, [posts, closeModal, navigateTo]);
  
  const handleEnableLocation = async () => {
      if (!navigator.geolocation) {
          addToast("Geolocation is not supported by your browser.", "error");
          return;
      }
      try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
          });
      } catch (error: any) {
          if (error.code === error.PERMISSION_DENIED) {
               addToast("Location access denied. Please enable it in your browser settings.", "error");
          } else {
               addToast("Could not get your location.", "error");
          }
          throw error;
      }
  };

  const onPostFocusComplete = useCallback(() => {
    setPostToFocusOnMap(null);
  }, []);

  const onLocationFocusComplete = useCallback(() => {
    setLocationToFocus(null);
  }, []);

  const handleScroll = useCallback(() => {
    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = window.requestAnimationFrame(() => {
      if (!mainContentRef.current) return;
      
      const currentScrollTop = mainContentRef.current.scrollTop;
      const lastScrollTop = lastScrollTopRef.current;

      setIsScrolled(currentScrollTop > 0);

      // Scrolling down and past the header threshold
      if (currentScrollTop > lastScrollTop && currentScrollTop > 80) {
        setIsHeaderVisible(false);
      } 
      // Scrolling up
      else if (currentScrollTop < lastScrollTop) {
        setIsHeaderVisible(true);
      }
      
      lastScrollTopRef.current = currentScrollTop <= 0 ? 0 : currentScrollTop;
    });
  }, []);

  // Cleanup raf on component unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // FIX: Provide all required state to the NavigationContext, including view-specific data.
  const navigationContextValue = useMemo(() => ({
    navigateTo,
    navigateToAccount,
    handleBack,
    showOnMap,
    saveHistoryState: pushHistoryState,
    viewingAccount,
    viewingPostId,
    viewingForumPostId,
    editingAdminPageKey,
    activityInitialTab,
    adminInitialView,
    nearbyPostsResult,
    userLocation,
    isFindingNearby,
    postToFocusOnMap,
    onPostFocusComplete,
    locationToFocus,
    onLocationFocusComplete,
  }), [
    navigateTo, navigateToAccount, handleBack, showOnMap, pushHistoryState,
    viewingAccount, viewingPostId, viewingForumPostId, editingAdminPageKey,
    activityInitialTab, adminInitialView, nearbyPostsResult, userLocation,
    isFindingNearby, postToFocusOnMap, onPostFocusComplete, locationToFocus,
    onLocationFocusComplete,
  ]);
  
  const openPostDetailsModal = useCallback((post: DisplayablePost) => {
    if (currentAccount) {
        addPostToViewHistory(post.id);
    }
    openModal({ type: 'viewPost', data: post });
  }, [currentAccount, addPostToViewHistory, openModal]);

  const viewRendererProps = {
    view, mainView, isInitialLoading,
  };

  return (
    <NavigationContext.Provider value={navigationContextValue}>
      <div className="h-screen flex flex-col">
        <Header
          recentSearches={recentSearches}
          onRemoveRecentSearch={(q) => setRecentSearches(prev => prev.filter(s => s !== q))}
          onClearRecentSearches={() => setRecentSearches([])}
          onGoHome={handleGoHome}
          onRefresh={handleRefresh}
          viewingAccount={viewingAccount}
          isScrolled={isScrolled}
          isVisible={isHeaderVisible}
          onBack={showBackButton ? backAction : undefined}
          view={view}
          mainView={mainView}
          onMainViewChange={handleMainViewChange}
        />
        <main
          ref={mainContentRef}
          onScroll={handleScroll}
          className={cn(
            'flex-1',
            (mainView === 'map' && view === 'all')
              ? 'overflow-hidden pt-16' // map is below header, no scroll
              : 'overflow-y-auto pt-16', // default
            // special case for editors
            isEditorView && 'pt-0 overflow-hidden'
          )}
          {...touchHandlers}
        >
          {pullPosition > 0 && <PullToRefreshIndicator pullPosition={pullPosition} isRefreshing={isRefreshing} pullThreshold={pullThreshold} isPulling={isPulling} />}
          <div
            style={{
              transform: `translateY(${pullPosition}px)`,
              transition: !isPulling ? 'transform 0.3s ease-out' : 'none',
            }}
          >
            <div className={cn('relative z-0', (mainView === 'map' || isEditorView) ? 'h-full' : 'p-4 sm:p-6 lg:p-8')}>
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  {isInitialLoading ? <LoadingFallback /> : <ViewRenderer {...viewRendererProps} />}
                </Suspense>
              </ErrorBoundary>
            </div>
          </div>
        </main>
        
        <AppModals 
          activeModal={activeModal} 
          closeModal={closeModal}
          openModal={openModal}
          isFindingNearby={isFindingNearby}
          handleFindNearby={handleFindNearby}
          userLocation={userLocation}
          onSignOut={signOut}
          onEnableLocation={handleEnableLocation}
        />
        
        <OfflineIndicator />
        
        {!currentAccount && view === 'all' && (
          <GuestPrompt 
              onSignIn={() => openModal({ type: 'login' })}
              onCreateAccount={() => openModal({ type: 'createAccount' })}
          />
        )}
      </div>
    </NavigationContext.Provider>
  );
};