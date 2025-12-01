import React, { useState, useEffect, useRef } from 'react';
import { Account, AppView } from '../types';
import { Button } from './ui/Button';
import { Logo } from './Logo';
import SearchBar from './SearchBar';
import { AccountMenu } from './AccountMenu';
import { FunnelIcon, ChevronLeftIcon, SearchIcon, ChatBubbleEllipsisIcon } from './Icons';
import { useFilters } from '../contexts/FiltersContext';
import { useAuth } from '../contexts/AuthContext';
import { useActivity } from '../contexts/ActivityContext';
import { useUI } from '../contexts/UIContext';
import { useNavigation } from '../App';
import { useClickOutside } from '../hooks/useClickOutside';
import { cn } from '../lib/utils';

interface HeaderProps {
  recentSearches: string[];
  onRemoveRecentSearch: (query: string) => void;
  onClearRecentSearches: () => void;
  onGoHome: () => void;
  onRefresh: () => void;
  viewingAccount: Account | null;
  isScrolled: boolean;
  isVisible: boolean;
  onBack?: () => void;
  view: AppView;
}

export const Header: React.FC<HeaderProps> = ({
  recentSearches,
  onRemoveRecentSearch,
  onClearRecentSearches,
  onGoHome,
  onRefresh,
  viewingAccount,
  isScrolled,
  isVisible,
  onBack,
  view,
}) => {
  const { filterState, dispatchFilterAction, isAnyFilterActive, handleToggleAiSearch, handleAiSearchSubmit } = useFilters();
  const { currentAccount, bag } = useAuth();
  const { unreadCount } = useActivity();
  const { openModal } = useUI();
  const { navigateTo } = useNavigation();

  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);

  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);

  useClickOutside(filterDropdownRef, () => setIsFilterDropdownOpen(false), isFilterDropdownOpen);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSortChange = (sortOption: string) => {
    dispatchFilterAction({ type: 'SET_SORT_OPTION', payload: sortOption });
    setIsFilterDropdownOpen(false);
  };

  const handleOpenFilterPanel = () => {
    openModal({ type: 'filterPanel' });
    setIsFilterDropdownOpen(false);
  };

  const handleSearchSubmit = (query: string) => {
    dispatchFilterAction({ type: 'SET_SEARCH_QUERY', payload: query });
    setIsMobileSearchOpen(false);
  };

  const handleAiSearchSubmitWithHistory = (query: string) => {
      handleSearchSubmit(query);
      handleAiSearchSubmit(query);
  };

  const handleLogoClick = () => {
      onGoHome();
  };

  const isViewToggleDisabled = view !== 'all';

  const sortOptions = [
    { value: 'relevance-desc', label: 'Relevant' },
    { value: 'popularity-desc', label: 'Popular' },
    { value: 'date-desc', label: 'Recent' },
  ];

  const placeholder = viewingAccount 
    ? `Search ${viewingAccount.name.split(' ')[0]}'s items...` 
    : (filterState.isAiSearchEnabled ? "Ask Locale AI..." : "Search for items, services...");

  const renderFilterButton = (className?: string) => (
    <div className={cn("relative shrink-0", className)} ref={filterDropdownRef}>
        <Button 
            onClick={() => setIsFilterDropdownOpen(prev => !prev)}
            disabled={isViewToggleDisabled}
            variant="overlay-dark"
            size="icon"
            className={cn(
                "transition-colors !rounded-xl",
                isAnyFilterActive && "text-red-600"
            )}
            aria-label={isAnyFilterActive ? "Filters active. Open filters." : "Open filters"}
            title={isAnyFilterActive ? "Filters active" : "Filters"}
            aria-haspopup="true"
            aria-expanded={isFilterDropdownOpen}
        >
            <FunnelIcon className="w-6 h-6" isFilled={isAnyFilterActive} />
        </Button>
        {isFilterDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-xl shadow-lg border z-10 animate-zoom-in" role="menu">
                <div className="p-2">
                  <ul>
                      {sortOptions.map(option => (
                          <li key={option.value}>
                              <Button
                                  onClick={() => handleSortChange(option.value)}
                                  variant="ghost"
                                  className={cn(
                                    "w-full justify-start px-3 py-2 h-auto rounded-lg text-sm font-semibold",
                                    filterState.sortOption === option.value ? "text-red-600" : "text-gray-600"
                                  )}
                                  role="menuitem"
                              >
                                  {option.label}
                              </Button>
                          </li>
                      ))}
                  </ul>
                  <div className="my-1 h-px bg-gray-100" />
                  <Button
                      onClick={handleOpenFilterPanel}
                      variant="ghost"
                      className="w-full justify-start px-3 py-2 h-auto rounded-lg text-sm font-semibold text-gray-600"
                      role="menuitem"
                  >
                      More Filters
                  </Button>
                </div>
            </div>
        )}
    </div>
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
                    searchQuery={filterState.searchQuery}
                    onSearchChange={(q) => dispatchFilterAction({ type: 'SET_SEARCH_QUERY', payload: q })}
                    onSearchSubmit={filterState.isAiSearchEnabled ? handleAiSearchSubmitWithHistory : handleSearchSubmit}
                    placeholder={placeholder}
                    wrapperClassName="flex-1 min-w-0"
                    suggestions={[]}
                    recentSearches={recentSearches}
                    onRemoveRecentSearch={onRemoveRecentSearch}
                    onClearRecentSearches={onClearRecentSearches}
                    isAiSearchEnabled={filterState.isAiSearchEnabled}
                    onToggleAiSearch={handleToggleAiSearch}
                    onAiSearchSubmit={handleAiSearchSubmitWithHistory}
                    isAiSearching={filterState.isAiSearching}
                />
                {windowWidth >= 640 && renderFilterButton()}
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
                    (isMobileSearchOpen || (filterState.searchQuery && windowWidth < 640)) && "text-red-600"
                )}
                aria-label="Toggle search"
            >
                <SearchIcon className="w-6 h-6" />
            </Button>

            {windowWidth < 640 && renderFilterButton()}

            <Button 
                onClick={() => navigateTo(view === 'forums' ? 'all' : 'forums')}
                variant="overlay-dark"
                size="icon"
                className={cn("shrink-0 transition-colors !rounded-xl", view === 'forums' && "text-red-600")}
                aria-label={view === 'forums' ? "Back to feed" : "Community Forums"}
                title={view === 'forums' ? "Back to feed" : "Community Forums"}
            >
                <ChatBubbleEllipsisIcon className="w-6 h-6" isFilled={view === 'forums'} />
            </Button>

            <div className="relative">
                 {currentAccount ? (
                    <AccountMenu
                        currentAccount={currentAccount}
                        unreadNotificationsCount={unreadCount}
                        onOpenCreateModal={() => navigateTo('createPost')}
                        onViewChange={(v) => navigateTo(v)}
                        currentView={view}
                        handleAccountViewToggle={() => navigateTo('account', { account: currentAccount })}
                        onEditProfile={() => openModal({ type: 'editAccount', data: currentAccount })}
                        onOpenActivityPage={() => navigateTo('activity')}
                        mainView={'grid'}
                        onMainViewChange={() => {}}
                        gridView={'default'}
                        onGridViewChange={() => {}}
                        bagCount={bag.length}
                        onOpenSettingsModal={() => navigateTo('settings')}
                        onOpenSubscriptionPage={() => navigateTo('subscription')}
                    />
                ) : (
                    <div className="flex items-center gap-2">
                        <Button onClick={() => openModal({ type: 'login' })} variant="pill-red" size="sm" className="px-4">Sign in</Button>
                    </div>
                )}
            </div>
        </div>
      </div>
      
      {/* Mobile Search Bar */}
      {isMobileSearchOpen && windowWidth < 640 && (
          <div className="px-4 pb-3 sm:hidden animate-fade-in-up">
              <SearchBar 
                    searchQuery={filterState.searchQuery}
                    onSearchChange={(q) => dispatchFilterAction({ type: 'SET_SEARCH_QUERY', payload: q })}
                    onSearchSubmit={filterState.isAiSearchEnabled ? handleAiSearchSubmitWithHistory : handleSearchSubmit}
                    placeholder={placeholder}
                    suggestions={[]}
                    recentSearches={recentSearches}
                    onRemoveRecentSearch={onRemoveRecentSearch}
                    onClearRecentSearches={onClearRecentSearches}
                    isAiSearchEnabled={filterState.isAiSearchEnabled}
                    onToggleAiSearch={handleToggleAiSearch}
                    onAiSearchSubmit={handleAiSearchSubmitWithHistory}
                    isAiSearching={filterState.isAiSearching}
                    autoFocus
              />
          </div>
      )}
    </header>
  );
};
