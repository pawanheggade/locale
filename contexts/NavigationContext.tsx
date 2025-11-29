import React, { createContext, useState, useCallback, useContext, useMemo, useRef } from 'react';
import { Account, AppView } from '../types';
import { useFilters } from './FiltersContext';

interface HistoryItem {
    view: AppView;
    mainView: 'grid' | 'map';
    viewingPostId: string | null;
    viewingAccount: Account | null;
    viewingForumPostId: string | null;
}

interface NavigationContextType {
    view: AppView;
    mainView: 'grid' | 'map';
    viewingPostId: string | null;
    viewingAccount: Account | null;
    viewingForumPostId: string | null;
    mainContentRef: React.RefObject<HTMLDivElement>;
    navigateTo: (newView: AppView, options?: { postId?: string; account?: Account, forumPostId?: string }) => void;
    handleBack: () => void;
    handleMainViewChange: (newView: 'grid' | 'map') => void;
    history: HistoryItem[];
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [view, setView] = useState<AppView>('all');
    const [mainView, setMainView] = useState<'grid' | 'map'>('grid');
    const [viewingPostId, setViewingPostId] = useState<string | null>(null);
    const [viewingForumPostId, setViewingForumPostId] = useState<string | null>(null);
    const [viewingAccount, setViewingAccount] = useState<Account | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const mainContentRef = useRef<HTMLDivElement>(null);
    const { isAnyFilterActive, onClearFilters } = useFilters();

    const navigateTo = useCallback((
        newView: AppView,
        options: { postId?: string; account?: Account, forumPostId?: string } = {}
    ) => {
        const isSameView = view === newView;
        const isSamePost = viewingPostId === (options.postId || null);
        const isSameAccount = viewingAccount?.id === (options.account?.id || null);
        const isSameForumPost = viewingForumPostId === (options.forumPostId || null);

        if (isSameView && isSamePost && isSameAccount && isSameForumPost) return;

        setHistory(h => [...h, { view, mainView, viewingPostId, viewingAccount, viewingForumPostId }]);

        setView(newView);
        setViewingPostId(options.postId || null);
        setViewingAccount(options.account || null);
        setViewingForumPostId(options.forumPostId || null);
        if (mainContentRef.current) mainContentRef.current.scrollTop = 0;
    }, [view, mainView, viewingPostId, viewingAccount, viewingForumPostId]);
    
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
    
    const handleMainViewChange = useCallback((newMainView: 'grid' | 'map') => {
        if (mainView === newMainView) return;
        setHistory(h => [...h, { view, mainView, viewingPostId, viewingAccount, viewingForumPostId }]);
        setMainView(newMainView);
    }, [view, mainView, viewingPostId, viewingAccount, viewingForumPostId]);

    const value = useMemo(() => ({
        view, mainView, viewingPostId, viewingAccount, viewingForumPostId,
        navigateTo, handleBack, handleMainViewChange, mainContentRef, history
    }), [view, mainView, viewingPostId, viewingAccount, viewingForumPostId, navigateTo, handleBack, handleMainViewChange, history]);

    return (
        <NavigationContext.Provider value={value}>
            {children}
        </NavigationContext.Provider>
    );
};

export const useNavigation = () => {
    const context = useContext(NavigationContext);
    if (context === undefined) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
};