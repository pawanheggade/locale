
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Media, PostCategory, DisplayablePost, PostActions, NotificationSettings, Notification, Account, ModalState, Subscription, Report, AdminView, AppView, SavedSearch, SavedSearchFilters, Post, PostType, ContactOption, ForumPost, ForumComment, DisplayableForumPost, DisplayableForumComment, Feedback } from './types';
import { Header } from './components/Header';
import { PostList } from './components/PostList';
import { MapView } from './components/MapView';
import { haversineDistance, reverseGeocode, geocodeLocation } from './utils/geocoding';
import PullToRefreshIndicator from './components/PullToRefreshIndicator';
import BagView from './components/BagView';
import { AdminPanel } from './components/AdminPanel';
import { AccountView } from './components/AccountView';
import LikesView from './components/LikesView';
import { useUI } from './contexts/UIContext';
import { useFilters } from './contexts/FiltersContext';
import { useAuth } from './contexts/AuthContext';
import { usePosts } from './contexts/PostsContext';
import { useForum } from './contexts/ForumContext';
import { usePostFilters } from './hooks/usePostFilters';
import { usePersistentState } from './hooks/usePersistentState';
import { usePullToRefresh } from './hooks/usePullToRefresh';
import { useInfiniteScroll } from './hooks/useInfiniteScroll';
import { initialTermsContent, initialPrivacyContent } from './data/pageContent';
import ErrorBoundary from './components/ErrorBoundary';
import { AppModals } from './components/AppModals';
import { PostDetailView } from './components/PostDetailView';
import { NearbyPostsView } from './components/NearbyPostsModal';
import { ForumView } from './components/ForumView';
import { ForumPostDetailView } from './components/ForumPostDetailView';
import { PostActionsContext } from './contexts/PostActionsContext';
import { GuestPrompt } from './components/GuestPrompt';
import { CreatePostPage } from './components/CreatePostPage';
import { AccountAnalyticsView } from './components/AccountAnalyticsView';
import { useDebounce } from './hooks/useDebounce';
import { cn } from './lib/utils';
import { NewPostsIndicator } from './components/NewPostsIndicator';
import { SubscriptionPage } from './components/SubscriptionModal';
import { generateHistoryBasedRecommendations } from './utils/posts';
import { OfflineIndicator } from './components/OfflineIndicator';

const NOTIFICATION_SETTINGS_KEY = 'localeAppNotifSettings';

interface HistoryItem {
    view: AppView;
    mainView: 'grid' | 'map';
    viewingPostId: string | null;
    viewingAccount: Account | null;
    viewingForumPostId: string | null;
}

const loadNotificationSettingsFromStorage = (): NotificationSettings => {
  const defaultSettings: NotificationSettings = {
    expiryAlertsEnabled: true,
    expiryThresholdDays: 3,
  };
  try {
    const saved = window.localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    return saved ? Object.assign({}, defaultSettings, JSON.parse(saved)) : defaultSettings;
  } catch (error) {
    console.error('Error reading notification settings from local storage:', error);
    return defaultSettings;
  }
};

export const App: React.FC = () => {
  const { 
    currentAccount, accounts, accountsById, login, signOut: authSignOut, createAccount, updateAccount, socialLogin, toggleLikeAccount: rawToggleLikeAccount, toggleLikePost: rawToggleLikePost, likedPostIds, deleteAccount, toggleAccountStatus, updateSubscription, updateAccountRole, approveAccount, rejectAccount, upgradeToSeller, updateAccountDetails,
    bag, addToBag, removeBagItem, updateBagItem, clearCheckedBagItems, notifications, setNotifications, priceAlerts, setPriceAlert, deletePriceAlert, addNotification, setNotifiedPostIds, availabilityAlerts, setAvailabilityAlert, deleteAvailabilityAlert,
    addPostToViewHistory, viewedPostIds, addCatalogItems, removeCatalogItem, toggleSavedSearchAlert, checkSavedSearchesMatches,
    savedSearches, addSavedSearch, deleteSavedSearch
  } = useAuth();
  const { 
    posts: allDisplayablePosts, archivedPosts, refreshPosts, categories, allAvailableTags, createPost: createPostInContext, updatePost: updatePostInContext, archivePost, unarchivePost, deletePostPermanently, addCategory, updateCategory, deleteCategory, findPostById,
    togglePinPost, addPostSilently, priceUnits, addPriceUnit, updatePriceUnit, deletePriceUnit,
  } = usePosts();
  const { posts: forumPosts, getPostWithComments, addPost: addForumPost, deletePost: deleteForumPost, deleteComment: deleteForumComment, findForumPostById, categories: forumCategories, addCategory: addForumCategory, updateCategory: updateForumCategory, deleteCategory: deleteForumCategory } = useForum();
  const { activeModal, openModal, closeModal, addToast } = useUI();

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
  const [isConfirming, setIsConfirming] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isFindingNearby, setIsFindingNearby] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [viewingAccount, setViewingAccount] = useState<Account | null>(null);
  const [postToFocusOnMap, setPostToFocusOnMap] = useState<string | null>(null);
  const [locationToFocus, setLocationToFocus] = useState<{ coords: { lat: number; lng: number; }; name: string; } | null>(null);
  const [adminInitialView, setAdminInitialView] = useState<AdminView>();
  const [isScrolled, setIsScrolled] = useState(false);
  const [nearbyPostsResult, setNearbyPostsResult] = useState<{ posts: DisplayablePost[], locationName: string | null } | null>(null);
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(loadNotificationSettingsFromStorage());
  const [recentSearches, setRecentSearches] = usePersistentState<string[]>('localeAppRecentSearches', []);
  const [reports, setReports] = usePersistentState<Report[]>('localeAppReports', []);
  const [feedbackList, setFeedbackList] = usePersistentState<Feedback[]>('localeAppFeedback', []);
  const [termsContent, setTermsContent] = usePersistentState<string>('localeAppTermsContent', initialTermsContent);
  const [privacyContent, setPrivacyContent] = usePersistentState<string>('localeAppPrivacyContent', initialPrivacyContent);
  
  // Real-time update state
  const [hasNewPosts, setHasNewPosts] = useState(false);
  const knownPostIdsRef = useRef<Set<string>>(new Set());
  
  // Header visibility state
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollTopRef = useRef(0);

  const mainContentRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    setIsInitialLoading(false); // Remove initial load simulation
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                if (isMountedRef.current) {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                }
            },
            (error) => {
                // Log the specific error message and code for easier debugging
                // We suppress the toast on initial load to avoid annoying the user if permissions are blocked
                console.warn(`Geolocation error: ${error.message} (Code: ${error.code})`);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }
  }, []);

  const handleRefresh = useCallback(() => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setHasNewPosts(false); // Reset indicator on manual refresh
    
    // Simulate a network delay. A pull-to-refresh action is asynchronous by nature.
    // Removing the delay entirely causes UI state updates to be batched,
    // preventing the loading indicator from showing.
    setTimeout(() => {
        if (isMountedRef.current) {
            refreshPosts();
            setIsRefreshing(false);
            addToast('Feed updated!', 'success');
            // After refresh, all currently visible posts are "known"
            setTimeout(() => {
                if (isMountedRef.current) {
                    knownPostIdsRef.current = new Set(allDisplayablePosts.map(p => p.id));
                }
            }, 100);
        }
    }, 1000);
  }, [isRefreshing, refreshPosts, addToast, allDisplayablePosts]);

  const { pullPosition, touchHandlers, isPulling, pullThreshold } = usePullToRefresh({ onRefresh: handleRefresh, mainContentRef, isRefreshing, disabled: view !== 'all' || mainView !== 'grid' });

  const withAuthCheck = useCallback((action: (...args: any[]) => any) => {
    return (...args: any[]) => {
        if (!currentAccount) {
            openModal({ type: 'login' });
            return;
        }
        // FIX: Removed incorrect type annotation `any[]` when calling the action.
        return action(...args);
    };
  }, [currentAccount, openModal]);

  const toggleLikePost = withAuthCheck(rawToggleLikePost);
  const toggleLikeAccount = withAuthCheck(rawToggleLikeAccount);

  // Initialize known post IDs
  useEffect(() => {
    if (allDisplayablePosts.length > 0 && knownPostIdsRef.current.size === 0) {
        knownPostIdsRef.current = new Set(allDisplayablePosts.map(p => p.id));
    }
  }, [allDisplayablePosts]);

  // Detect new posts from state and show indicator
  useEffect(() => {
    if (view !== 'all' || mainView !== 'grid' || isInitialLoading) return;

    const currentPostIds = new Set(allDisplayablePosts.map(p => p.id));
    if (currentPostIds.size <= knownPostIdsRef.current.size) {
        knownPostIdsRef.current = currentPostIds;
        return;
    }

    const newPostExists = [...currentPostIds].some(id => !knownPostIdsRef.current.has(id));

    if (newPostExists) {
        // Trigger Saved Search Check for potential alerts
        const newPosts = allDisplayablePosts.filter(p => !knownPostIdsRef.current.has(p.id));
        checkSavedSearchesMatches(newPosts);

        if (mainContentRef.current && mainContentRef.current.scrollTop > 50) {
            setHasNewPosts(true);
        } else {
            knownPostIdsRef.current = currentPostIds;
        }
    }
  }, [allDisplayablePosts, view, mainView, isInitialLoading, checkSavedSearchesMatches]);
  
  const handleShowNewPosts = () => {
      if (mainContentRef.current) {
          mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      setHasNewPosts(false);
      knownPostIdsRef.current = new Set(allDisplayablePosts.map(p => p.id));
  };

  const handleSearchSubmit = useCallback((query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setRecentSearches(prev => {
      const lowercasedQuery = trimmedQuery.toLowerCase();
      const newSearches = [trimmedQuery, ...prev.filter(s => s.toLowerCase() !== lowercasedQuery)];
      return newSearches.slice(0, 10); // Keep only the 10 most recent searches
    });
  }, [setRecentSearches]);

  const handleReportSubmit = (postId: string, reason: string) => {
    if (!currentAccount) return;
    const newReport: Report = { 
        id: `report-${Date.now()}`, 
        postId, 
        reason, 
        timestamp: Date.now(), 
        reporterId: currentAccount.id 
    };
    setReports(prev => [newReport, ...prev]);
    closeModal();
    setAdminInitialView('reports');
    addToast('Report submitted.', 'success');
  };

  const handleForumReportSubmit = (item: ForumPost | ForumComment, type: 'post' | 'comment', reason: string) => {
    if (!currentAccount) return;
    const newReport: Report = {
      id: `report-${Date.now()}`,
      reason,
      timestamp: Date.now(),
      reporterId: currentAccount.id,
      forumPostId: type === 'post' ? item.id : ('postId' in item ? item.postId : undefined),
      forumCommentId: type === 'comment' ? item.id : undefined,
    };
    setReports(prev => [newReport, ...prev]);
    closeModal();
    setAdminInitialView('reports');
    addToast('Report submitted.', 'success');
  };

  const handleFeedbackSubmit = (content: string) => {
    if (!currentAccount) return;
    const newFeedback: Feedback = {
        id: `feedback-${Date.now()}`,
        userId: currentAccount.id,
        content,
        timestamp: Date.now(),
        isRead: false,
    };
    setFeedbackList(prev => [newFeedback, ...prev]);
    closeModal();
    addToast('Feedback sent! Thank you.', 'success');
  };

  const handleToggleFeedbackArchive = (feedbackId: string) => {
      setFeedbackList(prev => prev.map(f => f.id === feedbackId ? { ...f, isArchived: !f.isArchived } : f));
      addToast('Feedback updated.', 'success');
  };

  const handleDeleteFeedback = (feedbackId: string) => {
      setFeedbackList(prev => prev.filter(f => f.id !== feedbackId));
      addToast('Feedback deleted.', 'success');
  };

  const handleMarkFeedbackAsRead = (feedbackId: string) => {
    setFeedbackList(prev => prev.map(f => f.id === feedbackId ? { ...f, isRead: true } : f));
  };

  const handleBulkFeedbackAction = (ids: string[], action: 'markRead' | 'archive' | 'unarchive' | 'delete') => {
      setFeedbackList(prev => {
          if (action === 'delete') {
              return prev.filter(f => !ids.includes(f.id));
          }
          return prev.map(f => {
              if (ids.includes(f.id)) {
                  if (action === 'markRead') return { ...f, isRead: true };
                  if (action === 'archive') return { ...f, isArchived: true };
                  if (action === 'unarchive') return { ...f, isArchived: false };
              }
              return f;
          });
      });
      const actionText = action === 'delete' ? 'deleted' : 'updated';
      addToast(`${ids.length} feedback items ${actionText}.`, 'success');
  };

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
    openModal({
      type: 'confirmation',
      data: {
        title: 'Sign Out',
        message: 'Are you sure you want to sign out?',
        onConfirm: performSignOut,
        confirmText: 'Sign Out',
        confirmClassName: 'bg-red-600 text-white',
      },
    });
  }, [openModal, performSignOut]);

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

  const navigateTo = useCallback((
      newView: AppView,
      options: { postId?: string; account?: Account, forumPostId?: string } = {}
  ) => {
      // Check if we are already at the destination to prevent duplicate history entries
      const isSameView = view === newView;
      const isSamePost = viewingPostId === (options.postId || null);
      const isSameAccount = viewingAccount?.id === (options.account?.id || null);
      const isSameForumPost = viewingForumPostId === (options.forumPostId || null);

      if (isSameView && isSamePost && isSameAccount && isSameForumPost) return;

      if (newView === 'postDetail' && options.postId && currentAccount) {
        addPostToViewHistory(options.postId);
      }

      setHistory(h => [...h, { view, mainView, viewingPostId, viewingAccount, viewingForumPostId }]);

      setView(newView);
      setViewingPostId(options.postId || null);
      setViewingAccount(options.account || null);
      setViewingForumPostId(options.forumPostId || null);
      if (mainContentRef.current) mainContentRef.current.scrollTop = 0;
  }, [view, mainView, viewingPostId, viewingAccount, viewingForumPostId, currentAccount, addPostToViewHistory]);

  const handleMainViewChange = useCallback((newMainView: 'grid' | 'map') => {
      if (mainView === newMainView) return;
      setHistory(h => [...h, { view, mainView, viewingPostId, viewingAccount, viewingForumPostId }]);
      setMainView(newMainView);
  }, [view, mainView, viewingPostId, viewingAccount, viewingForumPostId]);

  const postActions: PostActions = useMemo(() => ({
    onToggleLikePost: toggleLikePost,
    onArchive: (postId: string) => {
      openModal({
        type: 'confirmation',
        data: {
          title: 'Archive Post',
          message: 'Are you sure you want to archive this post? It will be hidden from the public view.',
          onConfirm: () => archivePost(postId),
          confirmText: 'Archive',
          confirmClassName: 'bg-amber-600 text-white',
        },
      });
    },
    onUnarchive: (postId: string) => {
      unarchivePost(postId);
    },
    onDeletePermanently: (postId: string) => {
      openModal({
        type: 'confirmation',
        data: {
          title: 'Delete Post Permanently',
          message: 'Are you sure you want to permanently delete this post? This action cannot be undone.',
          onConfirm: () => deletePostPermanently(postId),
          confirmText: 'Delete Permanently',
        },
      });
    },
    onEdit: (postId: string) => {
      navigateTo('editPost', { postId });
    },
    onViewMedia: (media, startIndex) => {
      openModal({ type: 'viewMedia', data: { media, startIndex } });
    },
    onViewDetails: (post: DisplayablePost) => {
      navigateTo('postDetail', { postId: post.id });
    },
    onShare: (postId: string) => {
      const post = findPostById(postId);
      if (post) openModal({ type: 'sharePost', data: post });
    },
    onReportItem: withAuthCheck((item) => {
      openModal({ type: 'reportItem', data: { item } });
    }),
    onSetPriceAlert: withAuthCheck((postId: string) => {
      const post = findPostById(postId);
      if (post) openModal({ type: 'setPriceAlert', data: post });
    }),
    onToggleAvailabilityAlert: withAuthCheck((postId: string) => {
       const existing = availabilityAlerts.find(a => a.postId === postId);
       if (existing) {
           deleteAvailabilityAlert(postId);
       } else {
           setAvailabilityAlert(postId);
       }
    }),
    onAddToBag: withAuthCheck((postId: string) => {
      const post = findPostById(postId);
      if (post) openModal({ type: 'addToBag', data: post });
    }),
    onViewBag: () => navigateTo('bag'),
    onContactStore: withAuthCheck((authorId: string, postId: string) => {
      const author = accountsById.get(authorId);
      const post = findPostById(postId);
      if (author && post) openModal({ type: 'contactStore', data: { author, post } });
    }),
    onRequestService: withAuthCheck((authorId: string, postId: string) => {
      const author = accountsById.get(authorId);
      const post = findPostById(postId);
      if (author && post) {
        openModal({ type: 'contactStore', data: { author, post, prefilledMessage: `Hi, I'm interested in your service: "${post.title}".` } });
      }
    }),
    onViewAccount: (accountId: string) => {
      const account = accountsById.get(accountId);
      if (account) navigateTo('account', { account });
    },
    onFilterByCategory: (category) => {
      if (mainView !== 'grid' || view !== 'all') {
        setMainView('grid');
        setView('all');
      }
      dispatchFilterAction({ type: 'SET_FILTER_CATEGORY', payload: category });
      if (mainContentRef.current) mainContentRef.current.scrollTop = 0;
    },
    onFilterByType: (type) => {
      if (mainView !== 'grid' || view !== 'all') {
        setMainView('grid');
        setView('all');
      }
      dispatchFilterAction({ type: 'SET_FILTER_TYPE', payload: type });
      if (mainContentRef.current) mainContentRef.current.scrollTop = 0;
    },
    onFilterByTag: (tag) => {
      if (mainView !== 'grid' || view !== 'all') {
        setMainView('grid');
        setView('all');
      }
      dispatchFilterAction({ type: 'SET_FILTER_TAGS', payload: [tag] });
      if (mainContentRef.current) mainContentRef.current.scrollTop = 0;
    },
    onShowOnMap: async (target: string | Account) => {
      // Save current state before navigating away, so 'back' works correctly.
      setHistory(h => [...h, { view, mainView, viewingPostId, viewingAccount, viewingForumPostId }]);

      if (typeof target === 'string') {
        // This is a post ID. Navigate to the map view.
        setView('all');
        setMainView('map');
        setPostToFocusOnMap(target);
      } else {
        // This is an account.
        const account = target as Account;
        let coords = account.coordinates;
        if (!coords && account.address) {
          setIsGeocoding(true);
          try {
            coords = await geocodeLocation(account.address);
          } catch (e) {
            addToast(e instanceof Error ? e.message : 'Failed to find location', 'error');
          } finally {
            if (isMountedRef.current) {
              setIsGeocoding(false);
            }
          }
        }

        if (coords) {
          setLocationToFocus({ coords, name: account.name });
          // Navigate to the map view
          setView('all');
          setMainView('map');
        } else {
          addToast(`Could not find location for ${account.name}.`, 'error');
        }
      }
    },
    onToggleLikeAccount: toggleLikeAccount,
    onTogglePinPost: togglePinPost,
    // Forum Actions
    onViewForumPost: (postId: string) => {
      navigateTo('forumPostDetail', { forumPostId: postId });
    },
    onCreateForumPost: withAuthCheck(() => {
      openModal({ type: 'createForumPost' });
    }),
  }), [
    toggleLikePost, openModal, archivePost, unarchivePost, deletePostPermanently, navigateTo, findPostById,
    withAuthCheck, accountsById, dispatchFilterAction, setPostToFocusOnMap,
    setLocationToFocus, toggleLikeAccount, togglePinPost, addToast, setIsGeocoding, availabilityAlerts, setAvailabilityAlert, deleteAvailabilityAlert,
    // State needed for history
    view, mainView, viewingPostId, viewingAccount, viewingForumPostId
  ]);

  const withConfirmationLoading = useCallback(async (action: () => void | Promise<void>) => {
    setIsConfirming(true);
    try {
        await action();
    } catch (error) {
        console.error('Confirmation action failed:', error);
        addToast(error instanceof Error ? error.message : 'An error occurred', 'error');
    } finally {
        if (isMountedRef.current) {
            setIsConfirming(false);
            closeModal();
        }
    }
  }, [addToast, closeModal]);

  const handleUpdateNotificationSettings = useCallback((newSettings: NotificationSettings) => {
      setNotificationSettings(newSettings);
      window.localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(newSettings));
      addToast('Settings saved!', 'success');
  }, [setNotificationSettings, addToast]);
  
  const handleNotificationClick = useCallback((notification: Notification) => {
      closeModal();
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
      
      if (notification.postId) {
          navigateTo('postDetail', { postId: notification.postId });
      } else if (notification.relatedAccountId) {
          const account = accountsById.get(notification.relatedAccountId);
          if (account) navigateTo('account', { account });
      } else if (notification.forumPostId) {
          navigateTo('forumPostDetail', { forumPostId: notification.forumPostId });
      }
  }, [closeModal, navigateTo, accountsById, setNotifications]);
  
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
          addToast(error instanceof Error ? error.message : 'Failed to find nearby posts', 'error');
      } finally {
          if (isMountedRef.current) {
            setIsFindingNearby(false);
          }
      }
  }, [isFindingNearby, allDisplayablePosts, addToast, closeModal, navigateTo]);
  
  const handleSaveSearch = useCallback((name: string) => {
      if (!currentAccount) return;
      const newSavedSearch: SavedSearch = {
          id: `saved-${Date.now()}`,
          name,
          filters: {
              searchQuery: filterState.searchQuery,
              filterType: filterState.filterType,
              filterCategory: filterState.filterCategory,
              sortOption: filterState.sortOption,
              minPrice: filterState.minPrice,
              maxPrice: filterState.maxPrice,
              filterTags: filterState.filterTags,
          },
          enableAlerts: false, // Default to false
      };
      addSavedSearch(newSavedSearch);
      addToast('Search saved!', 'success');
  }, [currentAccount, filterState, addSavedSearch, addToast]);
  
  const handleLoadSearch = useCallback((searchId: string) => {
      const search = savedSearches.find(s => s.id === searchId);
      if (search) {
          dispatchFilterAction({ type: 'SET_FILTERS_FROM_SAVED', payload: search.filters });
          closeModal();
          addToast(`Loaded search: ${search.name}`, 'success');
      }
  }, [savedSearches, dispatchFilterAction, closeModal, addToast]);
  
  const handleDeleteSearch = useCallback((searchId: string) => {
      deleteSavedSearch(searchId);
      addToast('Saved search deleted.', 'success');
  }, [deleteSavedSearch, addToast]);
  
  const handleArchiveCurrentAccountConfirm = useCallback(async () => {
      if (currentAccount) {
          toggleAccountStatus(currentAccount.id);
          performSignOut();
      }
  }, [currentAccount, toggleAccountStatus, performSignOut]);

  const handleUpgradeToSeller = useCallback(async (sellerData: Partial<Account>, tier: Subscription['tier']) => {
      if (currentAccount) {
          upgradeToSeller(currentAccount.id, sellerData, tier);
      }
  }, [currentAccount, upgradeToSeller]);

  const handleScroll = useCallback(() => {
    if (!mainContentRef.current) return;
    const { scrollTop } = mainContentRef.current;
    
    const currentScrollTop = Math.max(0, scrollTop);
    const lastScrollTop = lastScrollTopRef.current;
    const scrollDelta = currentScrollTop - lastScrollTop;
    
    // Only change state if user scrolled a significant amount to prevent jitter
    // Lowered threshold to 4 to catch smoother/slower scrolls
    if (Math.abs(scrollDelta) > 4) {
        if (scrollDelta > 0 && currentScrollTop > 60) {
             // Scrolling down and not at the very top
             if (isHeaderVisible) setIsHeaderVisible(false);
        } else if (scrollDelta < 0) {
             // Scrolling up
             if (!isHeaderVisible) setIsHeaderVisible(true);
        }
    }
    
    lastScrollTopRef.current = currentScrollTop;
    
    setIsScrolled(currentScrollTop > 10);

    if (hasNewPosts && currentScrollTop < 10) {
      setHasNewPosts(false);
      knownPostIdsRef.current = new Set(allDisplayablePosts.map(p => p.id));
    }
  }, [isHeaderVisible, hasNewPosts, allDisplayablePosts]);

  const [recommendedPostIds, setRecommendedPostIds] = useState<string[]>([]);

  useEffect(() => {
      if (isInitialLoading || isRefreshing) return;
      if (!currentAccount) {
          setRecommendedPostIds([]);
          return;
      }
      
      // We deliberately exclude likedPostIds and viewedPostIds from dependencies here.
      // We want recommendations to be calculated based on the snapshot of likes/views
      // at the time of load/refresh/login, NOT on every single interaction.
      // This keeps the list stable and prevents items from jumping around.
      const likedPosts = allDisplayablePosts.filter(p => likedPostIds.has(p.id));
      const viewedPosts = viewedPostIds
          .map(id => allDisplayablePosts.find(p => p.id === id))
          .filter((p): p is DisplayablePost => !!p);
      
      const newRecs = generateHistoryBasedRecommendations(likedPosts, viewedPosts, allDisplayablePosts);
      setRecommendedPostIds(newRecs.map(p => p.id));
      
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAccount?.id, isRefreshing, isInitialLoading]);

  const recommendations = useMemo(() => {
      if (recommendedPostIds.length === 0) return [];
      const postMap = new Map(allDisplayablePosts.map(p => [p.id, p]));
      return recommendedPostIds.map(id => postMap.get(id)).filter((p): p is DisplayablePost => !!p);
  }, [recommendedPostIds, allDisplayablePosts]);

  const sortedAndFilteredPosts = usePostFilters(allDisplayablePosts, allDisplayablePosts, userLocation, currentAccount);
  
  const showRecommendations = !isAnyFilterActive && recommendations.length > 0 && view === 'all' && mainView === 'grid';
  const recommendationIdsSet = useMemo(() => new Set(recommendedPostIds), [recommendedPostIds]);

  const postsForMainList = useMemo(() => {
    if (showRecommendations) {
        return sortedAndFilteredPosts.filter(p => !recommendationIdsSet.has(p.id));
    }
    return sortedAndFilteredPosts;
  }, [sortedAndFilteredPosts, showRecommendations, recommendationIdsSet]);

  const { displayedItems: paginatedPosts, hasMore, loadMore, isLoadingMore } = useInfiniteScroll(postsForMainList, isInitialLoading);
  const displayPosts = filterState.searchQuery ? postsForMainList : paginatedPosts;
  
  const likedPosts = useMemo(() => {
      return allDisplayablePosts.filter(p => likedPostIds.has(p.id));
  }, [allDisplayablePosts, likedPostIds]);

  const viewingPost = useMemo(() => {
    if (!viewingPostId) return null;
    return findPostById(viewingPostId);
  }, [viewingPostId, findPostById]);

  const handleCreatePostSubmit = (postData: Omit<Post, 'id' | 'isLiked' | 'authorId'>): Post => {
    const newPost = createPostInContext(postData, currentAccount!.id);
    return newPost;
  };
  
  const renderCurrentView = () => {
    switch (view) {
        case 'all':
            if (mainView === 'grid') {
                return (
                    <div className="p-4 sm:p-6 lg:p-8">
                        {showRecommendations && (
                            <div className="mb-8 animate-fade-in-up">
                                <PostList
                                    posts={recommendations}
                                    currentAccount={currentAccount}
                                    isLoading={false}
                                    variant={gridView}
                                    enableEntryAnimation={true}
                                />
                            </div>
                        )}
                        <PostList
                            posts={displayPosts}
                            currentAccount={currentAccount}
                            onLoadMore={loadMore}
                            hasMore={hasMore}
                            isLoadingMore={isLoadingMore}
                            isLoading={isInitialLoading}
                            isFiltering={isFiltering}
                            variant={gridView}
                            enableEntryAnimation={true}
                        />
                    </div>
                );
            }
            if (mainView === 'map') {
                return (
                    <MapView 
                        posts={displayPosts.filter(p => p.coordinates || p.eventCoordinates)}
                        userLocation={userLocation}
                        isLoading={isInitialLoading}
                        onFindNearby={() => openModal({ type: 'findNearby' })}
                        isFindingNearby={isFindingNearby}
                        postToFocusOnMap={postToFocusOnMap}
                        onPostFocusComplete={() => setPostToFocusOnMap(null)}
                        onViewPostDetails={(post) => navigateTo('postDetail', { postId: post.id })}
                        locationToFocus={locationToFocus}
                        onLocationFocusComplete={() => setLocationToFocus(null)}
                    />
                );
            }
            return null;
        case 'likes':
            return currentAccount ? <LikesView likedPosts={likedPosts} onViewAccount={postActions.onViewAccount} currentAccount={currentAccount} allAccounts={accounts} /> : null;
        case 'bag':
            return currentAccount ? <BagView onViewDetails={(post) => navigateTo('postDetail', { postId: post.id })} allAccounts={accounts} /> : null;
        case 'admin':
            return currentAccount?.role === 'admin' ? (
                <AdminPanel 
                    accounts={accounts}
                    allPosts={allDisplayablePosts}
                    currentAccount={currentAccount}
                    onDeleteAccount={(acc) => openModal({
                        type: 'confirmation',
                        data: {
                            title: 'Delete Account',
                            message: `Are you sure you want to permanently delete ${acc.name}'s account? This will remove all their data and cannot be undone.`,
                            onConfirm: () => deleteAccount(acc.id),
                            confirmText: 'Delete Account',
                            confirmClassName: 'bg-red-600 text-white',
                        }
                    })}
                    onUpdateAccountRole={updateAccountRole}
                    onEditAccount={(acc) => openModal({ type: 'editAccount', data: acc })}
                    onToggleAccountStatus={(acc) => toggleAccountStatus(acc.id)}
                    onApproveAccount={approveAccount}
                    onRejectAccount={(acc) => rejectAccount(acc.id)}
                    categories={categories}
                    onAddCategory={addCategory}
                    onUpdateCategory={updateCategory}
                    onDeleteCategory={deleteCategory}
                    onUpdateSubscription={updateSubscription}
                    reports={reports}
                    onReportAction={() => {}} // Placeholder
                    feedbackList={feedbackList}
                    onDeleteFeedback={handleDeleteFeedback}
                    onToggleFeedbackArchive={handleToggleFeedbackArchive}
                    onMarkFeedbackAsRead={handleMarkFeedbackAsRead}
                    onBulkFeedbackAction={handleBulkFeedbackAction}
                    onViewPost={(post) => navigateTo('postDetail', { postId: post.id })}
                    onEditPost={(postId) => navigateTo('editPost', { postId })}
                    onDeletePost={(postId) => openModal({
                        type: 'confirmation',
                        data: {
                            title: 'Delete Post Permanently',
                            message: 'Are you sure you want to permanently delete this post? This action cannot be undone.',
                            onConfirm: () => deletePostPermanently(postId),
                            confirmText: 'Delete Permanently',
                            confirmClassName: 'bg-red-600 text-white',
                        }
                    })}
                    termsContent={termsContent}
                    onUpdateTerms={setTermsContent}
                    privacyContent={privacyContent}
                    onUpdatePrivacy={setPrivacyContent}
                    initialView={adminInitialView}
                    forumPosts={forumPosts}
                    getPostWithComments={getPostWithComments}
                    onViewForumPost={(postId) => navigateTo('forumPostDetail', { forumPostId: postId })}
                    forumCategories={forumCategories}
                    onAddForumCategory={addForumCategory}
                    onUpdateForumCategory={updateForumCategory}
                    onDeleteForumCategory={deleteForumCategory}
                    priceUnits={priceUnits}
                    onAddPriceUnit={addPriceUnit}
                    onUpdatePriceUnit={updatePriceUnit}
                    onDeletePriceUnit={deletePriceUnit}
                />
            ) : null;
        case 'account':
            return viewingAccount ? (
                <AccountView 
                    account={viewingAccount}
                    currentAccount={currentAccount}
                    posts={allDisplayablePosts}
                    onEditAccount={() => openModal({ type: 'editAccount', data: viewingAccount })}
                    archivedPosts={archivedPosts}
                    allAccounts={accounts}
                    isLiked={currentAccount?.likedAccountIds?.includes(viewingAccount.id) ?? false}
                    onToggleLike={postActions.onToggleLikeAccount!}
                    onShowOnMap={postActions.onShowOnMap}
                    isGeocoding={isGeocoding}
                    onOpenAnalytics={() => navigateTo('accountAnalytics', { account: viewingAccount })}
                />
            ) : null;
        case 'postDetail':
            return viewingPost ? <PostDetailView post={viewingPost} onBack={handleBack} currentAccount={currentAccount} /> : null;
        case 'forum':
            return <ForumView />;
        case 'forumPostDetail':
            return viewingForumPostId ? <ForumPostDetailView postId={viewingForumPostId} onBack={handleBack} /> : null;
        case 'createPost':
            return currentAccount ? <CreatePostPage onBack={handleBack} onSubmitPost={handleCreatePostSubmit} onNavigateToPost={(id) => navigateTo('postDetail', { postId: id })} currentAccount={currentAccount} categories={categories} onUpdateCurrentAccountDetails={(data) => updateAccountDetails({ ...currentAccount, ...data })} /> : null;
        case 'editPost':
            return currentAccount && viewingPost ? <CreatePostPage onBack={handleBack} onSubmitPost={handleCreatePostSubmit} onUpdatePost={updatePostInContext} onNavigateToPost={(id) => navigateTo('postDetail', { postId: id })} editingPost={viewingPost} currentAccount={currentAccount} categories={categories} /> : null;
        case 'nearbyPosts':
            return nearbyPostsResult && currentAccount ? <NearbyPostsView result={nearbyPostsResult} currentAccount={currentAccount} /> : null;
        case 'accountAnalytics':
            return viewingAccount ? <AccountAnalyticsView account={viewingAccount} accountPosts={allDisplayablePosts.filter(p => p.authorId === viewingAccount.id)} allCategories={categories} allAccounts={accounts} /> : null;
        case 'subscription':
            return currentAccount ? <SubscriptionPage currentAccount={currentAccount} onUpdateSubscription={(tier) => updateSubscription(currentAccount.id, tier)} openModal={openModal} /> : null;
        default:
            return null;
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
          onClearRecentSearches={() => setRecentSearches([])}
          isAiSearchEnabled={filterState.isAiSearchEnabled}
          onToggleAiSearch={handleToggleAiSearch}
          isAiSearching={filterState.isAiSearching}
          onAiSearchSubmit={handleAiSearchSubmitWithHistory}
          mainView={mainView}
          onMainViewChange={handleMainViewChange}
          gridView={gridView}
          onGridViewChange={setGridView}
          onGoHome={() => { 
            setView('all'); 
            setMainView('grid'); 
            setHistory([]); 
            onClearFilters(); 
            handleRefresh(); 
            if (mainContentRef.current) {
                mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          onRefresh={handleRefresh}
          currentView={view}
          onViewChange={(newView) => navigateTo(newView)}
          bagCount={bag.length}
          unreadNotificationsCount={notifications.filter(n => !n.isRead).length}
          currentAccount={currentAccount}
          onOpenAccount={() => navigateTo('account', { account: currentAccount! })}
          onOpenSubscriptionPage={() => navigateTo('subscription')}
          onOpenNotificationsModal={() => openModal({ type: 'notifications' })}
          onOpenCreateModal={() => navigateTo('createPost')}
          onOpenLoginModal={() => openModal({ type: 'login' })}
          onOpenSettingsModal={() => openModal({ type: 'settings' })}
          onOpenCreateAccountModal={() => openModal({ type: 'createAccount' })}
          viewingAccount={viewingAccount}
          onClearFilters={onClearFilters}
          isAnyFilterActive={isAnyFilterActive}
          onOpenFilterPanel={() => openModal({ type: 'filterPanel' })}
          isScrolled={isScrolled}
          isVisible={isHeaderVisible}
          onBack={(view === 'all' && isAnyFilterActive) || history.length > 0 ? handleBack : undefined}
        />

        <main 
          ref={mainContentRef}
          onScroll={handleScroll}
          className={cn(
            "relative flex-1 overflow-y-auto bg-gray-50 pt-16", // Added padding top to compensate for fixed header
            isInitialLoading && "overflow-hidden",
            isPulling && "overflow-hidden" // Prevents scrolling while pulling
          )}
        >
          {view === 'all' && mainView === 'grid' ? (
            <>
              <PullToRefreshIndicator pullPosition={pullPosition} isRefreshing={isRefreshing} pullThreshold={pullThreshold} />
              <div
                style={{ transform: `translateY(${isRefreshing ? pullThreshold : pullPosition}px)` }}
                className={!isPulling ? 'transition-transform duration-300' : ''}
              >
                <ErrorBoundary>
                  {hasNewPosts && <NewPostsIndicator onClick={handleShowNewPosts} />}
                  {renderCurrentView()}
                </ErrorBoundary>
              </div>
            </>
          ) : (
             <ErrorBoundary>
              {renderCurrentView()}
            </ErrorBoundary>
          )}
        </main>
        
        <OfflineIndicator />

        {!currentAccount && (view === 'all' || view === 'postDetail' || view === 'account') && (
          <GuestPrompt
            onSignIn={() => openModal({ type: 'login' })}
            onCreateAccount={() => openModal({ type: 'createAccount' })}
          />
        )}
        
        <AppModals
            activeModal={activeModal}
            closeModal={closeModal}
            openModal={openModal}
            currentAccount={currentAccount}
            accounts={accounts}
            posts={allDisplayablePosts}
            archivedPosts={archivedPosts}
            categories={categories}
            bag={bag}
            priceAlerts={priceAlerts}
            availabilityAlerts={availabilityAlerts}
            userNotifications={notifications}
            notificationSettings={notificationSettings}
            savedSearches={savedSearches}
            termsContent={termsContent}
            privacyContent={privacyContent}
            isConfirming={isConfirming}
            isFindingNearby={isFindingNearby}
            userLocation={userLocation}
            isSearchResult={!!filterState.aiSmartFilterResults}
            handleLogin={(acc, rem) => { login(acc, rem); closeModal(); }}
            handleSocialLogin={socialLogin}
            handleUpdateAccount={(acc) => withConfirmationLoading(() => updateAccount(acc))}
            handleUpgradeToSeller={(data, tier) => withConfirmationLoading(() => upgradeToSeller(currentAccount!.id, data, tier))}
            handleUpdateCurrentAccountDetails={(data) => updateAccountDetails({ ...currentAccount!, ...data })}
            handleReportSubmit={handleReportSubmit}
            handleForumReportSubmit={handleForumReportSubmit}
            handleSetPriceAlert={setPriceAlert}
            handleAddToBag={addToBag}
            handleRemoveBagItem={removeBagItem}
            handleCreateAccount={(data, isSeller, refCode) => withConfirmationLoading(() => createAccount(data, isSeller, refCode).then(() => {}))}
            handleUpdateNotificationSettings={handleUpdateNotificationSettings}
            handleNotificationClick={handleNotificationClick}
            setNotifications={setNotifications}
            deletePriceAlert={deletePriceAlert}
            deleteAvailabilityAlert={deleteAvailabilityAlert}
            handleFindNearby={handleFindNearby}
            handleSaveSearch={handleSaveSearch}
            handleLoadSearch={handleLoadSearch}
            handleDeleteSearch={handleDeleteSearch}
            withConfirmationLoading={withConfirmationLoading}
            handleArchiveCurrentAccountConfirm={() => withConfirmationLoading(handleArchiveCurrentAccountConfirm)}
            handleCreateForumPost={(postData) => { addForumPost(postData); closeModal(); }}
            handleFeedbackSubmit={handleFeedbackSubmit}
            addCatalogItems={addCatalogItems}
            removeCatalogItem={removeCatalogItem}
            onClearFilters={onClearFilters}
            onSignOut={requestSignOut}
        />
      </div>
    </PostActionsContext.Provider>
  );
};
