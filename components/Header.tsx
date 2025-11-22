
import React, { useState, useEffect, useMemo } from 'react';
import SearchBar from './SearchBar';
import { ChevronLeftIcon } from './Icons';
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
  onOpenSubscriptionPage: () => void;
  onOpenNotificationsModal: () => void;
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
  onOpenSubscriptionPage,
  onOpenNotificationsModal,
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
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
    
  const placeholder = useMemo(() => isMobile
    ? (isAiSearchEnabled ? 'Ask AI…' : 'Search…')
    : (isAiSearchEnabled ? 'Ask AI anything...' : 'Search for products, services, events...'), 
  [isMobile, isAiSearchEnabled]);

  const handleBagClick = () => {
    if (currentAccount) {
        if (currentView !== 'bag') {
            onViewChange('bag');
        }
    } else {
        onOpenLoginModal();
    }
  };

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-[2000] transition-transform duration-300 ease-in-out',
      'backdrop-blur-lg border-b border-black/5 bg-white/80', // Added bg for glass effect over scrolling content
      isScrolled && 'shadow-sm',
      !isVisible && '-translate-y-full' // Hide via transform
    )}>
      <div className={`px-4 sm:px-6 grid grid-cols-[auto_1fr_auto] items-center gap-x-2 sm:gap-x-4 transition-all duration-300 ${isScrolled ? 'h-14' : 'h-16'}`}>
        <div className="flex items-center gap-2 shrink-0">
            {onBack && (
              <Button variant="glass" size="icon-sm" onClick={onBack} className="-ml-2" aria-label="Go back">
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
              className="text-2xl sm:text-3xl font-bold text-gray-800 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 rounded-lg transition-[transform,opacity] active:scale-95 flex items-baseline"
            >
              <span>l</span>
              <span className="relative inline-flex flex-col items-center">
                <span>o</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-[80%]">
                  <path d="M2 2L6 10L10 2H2Z" stroke="#DC2626" strokeWidth="3" strokeLinejoin="round" />
                </svg>
              </span>
              <span>cale</span>
            </h1>
        </div>
        
        <div className="flex justify-center px-0 sm:px-2 md:px-4 min-w-0">
            <div className="w-full max-w-md md:max-w-xl lg:max-w-3xl mx-auto">
                <SearchBar 
                    searchQuery={searchQuery}
                    onSearchChange={onSearchChange}
                    onSearchSubmit={onSearchSubmit}
                    placeholder={placeholder}
                    wrapperClassName="w-full"
                    suggestions={autoCompleteSuggestions}
                    recentSearches={recentSearches}
                    onRemoveRecentSearch={onRemoveRecentSearch}
                    onClearRecentSearches={onClearRecentSearches}
                    isAiSearchEnabled={isAiSearchEnabled}
                    onToggleAiSearch={onToggleAiSearch}
                    onAiSearchSubmit={onAiSearchSubmit}
                    isAiSearching={isAiSearching}
                    onOpenFilterPanel={onOpenFilterPanel}
                    isAnyFilterActive={isAnyFilterActive}
                    isFilterButtonDisabled={isViewToggleDisabled}
                />
            </div>
        </div>


        <div className="flex items-center gap-2 sm:gap-2 shrink-0 justify-self-end">
            <div className="relative">
                 {currentAccount ? (
                    <AccountMenu
                        currentAccount={currentAccount}
                        unreadNotificationsCount={unreadNotificationsCount}
                        onOpenCreateModal={onOpenCreateModal}
                        onViewChange={onViewChange}
                        currentView={currentView}
                        handleAccountViewToggle={handleAccountViewToggle}
                        onOpenNotificationsModal={onOpenNotificationsModal}
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
                        <Button onClick={onOpenLoginModal} variant="glass-red" size="sm" className="px-4">Sign in</Button>
                    </div>
                )}
            </div>
        </div>
      </div>
    </header>
  );
};

export const Header = React.memo(HeaderComponent);
