
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
  mainView: 'grid' | 'map';
  onMainViewChange: (view: 'grid' | 'map') => void;
  gridView: 'default' | 'compact';
  onGridViewChange: (view: 'default' | 'compact') => void;
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
  mainView,
  onMainViewChange,
  gridView,
  onGridViewChange,
}) => {
  const { filterState, dispatchFilterAction, isAnyFilterActive, handleToggleAiSearch, handleAiSearchSubmit } = useFilters();
  const { currentAccount, bag } = useAuth();
  const { totalActivityCount } = useActivity();
  const { openModal } = useUI();
  const { navigateTo } = useNavigation();

  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);

  const filterDropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(filterDropdownRef, () => setIsFilterDropdownOpen(false), isFilterDropdownOpen);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
      if (windowWidth >= 640 && isMobileSearchOpen) {
          setIsMobileSearchOpen(false);
      }
  }, [windowWidth, isMobileSearchOpen]);

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
  
  const handleClearSearch = () => {
    dispatchFilterAction({ type: 'SET_SEARCH_QUERY', payload: '' });
    if (filterState.isAiSearchEnabled) {
      dispatchFilterAction({ type: 'SET_AI_RESULTS', payload: null });
    }
  };
  
  const handleMobileSearchCancel = () => {
    if (filterState.searchQuery) {
        handleClearSearch();
    }
    setIsMobileSearchOpen(false);
  };

  const isViewToggleDisabled = view !== 'all';

  const sortOptions = [
    { value: 'relevance-desc', label: 'Relevant' },
    { value: 'popularity-desc', label: 'Popular' },
    { value: 'date-desc', label: 'Recent' },
  ];

  const placeholder = viewingAccount 
    ? `Search ${viewingAccount.name.split(' ')[0]}'s page...` 
    : (filterState.isAiSearchEnabled ? "Ask Locale AI..." : "Search products, services, events…");
  
  const renderAiButton = (className?: string) => (
    <Button
        onClick={handleToggleAiSearch}
        variant={filterState.isAiSearchEnabled ? 'pill-red' : 'ghost'}
        size="icon-sm"
        className={cn(
          "text-xs font-extrabold uppercase tracking-wider rounded-xl",
          !filterState.isAiSearchEnabled && "text-gray-500 ring-1 ring-inset ring-gray-300",
          className
        )}
        aria-label={filterState.isAiSearchEnabled ? 'Disable AI Search' : 'Enable AI Search'}
        title={filterState.isAiSearchEnabled ? 'Disable AI Search' : 'Enable AI Search'}
        aria-pressed={!!filterState.isAiSearchEnabled}
    >
        ai
    </Button>
  );

  const renderFilterButton = (className?: string) => (
    <div className={cn("relative shrink-0", className)} ref={filterDropdownRef}>
        <Button 
            id="filter-dropdown-trigger"
            onClick={() => setIsFilterDropdownOpen(prev => !prev)}
            disabled={isViewToggleDisabled}
            variant="overlay-dark"
            size="icon"
            className={cn(
                "transition-colors !rounded-xl",
                isAnyFilterActive && "text-red-600"
            )}
            aria-label={isAnyFilterActive ? "Filters active. Open sort and filter options." : "Open sort and filter options"}
            title={isAnyFilterActive ? "Filters active" : "Filters"}
            aria-haspopup="true"
            aria-expanded={isFilterDropdownOpen}
            aria-controls={isFilterDropdownOpen ? "filter-dropdown-menu" : undefined}
        >
            <FunnelIcon className="w-6 h-6" isFilled={isAnyFilterActive} />
        </Button>
        {isFilterDropdownOpen && (
            <div id="filter-dropdown-menu" className="absolute right-0 mt-2 w-auto origin-top-right bg-white rounded-xl shadow-lg border z-10 animate-zoom-in">
                <div className="p-1">
                  <ul>
                      {sortOptions.map(option => (
                          <li key={option.value}>
                              <Button
                                  onClick={() => handleSortChange(option.value)}
                                  variant="ghost"
                                  className={cn(
                                    "w-full justify-start px-3 py-2 h-auto rounded-lg text-sm font-semibold whitespace-nowrap",
                                    filterState.sortOption === option.value ? "text-red-600 bg-red-50" : "text-gray-600"
                                  )}
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
                      className="w-full justify-start px-3 py-2 h-auto rounded-lg text-sm font-semibold text-gray-600 whitespace-nowrap"
                  >
                      More Filters
                  </Button>
                </div>
            </div>
        )}
    </div>
  );

  const isForumsView = ['forums', 'forumPostDetail', 'createForumPost'].includes(view);

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-[2000] transition-transform duration-300 ease-in-out',
      'bg-white/80 backdrop-blur-md border-b border-gray-200',
      !isVisible && '-translate-y-full'
    )}>
      {/* Main Header */}
      <div className={cn(
          'px-4 sm:px-6 lg:px-8 grid grid-cols-[1fr_auto_1fr] sm:grid-cols-[auto_1fr_auto] items-center sm:justify-start gap-1 sm:gap-6 md:gap-8 transition-all duration-300',
          isScrolled ? 'h-14' : 'h-16'
      )}>
        
        {/* Left Section */}
        <div className="flex items-center gap-1 shrink-0 col-start-1 justify-self-start">
            {onBack && (
              <Button variant="overlay-dark" size="icon-sm" onClick={onBack} className="-ml-2 !rounded-xl" aria-label="Go back">
                <ChevronLeftIcon className="w-6 h-6" />
              </Button>
            )}
            <Logo onClick={handleLogoClick} />
        </div>
        
        {/* Center Section */}
        <div className="flex flex-1 justify-center min-w-0 col-start-2">
            {/* Mobile Mini Search Bar */}
            <div 
                className="sm:hidden flex items-center justify-center bg-gray-100 border border-gray-200/80 rounded-xl h-10 px-4 w-full"
                onClick={() => setIsMobileSearchOpen(true)}
            >
                <SearchIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600 ml-2 truncate">{placeholder}</span>
            </div>

            {/* Desktop Search Bar & Filter */}
            <div className="hidden sm:flex items-center w-full max-w-xl">
                <SearchBar 
                    searchQuery={filterState.searchQuery}
                    onSearchChange={(q) => dispatchFilterAction({ type: 'SET_SEARCH_QUERY', payload: q })}
                    onSearchSubmit={filterState.isAiSearchEnabled ? handleAiSearchSubmitWithHistory : handleSearchSubmit}
                    placeholder={placeholder}
                    wrapperClassName="w-full"
                    suggestions={[]}
                    recentSearches={recentSearches}
                    onRemoveRecentSearch={onRemoveRecentSearch}
                    onClearRecentSearches={onClearRecentSearches}
                    onAiSearchSubmit={handleAiSearchSubmitWithHistory}
                    isAiSearching={filterState.isAiSearching}
                    onCancelSearch={filterState.searchQuery ? handleClearSearch : undefined}
                    aiButton={renderAiButton()}
                    filterButton={renderFilterButton()}
                />
            </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1 shrink-0 col-start-3 justify-self-end">
            <Button 
                onClick={() => navigateTo(isForumsView ? 'all' : 'forums')}
                variant="outline"
                size="icon"
                className={cn(
                    "shrink-0 transition-colors !rounded-xl border-gray-200 bg-transparent hover:bg-gray-100",
                    isForumsView && "text-red-600 border-red-200 bg-red-50 hover:bg-red-100"
                )}
                aria-label={isForumsView ? "Back to feed" : "Community Forums"}
                title={isForumsView ? "Back to feed" : "Community Forums"}
            >
                <ChatBubbleEllipsisIcon className="w-6 h-6" isFilled={isForumsView} />
            </Button>

            <div className="relative">
                 {currentAccount ? (
                    <AccountMenu
                        currentAccount={currentAccount}
                        activityCount={totalActivityCount}
                        onOpenCreateModal={() => navigateTo('createPost')}
                        onViewChange={(v) => navigateTo(v)}
                        currentView={view}
                        handleAccountViewToggle={() => navigateTo('account', { account: currentAccount })}
                        onEditProfile={() => navigateTo('editProfile', { account: currentAccount })}
                        onOpenActivityPage={() => navigateTo('activity')}
                        mainView={mainView}
                        onMainViewChange={onMainViewChange}
                        gridView={gridView}
                        onGridViewChange={onGridViewChange}
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
      
      {/* Mobile Search Sub-Header */}
      {isMobileSearchOpen && windowWidth < 640 && (
          <div className="px-4 pb-3 sm:hidden animate-fade-in-down flex items-center">
              <SearchBar 
                    searchQuery={filterState.searchQuery}
                    onSearchChange={(q) => dispatchFilterAction({ type: 'SET_SEARCH_QUERY', payload: q })}
                    onSearchSubmit={filterState.isAiSearchEnabled ? handleAiSearchSubmitWithHistory : handleSearchSubmit}
                    placeholder={placeholder}
                    wrapperClassName="w-full"
                    suggestions={[]}
                    recentSearches={recentSearches}
                    onRemoveRecentSearch={onRemoveRecentSearch}
                    onClearRecentSearches={onClearRecentSearches}
                    onAiSearchSubmit={handleAiSearchSubmitWithHistory}
                    isAiSearching={filterState.isAiSearching}
                    onCancelSearch={handleMobileSearchCancel}
                    autoFocus
                    aiButton={renderAiButton()}
                    filterButton={renderFilterButton()}
              />
          </div>
      )}
    </header>
  );
};
