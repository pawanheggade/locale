
import React, { Suspense } from 'react';
import { AppView } from '../types';
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
const SettingsPage = React.lazy(() => import('./SettingsPage').then(module => ({ default: module.SettingsPage })));

interface ViewRendererProps {
  view: AppView;
  mainView: 'grid' | 'map';
  isInitialLoading: boolean;
}

export const ViewRenderer: React.FC<ViewRendererProps> = (props) => {
  const { 
      view, mainView
  } = props;
    
  switch (view) {
      case 'all':
        return mainView === 'grid' ? (
          <Suspense fallback={<LoadingFallback />}>
            <PostList />
          </Suspense>
        ) : (
          <Suspense fallback={<LoadingFallback />}>
            <MapView />
          </Suspense>
        );
      case 'likes':
        return <Suspense fallback={<LoadingFallback />}><LikesView /></Suspense>;
      case 'bag':
        return <Suspense fallback={<LoadingFallback />}><BagView /></Suspense>;
      case 'admin':
        return <Suspense fallback={<LoadingFallback />}><AdminPanel /></Suspense>;
      case 'account':
        return <Suspense fallback={<LoadingFallback />}><AccountView /></Suspense>;
      case 'nearbyPosts':
        return <Suspense fallback={<LoadingFallback />}><NearbyPostsView /></Suspense>;
       case 'forums':
        return <Suspense fallback={<LoadingFallback />}><ForumsView /></Suspense>;
       case 'forumPostDetail':
        return <Suspense fallback={<LoadingFallback />}><ForumsPostDetailView /></Suspense>;
      case 'createPost':
        return <Suspense fallback={<LoadingFallback />}><CreatePostPage /></Suspense>;
      case 'editPost':
          return <Suspense fallback={<LoadingFallback />}><CreatePostPage /></Suspense>;
      case 'subscription':
        return <Suspense fallback={<LoadingFallback />}><SubscriptionPage /></Suspense>;
      case 'activity':
        return <Suspense fallback={<LoadingFallback />}><ActivityPage /></Suspense>;
      case 'accountAnalytics':
        return <Suspense fallback={<LoadingFallback />}><AccountAnalyticsView /></Suspense>;
       case 'editAdminPage':
         return <Suspense fallback={<LoadingFallback />}><EditPageView /></Suspense>;
       case 'editProfile':
         return <Suspense fallback={<LoadingFallback />}><EditProfilePage /></Suspense>;
       case 'manageCatalog':
         return <Suspense fallback={<LoadingFallback />}><ManageCatalogPage /></Suspense>;
       case 'createForumPost':
         return <Suspense fallback={<LoadingFallback />}><CreateForumPostPage /></Suspense>;
       case 'settings':
         return <Suspense fallback={<LoadingFallback />}><SettingsPage /></Suspense>;
      default:
        return null;
  }
}
