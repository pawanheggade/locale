import { createContext, useContext } from 'react';
import { AppView, Account, ActivityTab, AdminView, DisplayablePost } from '../types';

// --- Navigation Context ---
interface NavigationContextType {
  navigateTo: (view: AppView, options?: { postId?: string; account?: Account, forumPostId?: string, pageKey?: 'terms' | 'privacy', activityTab?: ActivityTab, adminView?: AdminView, mainView?: 'grid' | 'map' }) => void;
  navigateToAccount: (accountId: string) => void;
  handleBack: () => void;
  showOnMap: (target: string | Account) => void;
  saveHistoryState: () => void;
  viewingAccount: Account | null;
  viewingPostId: string | null;
  viewingForumPostId: string | null;
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
}

export const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
    const context = useContext(NavigationContext);
    if (!context) throw new Error('useNavigation must be used within a NavigationProvider');
    return context;
};