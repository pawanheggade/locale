

import React, { Suspense, useRef } from 'react';
import { Header } from './components/Header';
import { ViewRenderer } from './components/ViewRenderer';
import PullToRefreshIndicator from './components/PullToRefreshIndicator';
import { useUI } from './contexts/UIContext';
import ErrorBoundary from './components/ErrorBoundary';
import { AppModals } from './components/AppModals';
import { GuestPrompt } from './components/GuestPrompt';
import { cn } from './lib/utils';
import { OfflineIndicator } from './components/OfflineIndicator';
import { LoadingFallback } from './components/ui/LoadingFallback';
import { NavigationContext } from './contexts/NavigationContext';
import { useAppNavigation } from './hooks/useAppNavigation';
import { useAuth } from './contexts/AuthContext';
import { usePullToRefresh } from './hooks/usePullToRefresh';
import { GlobalLoadingIndicator } from './components/GlobalLoadingIndicator';

export const App: React.FC = () => {
  const { currentAccount } = useAuth(); // Still needed for GuestPrompt
  const { openModal } = useUI();
  
  const mainContentRef = useRef<HTMLDivElement>(null);
  
  const {
    navigationContextValue,
    isRefreshing,
    handleRefresh,
    isHeaderVisible,
    isScrolled,
    handleScroll,
    view,
    mainView,
    showBackButton,
    backAction,
  } = useAppNavigation({ mainContentRef });
  
  const {
    handleFindNearby,
    userLocation,
    handleEnableLocation,
    isFindingNearby,
  } = navigationContextValue;

  const { pullPosition, touchHandlers, isPulling, pullThreshold } = usePullToRefresh({ 
    onRefresh: handleRefresh, 
    mainContentRef, 
    isRefreshing, 
    disabled: !((view === 'all' && mainView === 'grid') || view === 'forums')
  });

  const viewRendererProps = {
    view, mainView, isInitialLoading: false,
  };

  const isFullWidthView = view === 'account';

  return (
    <NavigationContext.Provider value={navigationContextValue}>
      <GlobalLoadingIndicator />
      <div className="h-screen flex flex-col">
        <Header
          onSearchSubmit={navigationContextValue.handleSearchSubmit}
          recentSearches={navigationContextValue.recentSearches}
          onRemoveRecentSearch={navigationContextValue.handleRemoveRecentSearch}
          onClearRecentSearches={navigationContextValue.handleClearRecentSearches}
          onGoHome={navigationContextValue.handleGoHome}
          viewingAccount={navigationContextValue.viewingAccount}
          isScrolled={isScrolled}
          isVisible={isHeaderVisible}
          onBack={showBackButton ? backAction : undefined}
          view={view}
          mainView={mainView}
          onMainViewChange={navigationContextValue.handleMainViewChange}
        />
        <main
          ref={mainContentRef}
          onScroll={handleScroll}
          className={cn(
            'flex-1',
            (mainView === 'map' && view === 'all')
              ? 'overflow-hidden pt-16' // map is below header, no scroll
              : 'overflow-y-auto pt-16' // default for ALL other views
          )}
          {...touchHandlers}
        >
          {pullPosition > 0 && <PullToRefreshIndicator pullPosition={pullPosition} isRefreshing={isRefreshing} pullThreshold={pullThreshold} isPulling={isPulling} />}
          <div
            style={{
              transform: `translateY(${pullPosition}px)`,
              transition: !isPulling ? 'transform 0.3s ease-out' : 'none',
            }}
            className="h-full"
          >
            <div className={cn(
              'relative z-0 w-full', 
              (mainView === 'map') && 'h-full',
              !(mainView === 'map' || isFullWidthView) && 'p-4 sm:p-6 lg:p-8'
            )}>
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <ViewRenderer {...viewRendererProps} />
                </Suspense>
              </ErrorBoundary>
            </div>
          </div>
        </main>
        
        <AppModals 
          isFindingNearby={isFindingNearby}
          handleFindNearby={handleFindNearby}
          userLocation={userLocation}
          onEnableLocation={handleEnableLocation}
        />
        
        <OfflineIndicator />
        
        {!currentAccount && view === 'all' && (
          <GuestPrompt 
              onSignIn={() => openModal({ type: 'login' })}
              onCreateAccount={() => openModal({ type: 'createAccount' })}
          />
        )}
      </div>
    </NavigationContext.Provider>
  );
};