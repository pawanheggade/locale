
import { createContext, useContext } from 'react';
// FIX: Import `Post` type for use in `prefillData`.
import { AppView, Account, ActivityTab, AdminView, DisplayablePost, Post } from '../types';

// --- Navigation Context ---
interface NavigationContextType {
  // FIX: Add `prefillData` to the options object to allow passing post data.
  navigateTo: (view: AppView, options?: { postId?: string; account?: Account, forumPostId?: string, pageKey?: 'terms' | 'privacy', activityTab?: ActivityTab, adminView?: AdminView, storyId?: string, prefillData?: Partial<Post> }) => void;
  navigateToAccount: (accountId: string) => void;
  handleBack: () => void;
  showOnMap: (target: string | Account) => void;
  viewingAccount: Account | null;
  viewingPostId: string | null;
  viewingForumPostId: string | null;
  viewingStoryId: string | null;
  editingAdminPageKey: 'terms' | 'privacy' | null;
  activityInitialTab: ActivityTab;
  adminInitialView?: AdminView;
  nearbyPostsResult: { posts: DisplayablePost[], locationName: string | null } | null;
  userLocation: { lat: number; lng: number } | null;
  isFindingNearby: boolean;
  postToFocusOnMap: string | null;
  onPostFocusComplete: () => void;
  locationToFocus: { coords: { lat: number; lng: number }; name: string } | null;
  onLocationFocusComplete: () => void;
  // FIX: Add state to hold the prefill data for the create post page.
  postPrefillData: Partial<Post> | null;
}

export const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
    const context = useContext(NavigationContext);
    if (!context) throw new Error('useNavigation must be used within a NavigationProvider');
    return context;
};
