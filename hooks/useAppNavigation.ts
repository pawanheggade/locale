import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Account, ActivityTab, AdminView, AppView, DisplayablePost, FiltersState, PostType } from '../types';
import { useUI } from '../contexts/UIContext';
import { useFilters } from '../contexts/FiltersContext';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../contexts/PostsContext';
import { usePersistentState } from './usePersistentState';
import { useIsMounted } from './useIsMounted';
import { reverseGeocode, haversineDistance } from '../utils/geocoding';
import { STORAGE_KEYS } from '../lib/constants';
import { useLoading } from '../contexts/LoadingContext';

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
  'subscription', 'activity', 'editProfile', 'manageCatalog', 'createForumPost', 'settings', 'studio'
];

interface UseAppNavigationProps {
    mainContentRef: React.RefObject<HTMLDivElement>;
}

export const useAppNavigation = ({ mainContentRef }: UseAppNavigationProps) => {
    const { currentAccount, accountsById, incrementProfileViews } = useAuth();
    const { posts, findPostById, refreshPosts } = usePosts();
    const { openModal, closeModal, addToast } = useUI();
    const isMounted = useIsMounted();
    const { filterState, dispatchFilterAction, onClearFilters, isAnyFilterActive } = useFilters();
    const { startLoading, stopLoading, isLoadingTask } = useLoading();

    const [view, setView] = useState<AppView>('all');
    const [mainView, setMainView] = useState<'grid' | 'map'>('grid');
    const [viewingPostId, setViewingPostId] = useState<string | null>(null);
    const [viewingForumPostId, setViewingForumPostId] = useState<string | null>(null);
    const [editingAdminPageKey, setEditingAdminPageKey] = useState<'terms' | 'privacy' | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
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

    const isRefreshing = isLoadingTask('refreshing');
    const isFindingNearby = isLoadingTask('findingNearby');

    useEffect(() => {
        if (viewingAccount && accountsById.has(viewingAccount.id)) {
            const freshAccount = accountsById.get(viewingAccount.id);
            if (freshAccount && JSON.stringify(freshAccount) !== JSON.stringify(viewingAccount)) {
                setViewingAccount(freshAccount);
            }
        }
    }, [accountsById, viewingAccount]);

    const handleSearchSubmit = (query: string) => {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) return;
        setRecentSearches(prev => [trimmedQuery, ...prev.filter(s => s.toLowerCase() !== trimmedQuery.toLowerCase())].slice(0, 7));
        dispatchFilterAction({ type: 'SET_SEARCH_QUERY', payload: trimmedQuery });
    };

    const handleRemoveRecentSearch = (query: string) => {
        setRecentSearches(prev => prev.filter(s => s !== query));
    };

    const handleClearRecentSearches = () => {
        setRecentSearches([]);
    };

    const pushHistoryState = useCallback(() => {
        const currentScrollPosition = mainContentRef.current ? mainContentRef.current.scrollTop : 0;
        setHistory(h => [...h, {
            view, mainView, viewingPostId, viewingAccount, viewingForumPostId, editingAdminPageKey,
            scrollPosition: currentScrollPosition, filters: filterState,
        }]);
    }, [view, mainView, viewingPostId, viewingAccount, viewingForumPostId, editingAdminPageKey, filterState, mainContentRef]);

    const navigateTo = useCallback((
        newView: AppView,
        options: { postId?: string; account?: Account, forumPostId?: string, pageKey?: 'terms' | 'privacy', activityTab?: ActivityTab, adminView?: AdminView } = {}
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
            if (!currentAccount || !options.account || options.account.id !== currentAccount.id) return;
            const isPaidTier = ['Verified', 'Business', 'Organisation'].includes(currentAccount.subscription.tier);
            if (!isPaidTier) navigateTo('subscription');
        }

        if (newView === 'account' && options.account) {
            incrementProfileViews(options.account.id);
        }

        if (newView === 'activity' && options.activityTab) {
            setActivityInitialTab(options.activityTab);
        } else {
            setActivityInitialTab('notifications');
        }

        if (newView === 'admin' && options.adminView) {
            setAdminInitialView(options.adminView);
        } else if (newView !== 'admin') {
            setAdminInitialView(undefined);
        }

        pushHistoryState();

        setView(newView);
        setViewingPostId(options.postId || null);
        setViewingAccount(options.account || null);
        setViewingForumPostId(options.forumPostId || null);
        setEditingAdminPageKey(options.pageKey || null);

        if (mainContentRef.current) mainContentRef.current.scrollTop = 0;
    }, [view, viewingPostId, viewingAccount, viewingForumPostId, editingAdminPageKey, currentAccount, incrementProfileViews, pushHistoryState, openModal, mainContentRef]);

    const navigateToAccount = useCallback((accountId: string) => {
        const account = accountsById.get(accountId);
        if (account) navigateTo('account', { account });
    }, [accountsById, navigateTo]);

    const handleRefresh = useCallback(async () => {
        if (isRefreshing) return;
        startLoading('refreshing');
        if (view === 'all') refreshPosts();
        setTimeout(() => { 
            stopLoading('refreshing');
        }, 800);
    }, [isRefreshing, startLoading, stopLoading, view, refreshPosts]);

    const handleBack = useCallback(() => {
        const lastHistoryItem = history.at(-1);
        if (lastHistoryItem) {
            if (lastHistoryItem.filters) dispatchFilterAction({ type: 'SET_ALL_FILTERS', payload: lastHistoryItem.filters });
            setView(lastHistoryItem.view);
            setMainView(lastHistoryItem.mainView);
            setViewingPostId(lastHistoryItem.viewingPostId);
            setViewingAccount(lastHistoryItem.viewingAccount);
            setViewingForumPostId(lastHistoryItem.viewingForumPostId);
            setEditingAdminPageKey(lastHistoryItem.editingAdminPageKey);
            setHistory(h => h.slice(0, -1));

            setTimeout(() => {
                if (mainContentRef.current) mainContentRef.current.scrollTop = lastHistoryItem.scrollPosition;
            }, 50);
        } else if (view !== 'all') {
            navigateTo('all');
        }
    }, [history, navigateTo, view, dispatchFilterAction, mainContentRef]);

    const showBackButton = ((view !== 'all' || mainView !== 'grid') && history.length > 0) || (view === 'all' && mainView === 'grid' && isAnyFilterActive);

    const backAction = useCallback(() => {
        if (view === 'all' && mainView === 'grid' && isAnyFilterActive) {
            onClearFilters();
        } else {
            handleBack();
        }
    }, [view, mainView, isAnyFilterActive, onClearFilters, handleBack]);

    const handleGoHome = useCallback(() => {
        onClearFilters();
        if (mainView === 'map') setMainView('grid');
        setHistory([]);
        setView('all');
        setViewingPostId(null);
        setViewingAccount(null);
        setViewingForumPostId(null);
        setEditingAdminPageKey(null);
        if (mainContentRef.current) mainContentRef.current.scrollTop = 0;
        handleRefresh();
    }, [onClearFilters, mainView, handleRefresh, mainContentRef]);

    useEffect(() => {
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
        setViewingAccount(null);
        setViewingForumPostId(null);
        setEditingAdminPageKey(null);
        setNearbyPostsResult(null);
        setView('all');
        setMainView('map');
    }, [findPostById, addToast, pushHistoryState]);

    const handleFindNearby = useCallback(async (coords: { lat: number, lng: number }) => {
        startLoading('findingNearby');
        closeModal();
        try {
            const locationName = await reverseGeocode(coords.lat, coords.lng);
            const nearby = posts
                .filter(post => {
                    const postCoords = post.coordinates || post.eventCoordinates;
                    if (!postCoords) return false;
                    return haversineDistance(coords, postCoords) <= 50;
                })
                .map(post => ({ ...post, distance: haversineDistance(coords, post.coordinates || post.eventCoordinates!) }));

            nearby.sort((a, b) => a.distance! - b.distance!);

            setNearbyPostsResult({ posts: nearby, locationName });
            navigateTo('nearbyPosts');
        } catch (error) {
            console.error(error);
            addToast("Could not find nearby posts.", "error");
        } finally {
            stopLoading('findingNearby');
        }
    }, [posts, closeModal, navigateTo, startLoading, stopLoading, addToast]);

    const handleEnableLocation = async () => {
        if (!navigator.geolocation) {
            addToast("Geolocation is not supported by your browser.", "error");
            return;
        }
        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
            });
            setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        } catch (error: any) {
            addToast(error.code === error.PERMISSION_DENIED ? "Location access denied." : "Could not get your location.", "error");
            throw error;
        }
    };

    const onPostFocusComplete = useCallback(() => setPostToFocusOnMap(null), []);
    const onLocationFocusComplete = useCallback(() => setLocationToFocus(null), []);

    const handleScroll = useCallback(() => {
        if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
        rafRef.current = window.requestAnimationFrame(() => {
            if (!mainContentRef.current) return;
            const currentScrollTop = mainContentRef.current.scrollTop;
            setIsScrolled(currentScrollTop > 0);
            if (currentScrollTop > lastScrollTopRef.current && currentScrollTop > 80) setIsHeaderVisible(false);
            else if (currentScrollTop < lastScrollTopRef.current) setIsHeaderVisible(true);
            lastScrollTopRef.current = currentScrollTop <= 0 ? 0 : currentScrollTop;
        });
    }, [mainContentRef]);

    useEffect(() => {
        const raf = rafRef.current;
        return () => { if (raf) window.cancelAnimationFrame(raf); };
    }, []);

    const navigationContextValue = useMemo(() => ({
        navigateTo, navigateToAccount, handleBack, showOnMap, saveHistoryState: pushHistoryState,
        viewingAccount, viewingPostId, viewingForumPostId, editingAdminPageKey, activityInitialTab, adminInitialView,
        nearbyPostsResult, userLocation, isFindingNearby, postToFocusOnMap, onPostFocusComplete, locationToFocus, onLocationFocusComplete,
        handleFindNearby, handleEnableLocation, recentSearches, handleSearchSubmit, handleRemoveRecentSearch, handleClearRecentSearches, handleGoHome, handleMainViewChange,
    }), [
        navigateTo, navigateToAccount, handleBack, showOnMap, pushHistoryState, viewingAccount, viewingPostId, viewingForumPostId,
        editingAdminPageKey, activityInitialTab, adminInitialView, nearbyPostsResult, userLocation, isFindingNearby,
        postToFocusOnMap, onPostFocusComplete, locationToFocus, onLocationFocusComplete, handleFindNearby, handleEnableLocation,
        recentSearches, handleSearchSubmit, handleRemoveRecentSearch, handleClearRecentSearches, handleGoHome, handleMainViewChange,
    ]);

    return {
        navigationContextValue,
        isRefreshing,
        handleRefresh,
        isHeaderVisible,
        isScrolled,
        handleScroll,
        view,
        mainView,
        showBackButton,
        backAction,
    };
};