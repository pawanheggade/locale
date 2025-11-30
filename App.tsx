

import React, { useState, useCallback, useEffect, useMemo, useRef, createContext, useContext } from 'react';
import { DisplayablePost, NotificationSettings, Notification, Account, AdminView, AppView, PostType } from './types';
import { Header } from './components/Header';
import PullToRefreshIndicator from './components/PullToRefreshIndicator';
import { useUI } from './contexts/UIContext';
import { useFilters } from './contexts/FiltersContext';
import { useAuth } from './contexts/AuthContext';
import { usePosts } from './contexts/PostsContext';
import { useActivity } from './contexts/ActivityContext';
import { usePersistentState } from './hooks/usePersistentState';
import { usePullToRefresh } from './hooks/usePullToRefresh';
import { geocodeLocation, reverseGeocode, haversineDistance } from './utils/geocoding';
import { useIsMounted } from './hooks/useIsMounted';
import { cn } from './lib/utils';

import { AppModals } from './components/AppModals';
import { GuestPrompt } from './components/GuestPrompt';
import { OfflineIndicator } from './components/OfflineIndicator';
import { useConfirmationModal } from './hooks/useConfirmationModal';
import { ViewManager } from './components/ViewManager';
import ErrorBoundary from './components/ErrorBoundary';


interface HistoryItem {
    view: AppView;
    mainView: 'grid' | 'map';
    viewingPostId: string | null;
    viewingAccount: Account | null;
    viewingForumPostId: string | null;
    scrollPosition: number;
}

const NOTIFICATION_SETTINGS_KEY = 'localeAppNotifSettings';

// --- Navigation Context ---
interface NavigationContextType {
  navigateTo: (view: AppView, options?: { postId?: string; account?: Account, forumPostId?: string }) => void;
  handleBack: () => void;
  showOnMap: (target: string | Account) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);
export const useNavigation = () => {
    const context = useContext(NavigationContext);
    if (!context) throw new Error('useNavigation must be used within a NavigationProvider');
    return context;
};


export const App: React.FC = () => {
  const { 
    currentAccount, accountsById, signOut: authSignOut, 
    addPostToViewHistory, incrementProfileViews, toggleAccountStatus
  } = useAuth();
  
  const { markAsRead } = useActivity();
  const { refreshPosts } = usePosts();
  const { openModal, closeModal } = useUI();
  const showConfirmation = useConfirmationModal();
  const isMounted = useIsMounted();

  const { filterState, dispatchFilterAction, handleAiSearchSubmit, handleToggleAiSearch, onClearFilters, isAnyFilterActive } = useFilters();
  
  const [view, setView] = useState<AppView>('all');
  const [mainView, setMainView] = useState<'grid' | 'map'>('grid');
  const [gridView, setGridView] = usePersistentState<'default' | 'compact'>('localeAppGridView', 'default');
  const [viewingPostId, setViewingPostId] = useState<string | null>(null);
  const [viewingForumPostId, setViewingForumPostId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
          return;
      }

      if (newView === 'postDetail' && options.postId && currentAccount) {
        addPostToViewHistory(options.postId);
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
          scrollPosition: currentScrollPosition
      }]);

      setView(newView);
      setViewingPostId(options.postId || null);
      setViewingAccount(options.account || null);
      setViewingForumPostId(options.forumPostId || null);
      
      // Reset scroll for the new view
      if (mainContentRef.current) mainContentRef.current.scrollTop = 0;
  }, [view, mainView, viewingPostId, viewingAccount, viewingForumPostId, currentAccount, addPostToViewHistory, incrementProfileViews]);

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
      const currentScrollPosition = mainContentRef.current ? mainContentRef.current.scrollTop : 0;
      setHistory(h => [...h, { 
          view, 
          mainView, 
          viewingPostId, 
          viewingAccount, 
          viewingForumPostId,
          scrollPosition: currentScrollPosition
      }]);
      setMainView(newMainView);
  }, [view, mainView, viewingPostId, viewingAccount, viewingForumPostId]);

  const showOnMap = useCallback(async (target: string | Account) => {
    const currentScrollPosition = mainContentRef.current ? mainContentRef.current.scrollTop : 0;
    setHistory(h => [...h, { 
        view, 
        mainView, 
        viewingPostId, 
        viewingAccount, 
        viewingForumPostId,
        scrollPosition: currentScrollPosition
    }]);
    
    if (typeof target === 'string') {
      setView('all'); setMainView('map'); setPostToFocusOnMap(target);
    } else {
      const account = target as Account;
      let coords = account.coordinates;
      if (!coords && account.address) {
        setIsGeocoding(true);
        try { coords = await geocodeLocation(account.address); } 
        catch (e) { console.error(e); } 
        finally { if (isMounted()) setIsGeocoding(false); }
      }
      if (coords) { setLocationToFocus({ coords, name: account.name }); setView('all'); setMainView('map'); } 
      else { console.error(`Could not find location for ${account.name}.`); }
    }
  }, [isMounted, mainView, view, viewingAccount, viewingForumPostId, viewingPostId]);

  const handleFindNearby = useCallback(async (coords: { lat: number; lng: number }) => {
      if (isFindingNearby) return;
      // This function needs all posts, which it can get from context.
      // But for simplicity of this refactor, we'll keep it here as it needs
      // to access many things.
      const allPosts = (window as any).__POSTS_FOR_GEOCODING || [];
      setIsFindingNearby(true);
      try {
          const locationName = await reverseGeocode(coords.lat, coords.lng);
          const nearby = allPosts.map((post: DisplayablePost) => {
            const postCoords = post.type === PostType.EVENT ? post.eventCoordinates : post.coordinates;
            if (!postCoords) return null;
            const distance = haversineDistance(coords, postCoords);
            return { ...post, distance };
          }).filter((p): p is DisplayablePost & { distance: number } => p !== null && p.distance <= 50)
            .sort((a: any,b: any) => a.distance - b.distance);

          setNearbyPostsResult({ posts: nearby, locationName });
          closeModal();
          navigateTo('nearbyPosts');
      } catch (error) {
          console.error('Failed to find nearby posts', error);
      } finally {
          if (isMounted()) setIsFindingNearby(false);
      }
  }, [isFindingNearby, closeModal, navigateTo, isMounted]);
  
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
                setIsHeaderVisible(prev => !prev ? prev : false);
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

  const navigationContextValue = useMemo(() => ({
      navigateTo,
      handleBack,
      showOnMap,
  }), [navigateTo, handleBack, showOnMap]);

  return (
    <NavigationContext.Provider value={navigationContextValue}>
      <div className="flex flex-col h-screen" {...touchHandlers}>
        <Header 
          searchQuery={filterState.searchQuery}
          onSearchChange={(q) => dispatchFilterAction({ type: 'SET_SEARCH_QUERY', payload: q })}
          onSearchSubmit={filterState.isAiSearchEnabled ? handleAiSearchSubmitWithHistory : handleSearchSubmit}
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
                 <ErrorBoundary>
                    <ViewManager
                      view={view}
                      mainView={mainView}
                      gridView={gridView}
                      isInitialLoading={isInitialLoading}
                      isFiltering={filterState.isAiSearching}
                      userLocation={userLocation}
                      postToFocusOnMap={postToFocusOnMap}
                      onPostFocusComplete={() => setPostToFocusOnMap(null)}
                      locationToFocus={locationToFocus}
                      onLocationFocusComplete={() => setLocationToFocus(null)}
                      viewingAccount={viewingAccount}
                      viewingPostId={viewingPostId}
                      viewingForumPostId={viewingForumPostId}
                      nearbyPostsResult={nearbyPostsResult}
                      adminInitialView={adminInitialView}
                      isGeocoding={isGeocoding}
                    />
                 </ErrorBoundary>
              </div>
            </>
          ) : (
             <ErrorBoundary>
                <ViewManager
                  view={view}
                  mainView={mainView}
                  gridView={gridView}
                  isInitialLoading={isInitialLoading}
                  isFiltering={filterState.isAiSearching}
                  userLocation={userLocation}
                  postToFocusOnMap={postToFocusOnMap}
                  onPostFocusComplete={() => setPostToFocusOnMap(null)}
                  locationToFocus={locationToFocus}
                  onLocationFocusComplete={() => setLocationToFocus(null)}
                  viewingAccount={viewingAccount}
                  viewingPostId={viewingPostId}
                  viewingForumPostId={viewingForumPostId}
                  nearbyPostsResult={nearbyPostsResult}
                  adminInitialView={adminInitialView}
                  isGeocoding={isGeocoding}
                />
             </ErrorBoundary>
          )}
        </main>
        <OfflineIndicator />
        {!currentAccount && (view === 'all' || view === 'postDetail' || view === 'account') && (
          <GuestPrompt onSignIn={() => openModal({ type: 'login' })} onCreateAccount={() => openModal({ type: 'createAccount' })} />
        )}
        <AppModals
            activeModal={openModal}
            closeModal={closeModal}
            openModal={openModal}
            isFindingNearby={isFindingNearby}
            handleFindNearby={handleFindNearby}
            userLocation={userLocation}
            onSignOut={requestSignOut}
        />
      </div>
    </NavigationContext.Provider>
  );
};