

import { createContext, useContext } from 'react';
import { AppView, Account, ActivityTab } from '../types';

// --- Navigation Context ---
interface NavigationContextType {
  navigateTo: (view: AppView, options?: { postId?: string; account?: Account, forumPostId?: string, pageKey?: 'terms' | 'privacy', activityTab?: ActivityTab }) => void;
  navigateToAccount: (accountId: string) => void;
  handleBack: () => void;
  showOnMap: (target: string | Account) => void;
}

export const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
    const context = useContext(NavigationContext);
    if (!context) throw new Error('useNavigation must be used within a NavigationProvider');
    return context;
};