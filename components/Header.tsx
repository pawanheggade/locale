
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Account, AppView } from '../types';
import { Button } from './ui/Button';
import { Logo } from './Logo';
import SearchBar from './SearchBar';
import { FunnelIcon, ChevronLeftIcon, SearchIcon, ChatBubbleEllipsisIcon, ChevronDownIcon, HeartIcon, MapPinIcon, PostCardIcon, Squares3X3Icon, LogoIcon, ShoppingBagIcon, UserIcon, BellIcon } from './Icons';
import { useFilters } from '../contexts/FiltersContext';
import { useAuth } from '../contexts/AuthContext';
import { useActivity } from '../contexts/ActivityContext';
import { useUI } from '../contexts/UIContext';
import { useNavigation } from '../contexts/NavigationContext';
import { useClickOutside } from '../hooks/useClickOutside';
import { useBadgeAnimation } from '../hooks/useBadgeAnimation';
import { cn } from '../lib/utils';

interface HeaderProps {
  onSearchSubmit: (query: string) => void;
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
}

export const Header: React.FC<HeaderProps> = ({
  onSearchSubmit,
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
}) => {
  const { filterState, dispatchFilterAction, isAnyFilterActive, handleToggleAiSearch, handleAiSearchSubmit, onClearFilters } = useFilters();
  const { currentAccount, bag } = useAuth();
  const { totalActivityCount } = useActivity();
  const { openModal, gridView, setGridView, isTabletOrDesktop } = useUI();
  const { navigateTo, handleBack } = useNavigation();

  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isNavDropdownOpen, setIsNavDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const navDropdownRef = useRef<HTMLDivElement>(null);

  const bagCount = bag.length;
  const animateBagBadge = useBadgeAnimation(bagCount);

  const showViewSelector = useMemo(() => {
    if (!isTabletOrDesktop) {
      return false;
    }
    // Don't show grid density controls on map view
    if (view === 'all' && mainView === 'map') return false;

    const viewsWithGrid = ['all', 'likes', 'account', 'forums', 'nearbyPosts', 'activity'];
    return viewsWithGrid.includes(view);
  }, [view, isTabletOrDesktop, mainView]);
  
  useClickOutside(filterDropdownRef, () => setIsFilterDropdownOpen(false), isFilterDropdownOpen);
  useClickOutside(navDropdownRef, () => setIsNavDropdownOpen(false), isNavDropdownOpen);

  useEffect(() => {
    if (isSearchOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsSearchOpen(false);
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isSearchOpen]);
  
  const handleSortChange = (sortOption: string) => {
    dispatchFilterAction({ type: 'SET_SORT_OPTION', payload: sortOption });
    setIsFilterDropdownOpen(false);
  };

  const handleOpenFilterPanel = () => {
    openModal({ type: 'filterPanel' });
    setIsFilterDropdownOpen(false);
  };

  const handleFormSubmit = (query: string) => {
    onSearchSubmit(query);
  };

  const handleAiSearchSubmitWithHistory = (query: string) => {
      onSearchSubmit(query);
      handleAiSearchSubmit(query);
  };

  const handleLogoClick = () => {
      onGoHome();
  };
  
  const handleClearSearchText = () => {
    dispatchFilterAction({ type: 'SET_SEARCH_QUERY', payload: '' });
    if (filterState.isAiSearchEnabled) {
      dispatchFilterAction({ type: 'SET_AI_RESULTS', payload: null });
    }
  };

  const handleExitSearch = () => {
      onClearFilters();
      setIsSearchOpen(false);
  };

  const navItems = [
    { 
      id: 'markets',
      label: 'Markets', 
      icon: <LogoIcon className="w-5 h-5" />,
      isActive: view === 'all' && mainView === 'grid',
      onClick: () => {
        if (view !== 'all') navigateTo('all');
        onMainViewChange('grid');
        setIsNavDropdownOpen(false);
      }
    },
    { 
        id: 'maps',
        label: 'Maps', 
        icon: <MapPinIcon className="w-5 h-5" />,
        isActive: view === 'all' && mainView === 'map',
        onClick: () => {
            if (view !== 'all') navigateTo('all');
            onMainViewChange('map');
            setIsNavDropdownOpen(false);
        }
    },
    { 
      id: 'forums',
      label: 'Forums', 
      icon: <ChatBubbleEllipsisIcon className="w-5 h-5" />,
      isActive: view === 'forums',
      onClick: () => {
          navigateTo('forums');
          setIsNavDropdownOpen(false);
      }
    },
    { 
      id: 'likes',
      label: 'Likes', 
      icon: <HeartIcon className="w-5 h-5" />,
      isActive: view === 'likes',
      onClick: () => {
          navigateTo('likes');
          setIsNavDropdownOpen(false);
      }
    },
    { 
      id: 'activity',
      label: 'Activity', 
      icon: <BellIcon className="w-5 h-5" />,
      isActive: view === 'activity',
      onClick: () => {
          navigateTo('activity');
          setIsNavDropdownOpen(false);
      },
      badgeCount: totalActivityCount,
    },
  ];

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
            disabled={view !== 'all'}
            variant="ghost"
            size="icon"
            className={cn(
                "!rounded-xl text-gray-600",
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
            <div id="filter-dropdown-menu" className="absolute left-0 mt-2 w-auto origin-top-left bg-white rounded-xl shadow-lg border z-10 animate-zoom-in">
                <div className="p-1">
                  <ul>
                      {sortOptions.map(option => (
                          <li key={option.value}>
                              <Button
                                  onClick={() => handleSortChange(option.value)}
                                  variant="ghost"
                                  className={cn(
                                    "w-full !justify-start px-3 py-2 h-auto rounded-lg text-sm font-semibold whitespace-nowrap",
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
                      className="w-full !justify-start px-3 py-2 h-auto rounded-lg text-sm font-semibold text-gray-600 whitespace-nowrap"
                  >
                      More Filters
                  </Button>
                </div>
            </div>
        )}
    </div>
  );

  const isProfileActive = view === 'account' && viewingAccount?.id === currentAccount?.id;

  return (
    <>
      <header className={cn(
        'fixed top-0 left-0 right-0 z-[2000] transition-transform duration-300 ease-in-out',
        'bg-white/80 backdrop-blur-md border-b border-gray-200',
        !isVisible && '-translate-y-full'
      )}>
        <div className={cn(
            'px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 transition-all duration-300',
            isScrolled ? 'h-14' : 'h-16'
        )}>
          
          {isSearchOpen ? (
            <div className="flex-1 flex items-center gap-2">
              <Button
                  type="button"
                  onClick={handleExitSearch}
                  variant="ghost"
                  size="icon"
                  className="text-gray-500 rounded-xl shrink-0 -ml-2"
                  aria-label="Exit search and clear filters"
              >
                  <ChevronLeftIcon className="w-6 h-6" />
              </Button>
              <SearchBar 
                  searchQuery={filterState.searchQuery}
                  onSearchChange={(q) => dispatchFilterAction({ type: 'SET_SEARCH_QUERY', payload: q })}
                  onSearchSubmit={filterState.isAiSearchEnabled ? handleAiSearchSubmitWithHistory : handleFormSubmit}
                  placeholder={placeholder}
                  wrapperClassName="w-full"
                  suggestions={[]}
                  recentSearches={recentSearches}
                  onRemoveRecentSearch={onRemoveRecentSearch}
                  onClearRecentSearches={onClearRecentSearches}
                  onAiSearchSubmit={handleAiSearchSubmitWithHistory}
                  isAiSearching={filterState.isAiSearching}
                  onCancelSearch={filterState.searchQuery ? handleClearSearchText : undefined}
                  autoFocus
                  aiButton={renderAiButton()}
                  hideSearchIcon={true}
              />
              {renderFilterButton()}
            </div>
          ) : (
            <>
              {/* --- DEFAULT HEADER VIEW (Mobile & Desktop Collapsed) --- */}
              {/* Left Section: Back, Search, Filter */}
              <div className="flex items-center gap-2 sm:gap-4 flex-1">
                  {onBack && (
                    <Button variant="overlay-dark" size="icon-sm" onClick={onBack} className="-ml-2 !rounded-xl" aria-label="Go back">
                      <ChevronLeftIcon className="w-6 h-6" />
                    </Button>
                  )}
                  <Button onClick={() => setIsSearchOpen(true)} variant="ghost" size="icon" className="text-gray-600" aria-label="Search">
                     <SearchIcon className="w-6 h-6" />
                  </Button>
                  {renderFilterButton()}
              </div>

              {/* Center Section: Logo & Nav */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="flex items-center justify-center gap-1">
                   <Logo onClick={handleLogoClick} />
                   <div className="relative" ref={navDropdownRef}>
                      <Button
                          onClick={() => setIsNavDropdownOpen(prev => !prev)}
                          variant="ghost"
                          size="icon-xs"
                          className="text-gray-400 rounded-full w-6 h-6"
                          aria-label="Open navigation menu"
                      >
                          <ChevronDownIcon className={cn("w-4 h-4 transition-transform duration-200", isNavDropdownOpen && "rotate-180")} strokeWidth={2.5} />
                      </Button>
                      {currentAccount && totalActivityCount > 0 && !isNavDropdownOpen && (
                        <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-1 ring-white" title={`${totalActivityCount} new activities`} />
                      )}
                      {isNavDropdownOpen && (
                           <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-auto bg-white rounded-xl border border-gray-100 z-50 p-1 animate-zoom-in origin-top">
                               <ul className="flex flex-col gap-0.5">
                               {navItems.map((item: any) => (
                                  <li key={item.id} className="list-none">
                                      <Button
                                          onClick={item.onClick}
                                          variant="ghost"
                                          className={cn(
                                              "w-full !justify-between px-3 py-2 h-auto rounded-lg text-sm font-semibold whitespace-nowrap",
                                              item.isActive ? "text-red-600 bg-red-50" : "text-gray-600"
                                          )}
                                      >
                                          <div className="flex items-center gap-3">
                                              {React.cloneElement(item.icon as React.ReactElement<any>, { isFilled: item.isActive, className: "w-5 h-5" })}
                                              {item.label}
                                          </div>
                                          {item.badgeCount > 0 && (
                                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                                                  {item.badgeCount > 9 ? '9+' : item.badgeCount}
                                              </span>
                                          )}
                                      </Button>
                                  </li>
                               ))}
                               </ul>
                           </div>
                      )}
                  </div>
                </div>
              </div>

              {/* Right Section: Tools & Account */}
              <div className="flex items-center gap-2 flex-1 justify-end">
                  
                  {showViewSelector && (
                      <div className="hidden sm:flex items-center bg-gray-100 rounded-xl p-0.5">
                           <Button onClick={() => { if (mainView === 'map') onMainViewChange('grid'); setGridView('default'); }} variant="ghost" size="icon-sm" className={cn("!rounded-lg", (mainView === 'grid' && gridView === 'default') ? "bg-red-100 text-red-600" : "text-gray-500")} aria-label="Default View" title="Default View" aria-pressed={mainView === 'grid' && gridView === 'default'}>
                               <PostCardIcon className="w-5 h-5" isFilled={mainView === 'grid' && gridView === 'default'} />
                           </Button>
                           <Button onClick={() => { if (mainView === 'map') onMainViewChange('grid'); setGridView('compact'); }} variant="ghost" size="icon-sm" className={cn("!rounded-lg", (mainView === 'grid' && gridView === 'compact') ? "bg-red-100 text-red-600" : "text-gray-500")} aria-label="Compact View" title="Compact View" aria-pressed={mainView === 'grid' && gridView === 'compact'}>
                               <Squares3X3Icon className="w-5 h-5" isFilled={mainView === 'grid' && gridView === 'compact'} />
                           </Button>
                      </div>
                  )}

                  {currentAccount && (
                      <div className="relative">
                          <Button 
                              onClick={() => {
                                  if (view === 'bag') {
                                      handleBack();
                                  } else {
                                      navigateTo('bag');
                                  }
                              }}
                              variant="ghost"
                              size="icon"
                              className={cn(
                                  "!rounded-xl text-gray-600",
                                  view === 'bag' && "text-red-600 bg-red-50"
                              )}
                              aria-label="Shopping Bag"
                          >
                              <ShoppingBagIcon className="w-6 h-6" isFilled={view === 'bag'} />
                              {bagCount > 0 && (
                                  <span className={cn(
                                      "absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold border-2 border-white",
                                      animateBagBadge ? "animate-badge-pop-in" : ""
                                  )}>
                                      {bagCount}
                                  </span>
                              )}
                          </Button>
                      </div>
                  )}

                  <div className="relative">
                       {currentAccount ? (
                          <Button
                              onClick={() => {
                                  if (isProfileActive) {
                                      handleBack();
                                  } else {
                                      navigateTo('account', { account: currentAccount });
                                  }
                              }}
                              variant="ghost"
                              size="icon"
                              className={cn(
                                  "!rounded-xl text-gray-600",
                                  isProfileActive && "text-red-600 bg-red-50"
                              )}
                              aria-label="My Profile"
                          >
                              <UserIcon className="w-6 h-6" isFilled={isProfileActive} />
                          </Button>
                      ) : (
                          <div className="flex items-center gap-2">
                              <Button onClick={() => openModal({ type: 'login' })} variant="pill-red" size="sm" className="px-4">Sign in</Button>
                          </div>
                      )}
                  </div>
              </div>
            </>
          )}
        </div>
      </header>
    </>
  );
};
