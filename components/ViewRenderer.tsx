
import React, { Suspense } from 'react';
import { AppView, DisplayablePost } from '../types';
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
const StudioPage = React.lazy(() => import('./StudioPage').then(module => ({ default: module.StudioPage })));
const StoryReel = React.lazy(() => import('./StoryReel').then(module => ({ default: module.StoryReel })));
const CreateStoryPostPage = React.lazy(() => import('./CreateStoryPostPage').then(module => ({ default: module.CreateStoryPostPage })));

interface ViewRendererProps {
  view: AppView;
  mainView: 'grid' | 'map' | 'videos';
  isInitialLoading: boolean;
  videoPosts?: DisplayablePost[];
}

const PaddedView: React.FC<{children: React.ReactNode}> = ({ children }) => (
    <div className="p-4 sm:p-6 lg:p-8">
        <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
    </div>
);

export const ViewRenderer: React.FC<ViewRendererProps> = (props) => {
  const { 
      view, mainView
  } = props;
    
  switch (view) {
      case 'all':
        if (mainView === 'grid') {
          return (
            <>
              <Suspense fallback={null}><StoryReel /></Suspense>
              <PaddedView><PostList /></PaddedView>
            </>
          );
        }
        if (mainView === 'videos') {
          return (
            <PaddedView><PostList posts={props.videoPosts} /></PaddedView>
          );
        }
        return (
          <Suspense fallback={<LoadingFallback />}><MapView /></Suspense>
        );
      case 'likes':
        return <PaddedView><LikesView /></PaddedView>;
      case 'bag':
        return <PaddedView><BagView /></PaddedView>;
      case 'admin':
        return <PaddedView><AdminPanel /></PaddedView>;
      case 'account':
        return <Suspense fallback={<LoadingFallback />}><AccountView /></Suspense>;
      case 'nearbyPosts':
        return <PaddedView><NearbyPostsView /></PaddedView>;
       case 'forums':
        return <PaddedView><ForumsView /></PaddedView>;
       case 'forumPostDetail':
        return <PaddedView><ForumsPostDetailView /></PaddedView>;
      case 'createPost':
        return <Suspense fallback={<LoadingFallback />}><CreatePostPage /></Suspense>;
      case 'editPost':
          return <Suspense fallback={<LoadingFallback />}><CreatePostPage /></Suspense>;
       case 'createStoryPost':
          return <Suspense fallback={<LoadingFallback />}><CreateStoryPostPage /></Suspense>;
       case 'editStory':
          return <Suspense fallback={<LoadingFallback />}><CreateStoryPostPage /></Suspense>;
      case 'subscription':
        return <PaddedView><SubscriptionPage /></PaddedView>;
      case 'activity':
        return <PaddedView><ActivityPage /></PaddedView>;
      case 'accountAnalytics':
        return <PaddedView><AccountAnalyticsView /></PaddedView>;
       case 'editAdminPage':
         return <Suspense fallback={<LoadingFallback />}><EditPageView /></Suspense>;
       case 'editProfile':
         return <Suspense fallback={<LoadingFallback />}><EditProfilePage /></Suspense>;
       case 'manageCatalog':
         return <Suspense fallback={<LoadingFallback />}><ManageCatalogPage /></Suspense>;
       case 'createForumPost':
         return <Suspense fallback={<LoadingFallback />}><CreateForumPostPage /></Suspense>;
       case 'settings':
         return <PaddedView><SettingsPage /></PaddedView>;
       case 'studio':
         return <PaddedView><StudioPage /></PaddedView>;
      default:
        return null;
  }
}