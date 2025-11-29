import React, { useState, useEffect, useMemo, useRef } from 'react';
import SearchBar from './SearchBar';
import { ChevronLeftIcon, FunnelIcon, ChatBubbleEllipsisIcon, SearchIcon } from './Icons';
import { Account } from '../types';
import { AccountMenu } from './AccountMenu';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { useClickOutside } from '../hooks/useClickOutside';
import { Logo } from './Logo';
import { useNavigation } from '../contexts/NavigationContext';
import { useFilters } from '../contexts/FiltersContext';

interface HeaderProps {
  gridView: 'default' | 'compact';
  onGridViewChange: (view: 'default' | 'compact') => void;
  onRefresh: () => void;
  bagCount: number;
  unreadNotificationsCount: number;
  currentAccount: Account | null;
  onOpenLoginModal: () => void;
  onOpenCreateAccountModal: () => void;
  isScrolled: boolean;
  isVisible: boolean;
}

const HeaderComponent: React.FC<HeaderProps> = ({ 
  gridView,
  onGridViewChange,
  onRefresh,
  bagCount,
  unreadNotificationsCount,
  currentAccount,
  onOpenLoginModal,
  onOpenCreateAccountModal,
  isScrolled,
  isVisible,
}) => {
  const { view, mainView, navigateTo, handleBack, handleMainViewChange, history } = useNavigation();
  const { filterState, dispatchFilterAction, handleAiSearchSubmit, handleToggleAiSearch, isAnyFilterActive, onClearFilters } = useFilters();
  const { searchQuery, isAiSearchEnabled, isAiSearching } = filterState;
  
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
  
  const handleGoHome = () => {
      navigateTo('all');
      onClearFilters();
  };
    
  const placeholder = useMemo(() => {
    if (isAiSearchEnabled) return 'Ask AI anything...';
    return 'Search products, services, events...';
  }, [isAiSearchEnabled]);

  const onBack = (view === 'all' && isAnyFilterActive) || history.length > 0 ? handleBack : undefined;

  const renderFilterButton = (className?: string) => (
    <Button 
        onClick={() => { /* Handled by openModal in App */ }}
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
      <div className={`px-2 sm:px-6 flex sm:grid sm:grid-cols-[auto_1fr_auto] items-center justify-between sm:justify-start gap-0 sm:gap-6 md:gap-8 transition-all duration-300 ${isScrolled ? 'h-14' : 'h-16'}`}>
        
        <div className="flex items-center gap-2 shrink-0">
            {onBack && (
              <Button variant="overlay-dark" size="icon-sm" onClick={onBack} className="-ml-2 !rounded-xl" aria-label="Go back">
                <ChevronLeftIcon className="w-6 h-6" />
              </Button>
            )}
            <Logo onClick={handleGoHome} />
        </div>
        
        <div className="hidden sm:flex flex-1 justify-center min-w-0 sm:col-start-2">
            <div className="w-full flex items-center gap-1">
                <SearchBar 
                    searchQuery={searchQuery}
                    onSearchChange={(q) => dispatchFilterAction({ type: 'SET_SEARCH_QUERY', payload: q })}
                    onSearchSubmit={() => {}} // Simplified, handled by hook
                    placeholder={placeholder}
                    wrapperClassName="flex-1 min-w-0"
                    isAiSearchEnabled={isAiSearchEnabled}
                    onToggleAiSearch={handleToggleAiSearch}
                    onAiSearchSubmit={handleAiSearchSubmit}
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
                onClick={() => view === 'forums' ? navigateTo('all') : navigateTo('forums')}
                variant="overlay-dark"
                size="icon"
                className={cn( "shrink-0 transition-colors !rounded-xl", view === 'forums' && "text-red-600" )}
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
                        gridView={gridView}
                        onGridViewChange={onGridViewChange}
                        bagCount={bagCount}
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
                  onSearchChange={(q) => dispatchFilterAction({ type: 'SET_SEARCH_QUERY', payload: q })}
                  onSearchSubmit={() => setIsMobileSearchOpen(false)}
                  placeholder={isAiSearchEnabled ? "Ask AI anything..." : "Search products, services, events..."}
                  wrapperClassName="w-full"
                  isAiSearchEnabled={isAiSearchEnabled}
                  onToggleAiSearch={handleToggleAiSearch}
                  onAiSearchSubmit={handleAiSearchSubmit}
                  isAiSearching={isAiSearching}
                  autoFocus={true}
              />
          </div>
      )}
    </header>
  );
};

export const Header = React.memo(HeaderComponent);