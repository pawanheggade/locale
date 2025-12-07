

import React, { useState, useCallback, useEffect, useMemo, useRef, Suspense, createContext, useContext } from 'react';
import { DisplayablePost, NotificationSettings, Notification, Account, ModalState, Subscription, Report, AdminView, AppView, SavedSearch, SavedSearchFilters, Post, PostType, ContactOption, ForumPost, ForumComment, DisplayableForumPost, DisplayableForumComment, Feedback, ActivityTab } from './types';
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
import { geocodeLocation, reverseGeocode, haversineDistance } from './utils/geocoding';
import { OfflineIndicator } from './components/OfflineIndicator';
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
  const [activityInitialTab, setActivityInitialTab] = useState<ActivityTab>('notifications');
  
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollTopRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const mainContentRef = useRef<HTMLDivElement>(null);

  const [notificationSettings, setNotificationSettings] = usePersistentState<NotificationSettings>(NOTIFICATION_SETTINGS_KEY, { expiryAlertsEnabled: true, expiryThresholdDays: 3 });

  // This hook must be called at the top level.
  const viewedPosts = useMemo(() => viewedPostIds.map(id => findPostById(id)).filter((p): p is DisplayablePost => !!p), [viewedPostIds, findPostById]);

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

  const pushHistoryState = useCallback(() => {
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
  }, [view, mainView, viewingPostId, viewingAccount, viewingForumPostId, editingAdminPageKey]);

  const navigateTo = useCallback((
      newView: AppView,
      options: { postId?: string; account?: Account, forumPostId?: string, pageKey?: 'terms' | 'privacy', activityTab?: ActivityTab } = {}
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
  }, [view, viewingPostId, viewingAccount, viewingForumPostId, editingAdminPageKey, currentAccount, incrementProfileViews, pushHistoryState]);

  const navigateToAccount = useCallback((accountId: string) => {
    const account = accountsById.get(accountId);
    if (account) {
      navigateTo('account', { account });
    }
  }, [accountsById, navigateTo]);

  const openPostDetailsModal = useCallback((post: DisplayablePost) => {
    if (currentAccount) {
        addPostToViewHistory(post.id);
    }
    openModal({ type: 'viewPost', data: post });
  }, [currentAccount, addPostToViewHistory, openModal]);

  const handleNotificationClick = useCallback((notification: Notification) => {
    markAsRead(notification.id);
    
    if (notification.postId) {
        const post = findPostById(notification.postId);
        if (post) {
            openPostDetailsModal(post);
        } else {
            addToast("The related post is no longer available.", "error");
        }
    } else if (notification.relatedAccountId) {
        const account = accountsById.get(notification.relatedAccountId);
        if (account) navigateTo('account', { account });
    } else if (notification.forumPostId) {
        navigateTo('forumPostDetail', { forumPostId: notification.forumPostId });
    }
  }, [markAsRead, navigateTo, accountsById, findPostById, openPostDetailsModal, addToast]);

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
          return;
      }
      setFeedbackList(prev => prev.map(f => {
          if (ids.includes(f.id)) {
              switch (action) {
                  case 'markRead': return { ...f, isRead: true };
                  case 'archive': return { ...f, isRead: true, isArchived: true };
                  case 'unarchive': return { ...f, isArchived: false };
              }
          }
          return f;
      }));
  };

  const handleBack = useCallback(() => {
    const lastHistoryItem = history.length > 0 ? history[history.length - 1] : null;
    if (lastHistoryItem) {
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
  }, [history, navigateTo, view]);

  const handleGoHome = useCallback(() => {
    onClearFilters();
    if (mainView === 'map') {
      setMainView('grid');
    }
  
    if (view === 'all') {
      // If already on the home feed, scroll to top and refresh. Filters are cleared above.
      if (mainContentRef.current) {
        mainContentRef.current.scrollTop = 0;
      }
      handleRefresh(); // Trigger a refresh
    } else {
      // Otherwise, navigate to the home feed (this will handle history)
      navigateTo('all');
    }
  }, [navigateTo, onClearFilters, mainView, view, handleRefresh]);

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
    const nearby = allDisplayablePosts.filter(post => {
        const postCoords = post.coordinates || post.eventCoordinates;
        if (!postCoords) return false;
        const distance = haversineDistance(coords, postCoords);
        return distance <= 50; // 50km radius
    }).map(post => ({...post, distance: haversineDistance(coords, post.coordinates || post.eventCoordinates!)}));
    
    nearby.sort((a, b) => a.distance! - b.distance!);

    setNearbyPostsResult({ posts: nearby, locationName });
    setIsFindingNearby(false);
    navigateTo('nearbyPosts');
  }, [allDisplayablePosts, closeModal, navigateTo]);
  
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

  const handleArchiveAccount = useCallback(() => {
    if (!currentAccount) return;
    showConfirmation({
        title: 'Archive Account',
        message: 'Are you sure you want to archive your account? You can reactivate it by signing in again.',
        onConfirm: () => {
            toggleAccountStatus(currentAccount.id, false);
            signOut();
        },
        confirmText: 'Archive',
        confirmClassName: 'bg-amber-600 text-white',
    });
  }, [currentAccount, toggleAccountStatus, signOut, showConfirmation]);

  const debouncedSearchQuery = useDebounce(filterState.searchQuery, 300);
  const debouncedFilters = useDebounce(filterState, 200);

  useEffect(() => {
      const t = setTimeout(() => setIsFiltering(false), 300);
      return () => clearTimeout(t);
  }, [debouncedFilters]);

  const handleScroll = useCallback(() => {
      const currentScrollTop = mainContentRef.current?.scrollTop ?? 0;
      setIsScrolled(currentScrollTop > 0);

      // Simple check to avoid running on every scroll event
      if (Math.abs(currentScrollTop - lastScrollTopRef.current) <= 10) return;
      
      if (currentScrollTop > lastScrollTopRef.current && currentScrollTop > 80) { // Scrolling down
          setIsHeaderVisible(false);
      } else { // Scrolling up
          setIsHeaderVisible(true);
      }
      lastScrollTopRef.current = currentScrollTop;
  }, []);

  const { displayedItems, hasMore, loadMore, isLoadingMore } = useInfiniteScroll(allDisplayablePosts, isInitialLoading);
  const filteredAndSortedPosts = usePostFilters(displayedItems, allDisplayablePosts, userLocation, currentAccount, accounts);

  const postsToShow = (viewingAccount ? allDisplayablePosts.filter(p => p.authorId === viewingAccount.id) : filteredAndSortedPosts);

  const navigationContextValue = useMemo(() => ({
    navigateTo,
    navigateToAccount,
    handleBack,
    showOnMap,
  }), [navigateTo, navigateToAccount, handleBack, showOnMap]);
  
  const createPost = (postData: Omit<Post, 'id' | 'isLiked' | 'authorId'>): Post => {
      if(!currentAccount) throw new Error("No current account");
      const newPost = createPostInContext(postData, currentAccount.id);
      addToast('Post created successfully!', 'success');
      return newPost;
  };
  
  const updatePost = async (updatedPost: Post): Promise<Post> => {
      const result = await updatePostInContext(updatedPost);
      addToast('Post updated successfully!', 'success');
      return result;
  };

  const renderMainContent = () => {
    switch (view) {
      case 'all':
        return mainView === 'grid' ? (
          <PostList
            posts={postsToShow}
            currentAccount={currentAccount}
            onLoadMore={loadMore}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            isFiltering={isFiltering}
            variant={gridView}
            enableEntryAnimation={true}
          />
        ) : (
          <Suspense fallback={<LoadingFallback />}>
            <MapView 
              posts={postsToShow} 
              userLocation={userLocation} 
              isLoading={isInitialLoading}
              onFindNearby={() => openModal({ type: 'findNearby' })}
              isFindingNearby={isFindingNearby}
              postToFocusOnMap={postToFocusOnMap}
              onPostFocusComplete={() => setPostToFocusOnMap(null)}
              onViewPostDetails={openPostDetailsModal}
              locationToFocus={locationToFocus}
              onLocationFocusComplete={() => setLocationToFocus(null)}
            />
          </Suspense>
        );
      case 'likes':
        if (!currentAccount) return <GuestPrompt onSignIn={() => openModal({ type: 'login' })} onCreateAccount={() => openModal({ type: 'createAccount' })} />;
        const likedPosts = allDisplayablePosts.filter(post => likedPostIds.has(post.id));
        return (
            <Suspense fallback={<LoadingFallback />}>
                <LikesView likedPosts={likedPosts} currentAccount={currentAccount} allAccounts={accounts} />
            </Suspense>
        );
      case 'bag':
        if (!currentAccount) return <GuestPrompt onSignIn={() => openModal({ type: 'login' })} onCreateAccount={() => openModal({ type: 'createAccount' })} />;
        return (
            <Suspense fallback={<LoadingFallback />}>
                <BagView onViewDetails={openPostDetailsModal} allAccounts={accounts} />
            </Suspense>
        );
      case 'admin':
        if (currentAccount?.role !== 'admin') return <div className="p-8 text-center text-red-600">Access Denied.</div>;
        return (
            <Suspense fallback={<LoadingFallback />}>
                <AdminPanel 
                    initialView={adminInitialView} 
                    feedbackList={feedbackList}
                    onDeleteFeedback={handleDeleteFeedback}
                    onToggleFeedbackArchive={handleToggleFeedbackArchive}
                    onMarkFeedbackAsRead={handleMarkFeedbackAsRead}
                    onBulkFeedbackAction={handleBulkFeedbackAction}
                />
            </Suspense>
        );
      case 'account':
        if (!viewingAccount) return <div className="p-8 text-center">Account not found.</div>;
        return (
            <Suspense fallback={<LoadingFallback />}>
                <AccountView
                    account={viewingAccount}
                    currentAccount={currentAccount}
                    posts={allDisplayablePosts}
                    archivedPosts={archivedPosts}
                    allAccounts={accounts}
                />
            </Suspense>
        );
      case 'nearbyPosts':
        if (!nearbyPostsResult) return <div className="p-8 text-center">No nearby results available.</div>;
        if (!currentAccount) return <GuestPrompt onSignIn={() => openModal({ type: 'login' })} onCreateAccount={() => openModal({ type: 'createAccount' })} />;
        return (
            <Suspense fallback={<LoadingFallback />}>
                <NearbyPostsView result={nearbyPostsResult} currentAccount={currentAccount} />
            </Suspense>
        );
       case 'forums':
        return (
            <Suspense fallback={<LoadingFallback />}>
                <ForumsView />
            </Suspense>
        );
       case 'forumPostDetail':
        if (!viewingForumPostId) return null;
        return <ForumsPostDetailView postId={viewingForumPostId} onBack={handleBack} />;
      case 'createPost':
        if (!currentAccount) return <GuestPrompt onSignIn={() => openModal({ type: 'login' })} onCreateAccount={() => openModal({ type: 'createAccount' })} />;
        return (
            <CreatePostPage 
                onBack={handleBack} 
                onSubmitPost={createPost}
                onNavigateToPost={() => navigateTo('all')} 
                currentAccount={currentAccount} 
                categories={categories}
                onUpdateCurrentAccountDetails={(details) => updateAccountDetails({ ...currentAccount, ...details })}
            />
        );
      case 'editPost':
          if (!viewingPostId) return null;
          const postToEdit = findPostById(viewingPostId);
          if (!postToEdit) return <div className="p-8 text-center">Post not found.</div>;
          if (!currentAccount || (currentAccount.id !== postToEdit.authorId && currentAccount.role !== 'admin')) return <div className="p-8 text-center">You don't have permission to edit this post.</div>;
          return (
              <CreatePostPage 
                  onBack={handleBack}
                  onSubmitPost={createPost}
                  onUpdatePost={updatePost}
                  onNavigateToPost={() => {
                      openPostDetailsModal(postToEdit);
                      handleBack();
                  }}
                  editingPost={postToEdit}
                  currentAccount={currentAccount}
                  categories={categories}
              />
          );
      case 'subscription':
        if (!currentAccount) return <GuestPrompt onSignIn={() => openModal({ type: 'login' })} onCreateAccount={() => openModal({ type: 'createAccount' })} />;
        return (
            <SubscriptionPage 
                currentAccount={currentAccount} 
                onUpdateSubscription={(tier) => updateSubscription(currentAccount.id, tier)}
                openModal={openModal}
            />
        );
      case 'activity':
        if (!currentAccount) return <GuestPrompt onSignIn={() => openModal({ type: 'login' })} onCreateAccount={() => openModal({ type: 'createAccount' })} />;
        const markAllAsRead = () => {
            notifications.forEach(n => {
                if (!n.isRead) markAsRead(n.id);
            });
        };
        return (
            <ActivityPage
                notifications={notifications.filter(n => n.recipientId === currentAccount.id)}
                onDismiss={markAsRead}
                onDismissAll={markAllAsRead}
                onNotificationClick={handleNotificationClick}
                viewedPosts={viewedPosts}
                currentAccount={currentAccount}
                settings={notificationSettings}
                onSettingsChange={handleUpdateNotificationSettings}
                onArchiveAccount={handleArchiveAccount}
                onSignOut={signOut}
                initialTab={activityInitialTab}
            />
        );
      case 'accountAnalytics':
        if (!currentAccount || !viewingAccount || viewingAccount.id !== currentAccount.id) return <div className="p-8 text-center">Access denied.</div>;
        return (
            <Suspense fallback={<LoadingFallback />}>
                <AccountAnalyticsView 
                    account={viewingAccount}
                    accountPosts={allDisplayablePosts.filter(p => p.authorId === viewingAccount.id)}
                    allCategories={categories}
                    allAccounts={accounts}
                />
            </Suspense>
        );
       case 'editAdminPage':
         if (!editingAdminPageKey) return null;
         return (
             <Suspense fallback={<LoadingFallback />}>
                 <EditPageView
                     pageKey={editingAdminPageKey}
                     initialContent={editingAdminPageKey === 'terms' ? termsContent : privacyContent}
                     onSave={(content) => {
                         if (editingAdminPageKey === 'terms') setTermsContent(content);
                         else setPrivacyContent(content);
                     }}
                     onBack={handleBack}
                 />
             </Suspense>
         );
       case 'editProfile':
           if (!currentAccount) return null;
           return (
               <Suspense fallback={<LoadingFallback />}>
                   <EditProfilePage account={currentAccount} onBack={handleBack} />
               </Suspense>
           );
       case 'manageCatalog':
           if (!currentAccount) return null;
            return (
                <Suspense fallback={<LoadingFallback />}>
                    <ManageCatalogPage account={currentAccount} onBack={handleBack} />
                </Suspense>
            );
       case 'createForumPost':
            if (!currentAccount) return null;
            return (
                <Suspense fallback={<LoadingFallback />}>
                    <CreateForumPostPage 
                        onBack={handleBack} 
                        onSubmit={(postData) => {
                            const newPost = createForumPost(postData);
                            if (newPost) {
                                navigateTo('forumPostDetail', { forumPostId: newPost.id });
                            }
                        }}
                    />
                </Suspense>
            );
      default: return null;
    }
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
          onBack={history.length > 0 && view !== 'all' ? handleBack : undefined}
          view={view}
          mainView={mainView}
          onMainViewChange={handleMainViewChange}
          gridView={gridView}
          onGridViewChange={setGridView}
        />
        <main
          ref={mainContentRef}
          onScroll={handleScroll}
          className={cn(
            'flex-1 overflow-y-auto pt-16',
            (mainView === 'map' || ['createPost', 'editPost', 'editProfile', 'manageCatalog', 'createForumPost', 'editAdminPage'].includes(view)) && 'pt-0'
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
            <div className={cn('relative z-0', mainView === 'map' || ['createPost', 'editPost'].includes(view) ? 'h-full' : 'p-4 sm:p-6 lg:p-8')}>
              <ErrorBoundary>
                {isInitialLoading ? <LoadingFallback /> : renderMainContent()}
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