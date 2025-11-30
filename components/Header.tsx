import React, { useState, useEffect, useMemo, useRef } from 'react';
import SearchBar from './SearchBar';
import { ChevronLeftIcon, FunnelIcon, ChatBubbleEllipsisIcon, SearchIcon } from './Icons';
import { Account, AppView } from '../types';
import { AccountMenu } from './AccountMenu';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { useClickOutside } from '../hooks/useClickOutside';
import { Logo } from './Logo';
import { useAuth } from '../contexts/AuthContext';
import { useActivity } from '../contexts/ActivityContext';
import { usePosts } from '../contexts/PostsContext';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (query: string) => void;
  recentSearches: string[];
  onRemoveRecentSearch: (query: string) => void;
  onClearRecentSearches: () => void;
  isAiSearchEnabled: boolean;
  onToggleAiSearch: () => void;
  onAiSearchSubmit: (query: string) => void;
  isAiSearching: boolean;
  mainView: 'grid' | 'map';
  onMainViewChange: (view: 'grid' | 'map') => void;
  gridView: 'default' | 'compact';
  onGridViewChange: (view: 'default' | 'compact') => void;
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  onGoHome: () => void;
  onRefresh: () => void;
  onClearFilters: () => void;
  onOpenAccount: () => void;
  onEditProfile: () => void;
  onOpenSubscriptionPage: () => void;
  onOpenActivityPage: () => void;
  onOpenCreateModal: () => void;
  onOpenLoginModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenCreateAccountModal: () => void;
  viewingAccount: Account | null;
  isAnyFilterActive: boolean;
  onOpenFilterPanel: () => void;
  isScrolled: boolean;
  isVisible: boolean;
  onBack?: () => void;
}

const HeaderComponent: React.FC<HeaderProps> = ({ 
  searchQuery, 
  onSearchChange, 
  onSearchSubmit,
  recentSearches,
  onRemoveRecentSearch,
  onClearRecentSearches,
  isAiSearchEnabled,
  onToggleAiSearch,
  onAiSearchSubmit,
  isAiSearching,
  mainView,
  onMainViewChange,
  gridView,
  onGridViewChange,
  onViewChange,
  onGoHome,
  onClearFilters,
  onRefresh,
  currentView,
  onOpenAccount,
  onEditProfile,
  onOpenSubscriptionPage,
  onOpenActivityPage,
  onOpenCreateModal,
  onOpenLoginModal,
  onOpenSettingsModal,
  onOpenCreateAccountModal,
  viewingAccount,
  isAnyFilterActive,
  onOpenFilterPanel,
  isScrolled,
  isVisible,
  onBack,
}) => {
  const { currentAccount, bag } = useAuth();
  const { notifications } = useActivity();
  const { allAvailableTags } = usePosts();

  const bagCount = bag.length;
  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleResize = () => {
        setWindowWidth(window.innerWidth);
        if (window.innerWidth >= 640) {
            setIsMobileSearchOpen(false);
        }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useClickOutside(mobileSearchRef, (e) => {
    if (searchButtonRef.current && searchButtonRef.current.contains(e.target as Node)) {
        return;
    }
    setIsMobileSearchOpen(false);
  }, isMobileSearchOpen);
  
  const handleLogoClick = () => {
    onGoHome();
  };

  const isViewToggleDisabled = currentView !== 'all';

  const handleAccountViewToggle = () => {
    onOpenAccount();
  };
    
  const placeholder = useMemo(() => {
    if (isAiSearchEnabled) {
        return windowWidth < 640 ? 'Ask AI' : 'Ask AI anything...';
    }
    return 'Search products, services, events...';
  }, [windowWidth, isAiSearchEnabled]);

  const renderFilterButton = (className?: string) => (
    <Button 
        onClick={onOpenFilterPanel}
        disabled={isViewToggleDisabled}
        variant="overlay-dark"
        size="icon"
        className={cn(
            "shrink-0 transition-colors !rounded-xl",
            isAnyFilterActive && "text-red-600",
            className
        )}
        aria-label={isAnyFilterActive ? "Filters active. Open filters." : "Open filters"}
        title={isAnyFilterActive ? "Filters active" : "Filters"}
    >
        <FunnelIcon className="w-6 h-6" isFilled={isAnyFilterActive} />
    </Button>
  );

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-[2000] transition-transform duration-300 ease-in-out',
      'bg-white border-b border-gray-200',
      !isVisible && '-translate-y-full'
    )}>
      <div className={`px-4 sm:px-6 lg:px-8 flex sm:grid sm:grid-cols-[auto_1fr_auto] items-center justify-between sm:justify-start gap-0 sm:gap-6 md:gap-8 transition-all duration-300 ${isScrolled ? 'h-14' : 'h-16'}`}>
        
        <div className="flex items-center gap-2 shrink-0">
            {onBack && (
              <Button variant="overlay-dark" size="icon-sm" onClick={onBack} className="-ml-2 !rounded-xl" aria-label="Go back">
                <ChevronLeftIcon className="w-6 h-6" />
              </Button>
            )}
            <Logo onClick={handleLogoClick} />
        </div>
        
        <div className="hidden sm:flex flex-1 justify-center min-w-0 sm:col-start-2">
            <div className="w-full flex items-center gap-1">
                <SearchBar 
                    searchQuery={searchQuery}
                    onSearchChange={onSearchChange}
                    onSearchSubmit={onSearchSubmit}
                    placeholder={placeholder}
                    wrapperClassName="flex-1 min-w-0"
                    suggestions={allAvailableTags}
                    recentSearches={recentSearches}
                    onRemoveRecentSearch={onRemoveRecentSearch}
                    onClearRecentSearches={onClearRecentSearches}
                    isAiSearchEnabled={isAiSearchEnabled}
                    onToggleAiSearch={onToggleAiSearch}
                    onAiSearchSubmit={onAiSearchSubmit}
                    isAiSearching={isAiSearching}
                />
                {renderFilterButton()}
            </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 sm:justify-self-end">
            <Button
                ref={searchButtonRef}
                onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                variant="ghost"
                size="icon"
                className={cn(
                    "sm:hidden shrink-0 !rounded-xl",
                    (isMobileSearchOpen || (searchQuery && windowWidth < 640)) && "text-red-600"
                )}
                aria-label="Toggle search"
            >
                <SearchIcon className="w-6 h-6" />
            </Button>

            {renderFilterButton("sm:hidden")}

            <Button 
                onClick={() => {
                    if (currentView === 'forums') {
                        onViewChange('all');
                    } else {
                        onViewChange('forums');
                    }
                }}
                variant="overlay-dark"
                size="icon"
                className={cn(
                    "shrink-0 transition-colors !rounded-xl",
                    currentView === 'forums' && "text-red-600"
                )}
                aria-label={currentView === 'forums' ? "Back to feed" : "Community Forums"}
                title={currentView === 'forums' ? "Back to feed" : "Community Forums"}
            >
                <ChatBubbleEllipsisIcon className="w-6 h-6" isFilled={currentView === 'forums'} />
            </Button>

            <div className="relative">
                 {currentAccount ? (
                    <AccountMenu
                        currentAccount={currentAccount}
                        unreadNotificationsCount={unreadNotificationsCount}
                        onOpenCreateModal={onOpenCreateModal}
                        onViewChange={onViewChange}
                        currentView={currentView}
                        handleAccountViewToggle={handleAccountViewToggle}
                        onEditProfile={onEditProfile}
                        onOpenActivityPage={onOpenActivityPage}
                        mainView={mainView}
                        onMainViewChange={onMainViewChange}
                        gridView={gridView}
                        onGridViewChange={onGridViewChange}
                        bagCount={bagCount}
                        onOpenSettingsModal={onOpenSettingsModal}
                        onOpenSubscriptionPage={onOpenSubscriptionPage}
                    />
                ) : (
                    <div className="flex items-center gap-2">
                        <Button onClick={onOpenLoginModal} variant="pill-red" size="sm" className="px-4">Sign in</Button>
                    </div>
                )}
            </div>
        </div>
      </div>

      {isMobileSearchOpen && (
          <div ref={mobileSearchRef} className="sm:hidden px-2 pb-2 bg-white border-b border-gray-100 animate-fade-in-up">
              <SearchBar 
                  searchQuery={searchQuery}
                  onSearchChange={onSearchChange}
                  onSearchSubmit={(q) => { onSearchSubmit(q); setIsMobileSearchOpen(false); }}
                  placeholder={isAiSearchEnabled ? "Ask AI anything..." : "Search products, services, events..."}
                  wrapperClassName="w-full"
                  suggestions={allAvailableTags}
                  recentSearches={recentSearches}
                  onRemoveRecentSearch={onRemoveRecentSearch}
                  onClearRecentSearches={onClearRecentSearches}
                  isAiSearchEnabled={isAiSearchEnabled}
                  onToggleAiSearch={onToggleAiSearch}
                  onAiSearchSubmit={(q) => { onAiSearchSubmit(q); setIsMobileSearchOpen(false); }}
                  isAiSearching={isAiSearching}
                  autoFocus={true}
              />
          </div>
      )}
    </header>
  );
};

export const Header = React.memo(HeaderComponent);