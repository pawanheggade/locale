
import React, { useState, useEffect, useMemo } from 'react';
import SearchBar from './SearchBar';
import { ChevronLeftIcon, FunnelIcon, ChatBubbleEllipsisIcon } from './Icons';
import { Account, AppView } from '../types';
import { AccountMenu } from './AccountMenu';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (query: string) => void;
  autoCompleteSuggestions: string[];
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
  bagCount: number;
  unreadNotificationsCount: number;
  currentAccount: Account | null;
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
  autoCompleteSuggestions,
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
  bagCount,
  unreadNotificationsCount,
  currentAccount,
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
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const handleLogoClick = () => {
    onGoHome();
  };

  const isViewToggleDisabled = currentView !== 'all';

  const handleAccountViewToggle = () => {
    // Always navigate to own account page. If already there, `navigateTo` will do nothing.
    onOpenAccount();
  };
    
  const placeholder = useMemo(() => {
    // AI Search Logic
    if (isAiSearchEnabled) {
        return windowWidth < 640 ? 'Ask AI' : 'Ask AI anything...';
    }

    // Standard Search Logic
    if (windowWidth < 640) {
        // Mobile: Minimal
        return 'Search';
    } else if (windowWidth < 1150) {
        // Medium (Tablets/Small Laptops): Compact
        return 'Search...';
    } else {
        // Large Desktop: Full text
        return 'Search products, services, events...';
    }
  }, [windowWidth, isAiSearchEnabled]);

  const handleBagClick = () => {
    if (currentAccount) {
        if (currentView !== 'bag') {
            onViewChange('bag');
        }
    } else {
        onOpenLoginModal();
    }
  };

  // Helper to render filter button to avoid duplication
  const FilterButton = ({ className }: { className?: string }) => (
      <Button 
        onClick={onOpenFilterPanel}
        disabled={isViewToggleDisabled}
        variant="overlay-dark"
        size="icon"
        className={cn(
            "shrink-0 transition-colors",
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
      <div className={`px-2 sm:px-6 flex sm:grid sm:grid-cols-[auto_1fr_auto] items-center gap-1 sm:gap-6 md:gap-8 transition-all duration-300 ${isScrolled ? 'h-14' : 'h-16'}`}>
        <div className="flex items-center gap-2 shrink-0">
            {onBack && (
              <Button variant="overlay-dark" size="icon-sm" onClick={onBack} className="-ml-2" aria-label="Go back">
                <ChevronLeftIcon className="w-6 h-6" />
              </Button>
            )}
            <h1
              onClick={handleLogoClick}
              onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleLogoClick();
                  }
              }}
              role="button"
              tabIndex={0}
              aria-label="Go to all posts and clear filters"
              className="text-2xl sm:text-3xl font-bold text-black cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 transition-[transform,opacity] active:scale-95 flex items-baseline select-none"
            >
              <span>l</span>
              <span className="relative inline-flex flex-col items-center">
                <span>o</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-[80%]">
                  <path d="M2 2L6 10L10 2H2Z M1 7H11" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span>cale</span>
            </h1>
        </div>
        
        <div className="flex-1 min-w-0 flex justify-center">
            {/* Removed max-width constraints to allow search bar to grow larger */}
            <div className="w-full flex items-center gap-2">
                <SearchBar 
                    searchQuery={searchQuery}
                    onSearchChange={onSearchChange}
                    onSearchSubmit={onSearchSubmit}
                    placeholder={placeholder}
                    wrapperClassName="flex-1 min-w-0"
                    suggestions={autoCompleteSuggestions}
                    recentSearches={recentSearches}
                    onRemoveRecentSearch={onRemoveRecentSearch}
                    onClearRecentSearches={onClearRecentSearches}
                    isAiSearchEnabled={isAiSearchEnabled}
                    onToggleAiSearch={onToggleAiSearch}
                    onAiSearchSubmit={onAiSearchSubmit}
                    isAiSearching={isAiSearching}
                />
                {/* Desktop Filter Button (grouped with search) */}
                <div className="hidden sm:inline-flex">
                    <FilterButton />
                </div>
            </div>
        </div>

        {/* Mobile Filter Button (between search and right actions) */}
        <div className="sm:hidden shrink-0 flex items-center">
            <FilterButton />
        </div>

        <div className="flex items-center gap-1 shrink-0 justify-self-end">
            <Button 
                onClick={() => currentView === 'forums' ? onViewChange('all') : onViewChange('forums')}
                variant="overlay-dark"
                size="icon"
                className={cn(
                    "shrink-0 transition-colors",
                    currentView === 'forums' && "text-red-600"
                )}
                aria-label={currentView === 'forums' ? "Back to feed" : "Community Forums"}
                title={currentView === 'forums' ? "Back to feed" : "Community Forums"}
            >
                <ChatBubbleEllipsisIcon className="w-6 h-6" />
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
    </header>
  );
};

export const Header = React.memo(HeaderComponent);
