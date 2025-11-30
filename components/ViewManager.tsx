import React, { Suspense, useEffect, useMemo, useState, useCallback } from 'react';
import { DisplayablePost, NotificationSettings, Notification, Account, AppView, Post, PostType } from '../types';
import { PostList } from './PostList';
import { useUI } from '../contexts/UIContext';
import { useFilters } from '../contexts/FiltersContext';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../contexts/PostsContext';
import { useForum } from '../contexts/ForumContext';
import { useActivity } from '../contexts/ActivityContext';
import { usePostFilters } from '../hooks/usePostFilters';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { PostDetailView } from './PostDetailView';
import { ForumsPostDetailView } from './ForumsPostDetailView';
import { CreatePostPage } from './CreatePostPage';
import { SubscriptionPage } from './SubscriptionPage';
import { generateHistoryBasedRecommendations } from '../utils/posts';
import { SettingsPage } from './SettingsPage';
import { ActivityPage } from './ActivityPage';
import { useConfirmationModal } from '../hooks/useConfirmationModal';
import { useNavigation } from '../App';
import { usePersistentState } from '../hooks/usePersistentState';
import { LoadingFallback } from './ui/LoadingFallback';

const MapView = React.lazy(() => import('./MapView').then(module => ({ default: module.MapView })));
const AdminPanel = React.lazy(() => import('./AdminPanel').then(module => ({ default: module.AdminPanel })));
const AccountView = React.lazy(() => import('./AccountView').then(module => ({ default: module.AccountView })));
const LikesView = React.lazy(() => import('./LikesView').then(module => ({ default: module.LikesView })));
const BagView = React.lazy(() => import('./BagView').then(module => ({ default: module.BagView })));
const AccountAnalyticsView = React.lazy(() => import('./AccountAnalyticsView').then(module => ({ default: module.AccountAnalyticsView })));
const NearbyPostsView = React.lazy(() => import('./NearbyPostsView').then(module => ({ default: module.NearbyPostsView })));
const ForumsView = React.lazy(() => import('./ForumsView').then(module => ({ default: module.ForumsView })));

const NOTIFICATION_SETTINGS_KEY = 'localeAppNotifSettings';

interface ViewManagerProps {
  view: AppView;
  mainView: 'grid' | 'map';
  gridView: 'default' | 'compact';
  isInitialLoading: boolean;
  isFiltering: boolean;
  userLocation: { lat: number; lng: number } | null;
  postToFocusOnMap: string | null;
  onPostFocusComplete: () => void;
  locationToFocus: { coords: { lat: number; lng: number }; name: string } | null;
  onLocationFocusComplete: () => void;
  viewingAccount: Account | null;
  viewingPostId: string | null;
  viewingForumPostId: string | null;
  nearbyPostsResult: { posts: DisplayablePost[]; locationName: string | null } | null;
  adminInitialView?: any;
  isGeocoding: boolean;
}

export const ViewManager: React.FC<ViewManagerProps> = ({
  view, mainView, gridView, isInitialLoading, isFiltering, userLocation, postToFocusOnMap, onPostFocusComplete, 
  locationToFocus, onLocationFocusComplete, viewingAccount, viewingPostId, viewingForumPostId, nearbyPostsResult, 
  adminInitialView, isGeocoding
}) => {
    const { 
        // FIX: Destructure additional functions needed for child components
        currentAccount, accounts, likedPostIds, viewedPostIds, updateSubscription, signOut, toggleAccountStatus, updateAccountDetails
    } = useAuth();
    const { 
        notifications, priceAlerts, availabilityAlerts, markAsRead, deletePriceAlert, deleteAvailabilityAlert
    } = useActivity();
    const { 
        // FIX: Destructure additional functions and data needed for child components
        posts: allDisplayablePosts, findPostById, createPost, updatePost, categories
    } = usePosts();
    const { openModal } = useUI();
    const { filterState, isAnyFilterActive } = useFilters();
    const { navigateTo, handleBack } = useNavigation();
    const showConfirmation = useConfirmationModal();

    const [notificationSettings, setNotificationSettings] = usePersistentState<NotificationSettings>(NOTIFICATION_SETTINGS_KEY, { expiryAlertsEnabled: true, expiryThresholdDays: 3 });

    const handleUpdateNotificationSettings = (newSettings: NotificationSettings) => {
        setNotificationSettings(newSettings);
    };

    // FIX: Implement sign-out and archive account handlers with confirmation modals
    const handleSignOut = useCallback(() => {
        showConfirmation({
            title: 'Sign Out',
            message: 'Are you sure you want to sign out?',
            onConfirm: signOut,
            confirmText: 'Sign Out',
            confirmClassName: 'bg-red-600 text-white',
        });
    }, [showConfirmation, signOut]);

    const handleArchiveAccount = useCallback(() => {
        if (!currentAccount) return;
        showConfirmation({
            title: 'Archive Account',
            message: 'Are you sure you want to temporarily deactivate your account? You can reactivate by signing in again.',
            onConfirm: () => {
                toggleAccountStatus(currentAccount.id, false);
                signOut();
            },
            confirmText: 'Archive',
            confirmClassName: 'bg-amber-600 text-white'
        });
    }, [currentAccount, showConfirmation, signOut, toggleAccountStatus]);
    
    const handleNotificationClick = (notification: Notification) => {
        markAsRead(notification.id);
        
        if (notification.postId) {
            navigateTo('postDetail', { postId: notification.postId });
        } else if (notification.relatedAccountId) {
            const account = accounts.find(a => a.id === notification.relatedAccountId);
            if (account) navigateTo('account', { account });
        } else if (notification.forumPostId) {
            navigateTo('forumPostDetail', { forumPostId: notification.forumPostId });
        }
    };
    
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
    
    const sortedAndFilteredPosts = usePostFilters(allDisplayablePosts, allDisplayablePosts, userLocation, currentAccount);
    const showRecommendations = !isAnyFilterActive && recommendations.length > 0 && view === 'all' && mainView === 'grid';
    const recommendationIdsSet = useMemo(() => new Set(recommendedPostIds), [recommendedPostIds]);
    const postsForMainList = useMemo(() => showRecommendations ? sortedAndFilteredPosts.filter(p => !recommendationIdsSet.has(p.id)) : sortedAndFilteredPosts, [sortedAndFilteredPosts, showRecommendations, recommendationIdsSet]);
    const { displayedItems: paginatedPosts, hasMore, loadMore, isLoadingMore } = useInfiniteScroll(postsForMainList, isInitialLoading);
    const displayPosts = filterState.searchQuery ? postsForMainList : paginatedPosts;
    const likedPosts = useMemo(() => allDisplayablePosts.filter(p => likedPostIds.has(p.id)), [allDisplayablePosts, likedPostIds]);
    const viewingPost = useMemo(() => viewingPostId ? findPostById(viewingPostId) : null, [viewingPostId, findPostById]);
    
    switch (view) {
        case 'all':
            if (mainView === 'grid') return <div className="p-4 sm:p-6 lg:p-8">{showRecommendations && <div className="mb-8 animate-fade-in-up"><PostList posts={recommendations} currentAccount={currentAccount} isLoading={false} variant={gridView} enableEntryAnimation={true} /></div>}<PostList posts={displayPosts} currentAccount={currentAccount} onLoadMore={loadMore} hasMore={hasMore} isLoadingMore={isLoadingMore} isLoading={isInitialLoading} isFiltering={isFiltering} variant={gridView} enableEntryAnimation={true} /></div>;
            if (mainView === 'map') return <Suspense fallback={<LoadingFallback/>}><MapView posts={displayPosts.filter(p => p.coordinates || p.eventCoordinates)} userLocation={userLocation} isLoading={isInitialLoading} onFindNearby={() => openModal({ type: 'findNearby' })} isFindingNearby={isFiltering} postToFocusOnMap={postToFocusOnMap} onPostFocusComplete={onPostFocusComplete} onViewPostDetails={(post) => navigateTo('postDetail', { postId: post.id })} locationToFocus={locationToFocus} onLocationFocusComplete={onLocationFocusComplete} /></Suspense>;
            return null;
        case 'likes': return currentAccount ? <Suspense fallback={<LoadingFallback/>}><LikesView likedPosts={likedPosts} currentAccount={currentAccount} allAccounts={accounts} /></Suspense> : null;
        case 'bag': return currentAccount ? <Suspense fallback={<LoadingFallback/>}><BagView allAccounts={accounts} onViewDetails={(post) => navigateTo('postDetail', { postId: post.id })} /></Suspense> : null;
        case 'admin':
            return currentAccount?.role === 'admin' ? <Suspense fallback={<LoadingFallback/>}><AdminPanel initialView={adminInitialView} /></Suspense> : null;
        case 'account': return viewingAccount ? <Suspense fallback={<LoadingFallback/>}><AccountView account={viewingAccount} currentAccount={currentAccount} posts={allDisplayablePosts} archivedPosts={[]} allAccounts={accounts} isGeocoding={isGeocoding} /></Suspense> : null;
        case 'postDetail': return viewingPost ? <PostDetailView post={viewingPost} onBack={handleBack} currentAccount={currentAccount} /> : null;
        case 'forums': return <Suspense fallback={<LoadingFallback/>}><ForumsView /></Suspense>;
        case 'forumPostDetail': return viewingForumPostId ? <ForumsPostDetailView postId={viewingForumPostId} onBack={handleBack} /> : null;
        case 'createPost':
            if (currentAccount?.subscription.tier === 'Personal') { return null; }
            // FIX: Pass missing required props to CreatePostPage
            return currentAccount ? <CreatePostPage onBack={handleBack} currentAccount={currentAccount} onSubmitPost={(postData) => createPost(postData, currentAccount.id)} onNavigateToPost={(postId) => navigateTo('postDetail', { postId })} categories={categories} onUpdateCurrentAccountDetails={(details) => updateAccountDetails({ ...currentAccount, ...details })} /> : null;
        case 'editPost': return currentAccount && viewingPost ? <CreatePostPage onBack={handleBack} editingPost={viewingPost} currentAccount={currentAccount} onSubmitPost={(postData) => createPost(postData, currentAccount.id)} onUpdatePost={updatePost} onNavigateToPost={(postId) => navigateTo('postDetail', { postId })} categories={categories} /> : null;
        case 'nearbyPosts': return nearbyPostsResult && currentAccount ? <Suspense fallback={<LoadingFallback/>}><NearbyPostsView result={nearbyPostsResult} currentAccount={currentAccount} /></Suspense> : null;
        case 'accountAnalytics': return viewingAccount ? <Suspense fallback={<LoadingFallback/>}><AccountAnalyticsView account={viewingAccount} accountPosts={allDisplayablePosts.filter(p => p.authorId === viewingAccount.id)} allCategories={[]} allAccounts={accounts} /></Suspense> : null;
        case 'subscription': return currentAccount ? <SubscriptionPage currentAccount={currentAccount} onUpdateSubscription={updateSubscription} openModal={openModal} /> : null;
        case 'settings':
            return currentAccount ? <SettingsPage
                settings={notificationSettings}
                onSettingsChange={handleUpdateNotificationSettings}
                currentAccount={currentAccount}
                onArchiveAccount={handleArchiveAccount}
                onSignOut={handleSignOut}
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
