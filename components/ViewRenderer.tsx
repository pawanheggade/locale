import React, { Suspense } from 'react';
import { AppView, Account, ActivityTab } from '../types';
import { LoadingFallback } from './ui/LoadingFallback';

// Lazy loaded components to reduce initial bundle size
const MapView = React.lazy(() => import('./MapView').then(module => ({ default: module.MapView })));
const PostList = React.lazy(() => import('./PostList').then(module => ({ default: module.PostList })));
const AdminPanel = React.lazy(() => import('./AdminPanel').then(module => ({ default: module.AdminPanel })));
const AccountView = React.lazy(() => import('./AccountView').then(module => ({ default: module.AccountView })));
const LikesView = React.lazy(() => import('./LikesView').then(module => ({ default: module.LikesView })));
const BagView = React.lazy(() => import('./BagView').then(module => ({ default: module.BagView })));
const AccountAnalyticsView = React.lazy(() => import('./AccountAnalyticsView').then(module => ({ default: module.AccountAnalyticsView })));
const NearbyPostsView = React.lazy(() => import('./NearbyPostsView').then(module => ({ default: module.NearbyPostsView })));
const ForumsView = React.lazy(() => import('./ForumsView').then(module => ({ default: module.ForumsView })));
const ForumsPostDetailView = React.lazy(() => import('./ForumsPostDetailView').then(module => ({ default: module.ForumsPostDetailView })));
const CreatePostPage = React.lazy(() => import('./CreatePostPage').then(module => ({ default: module.CreatePostPage })));
const SubscriptionPage = React.lazy(() => import('./SubscriptionPage').then(module => ({ default: module.SubscriptionPage })));
const ActivityPage = React.lazy(() => import('./ActivityPage').then(module => ({ default: module.ActivityPage })));
const EditPageView = React.lazy(() => import('./EditPageView').then(module => ({ default: module.EditPageView })));
const EditProfilePage = React.lazy(() => import('./EditProfilePage').then(module => ({ default: module.EditProfilePage })));
const ManageCatalogPage = React.lazy(() => import('./ManageCatalogPage').then(module => ({ default: module.ManageCatalogPage })));
const CreateForumPostPage = React.lazy(() => import('./CreateForumPostPage').then(module => ({ default: module.CreateForumPostPage })));

interface ViewRendererProps {
  view: AppView;
  mainView: 'grid' | 'map';
  isInitialLoading: boolean;
  userLocation: { lat: number; lng: number } | null;
  isFindingNearby: boolean;
  postToFocusOnMap: string | null;
  onPostFocusComplete: () => void;
  locationToFocus: { coords: { lat: number; lng: number }; name: string } | null;
  onLocationFocusComplete: () => void;
  adminInitialView: any;
  nearbyPostsResult: { posts: any[]; locationName: string | null } | null;
  viewingAccount: Account | null;
  viewingPostId: string | null;
  viewingForumPostId: string | null;
  editingAdminPageKey: 'terms' | 'privacy' | null;
  activityInitialTab: ActivityTab;
}

export const ViewRenderer: React.FC<ViewRendererProps> = (props) => {
  const { 
      view, mainView, isInitialLoading, userLocation, isFindingNearby,
      postToFocusOnMap, onPostFocusComplete, locationToFocus, onLocationFocusComplete,
      adminInitialView, nearbyPostsResult, viewingAccount, viewingPostId, viewingForumPostId,
      editingAdminPageKey, activityInitialTab
  } = props;
    
  switch (view) {
      case 'all':
        return mainView === 'grid' ? (
          <Suspense fallback={<LoadingFallback />}>
            <PostList />
          </Suspense>
        ) : (
          <Suspense fallback={<LoadingFallback />}>
            <MapView 
              userLocation={userLocation} 
              isLoading={isInitialLoading}
              isFindingNearby={isFindingNearby}
              postToFocusOnMap={postToFocusOnMap}
              onPostFocusComplete={onPostFocusComplete}
              locationToFocus={locationToFocus}
              onLocationFocusComplete={onLocationFocusComplete}
            />
          </Suspense>
        );
      case 'likes':
        return <Suspense fallback={<LoadingFallback />}><LikesView /></Suspense>;
      case 'bag':
        return <Suspense fallback={<LoadingFallback />}><BagView /></Suspense>;
      case 'admin':
        return <Suspense fallback={<LoadingFallback />}><AdminPanel initialView={adminInitialView} /></Suspense>;
      case 'account':
        if (!viewingAccount) return <div className="p-8 text-center">Account not found.</div>;
        return <Suspense fallback={<LoadingFallback />}><AccountView account={viewingAccount} /></Suspense>;
      case 'nearbyPosts':
        if (!nearbyPostsResult) return <div className="p-8 text-center">No nearby results available.</div>;
        return <Suspense fallback={<LoadingFallback />}><NearbyPostsView result={nearbyPostsResult} /></Suspense>;
       case 'forums':
        return <Suspense fallback={<LoadingFallback />}><ForumsView /></Suspense>;
       case 'forumPostDetail':
        if (!viewingForumPostId) return null;
        return <Suspense fallback={<LoadingFallback />}><ForumsPostDetailView postId={viewingForumPostId} /></Suspense>;
      case 'createPost':
        return <Suspense fallback={<LoadingFallback />}><CreatePostPage /></Suspense>;
      case 'editPost':
          if (!viewingPostId) return null;
          return <Suspense fallback={<LoadingFallback />}><CreatePostPage editingPostId={viewingPostId} /></Suspense>;
      case 'subscription':
        return <Suspense fallback={<LoadingFallback />}><SubscriptionPage /></Suspense>;
      case 'activity':
        return <Suspense fallback={<LoadingFallback />}><ActivityPage initialTab={activityInitialTab} /></Suspense>;
      case 'accountAnalytics':
        if (!viewingAccount) return <div className="p-8 text-center">Account not found.</div>;
        return <Suspense fallback={<LoadingFallback />}><AccountAnalyticsView account={viewingAccount} /></Suspense>;
       case 'editAdminPage':
         if (!editingAdminPageKey) return null;
         return <Suspense fallback={<LoadingFallback />}><EditPageView pageKey={editingAdminPageKey} /></Suspense>;
       case 'editProfile':
         if (!viewingAccount) return null;
         return <Suspense fallback={<LoadingFallback />}><EditProfilePage account={viewingAccount} /></Suspense>;
       case 'manageCatalog':
         if (!viewingAccount) return null;
         return <Suspense fallback={<LoadingFallback />}><ManageCatalogPage account={viewingAccount} /></Suspense>;
       case 'createForumPost':
         return <Suspense fallback={<LoadingFallback />}><CreateForumPostPage /></Suspense>;
      default:
        return null;
  }
}