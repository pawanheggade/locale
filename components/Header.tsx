import React, { useState, useEffect, useMemo, useRef } from 'react';
import SearchBar from './SearchBar';
import { ChevronLeftIcon, FunnelIcon, ChatBubbleEllipsisIcon, SearchIcon, CheckIcon } from './Icons';
import { Account, AppView } from '../types';
import { AccountMenu } from './AccountMenu';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { useClickOutside } from '../hooks/useClickOutside';
import { Logo } from './Logo';
import { useFilters } from '../contexts/FiltersContext';
import { useAuth } from '../contexts/AuthContext';
import { useActivity } from '../contexts/ActivityContext';
import { useUI } from '../contexts/UIContext';
import { useNavigation } from '../App';

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

const HeaderComponent: React.FC<HeaderProps> = ({ 
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
  const { filterState, dispatchFilterAction, handleAiSearchSubmit, handleToggleAiSearch, onClearFilters, isAnyFilterActive } = useFilters();
  const { currentAccount, bag } = useAuth();
  const { notifications } = useActivity();
  const { openModal } = useUI();
  const { navigateTo } = useNavigation();

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

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
    if (searchButtonRef.current && searchButtonRef.current.contains(e.target as Node)) return;
    setIsMobileSearchOpen(false);
  }, isMobileSearchOpen);

  useClickOutside(filterDropdownRef, () => setIsFilterDropdownOpen(false), isFilterDropdownOpen);
  
  const handleLogoClick = () => {
    onGoHome();
  };

  const isViewToggleDisabled = filterState.searchQuery !== '' || view !== 'all';

  const handleSearchSubmit = (query: string) => {
    // This is the original non-AI submit logic from App.tsx
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;
    onRemoveRecentSearch(trimmedQuery); // This function actually adds/updates recent searches
  };
  
  const handleAiSearchSubmitWithHistory = (query: string) => {
    handleSearchSubmit(query);
    handleAiSearchSubmit(query);
  };
    
  const placeholder = useMemo(() => {
    if (filterState.isAiSearchEnabled) {
        return windowWidth < 640 ? 'Ask AI' : 'Ask AI anything...';
    }
    return 'Search products, services, events...';
  }, [windowWidth, filterState.isAiSearchEnabled]);

  const sortOptions = [
    { value: 'relevance-desc', label: 'Relevant' },
    { value: 'date-desc', label: 'Recent' },
    { value: 'popularity-desc', label: 'Popular' },
  ];

  const handleSortChange = (option: string) => {
    dispatchFilterAction({ type: 'SET_SORT_OPTION', payload: option });
    setIsFilterDropdownOpen(false);
  };

  const handleOpenFilterPanel = () => {
    openModal({ type: 'filterPanel' });
    setIsFilterDropdownOpen(false);
  };

  const renderFilterButton = (className?: string) => (
    <div className="relative" ref={filterDropdownRef}>
        <Button 
            onClick={() => setIsFilterDropdownOpen(prev => !prev)}
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
                    (isMobileSearchOpen || (filterState.searchQuery && windowWidth < 640)) && "text-red-600"
                )}
                aria-label="Toggle search"
            >
                <SearchIcon className="w-6 h-6" />
            </Button>

            {renderFilterButton("sm:hidden")}

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
                        unreadNotificationsCount={unreadNotificationsCount}
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

      {isMobileSearchOpen && (
          <div ref={mobileSearchRef} className="sm:hidden px-2 pb-2 bg-white border-b border-gray-100 animate-fade-in-up">
              <SearchBar 
                  searchQuery={filterState.searchQuery}
                  onSearchChange={(q) => dispatchFilterAction({ type: 'SET_SEARCH_QUERY', payload: q })}
                  onSearchSubmit={(q) => { (filterState.isAiSearchEnabled ? handleAiSearchSubmitWithHistory : handleSearchSubmit)(q); setIsMobileSearchOpen(false); }}
                  placeholder={placeholder}
                  wrapperClassName="w-full"
                  suggestions={[]}
                  recentSearches={recentSearches}
                  onRemoveRecentSearch={onRemoveRecentSearch}
                  onClearRecentSearches={onClearRecentSearches}
                  isAiSearchEnabled={filterState.isAiSearchEnabled}
                  onToggleAiSearch={handleToggleAiSearch}
                  onAiSearchSubmit={(q) => { handleAiSearchSubmitWithHistory(q); setIsMobileSearchOpen(false); }}
                  isAiSearching={filterState.isAiSearching}
                  autoFocus={true}
              />
          </div>
      )}
    </header>
  );
};

export const Header = React.memo(HeaderComponent);