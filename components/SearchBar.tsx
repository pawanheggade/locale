import React from 'react';
import { SearchIcon, SpinnerIcon, ClockIcon, XMarkIcon, AIIcon } from './Icons';
import { useSearchSuggestions } from '../hooks/useSearchSuggestions';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (query: string) => void;
  placeholder: string;
  wrapperClassName?: string;
  suggestions?: string[];
  recentSearches?: string[];
  onRemoveRecentSearch?: (query: string) => void;
  onClearRecentSearches?: () => void;
  onAiSearchSubmit: (query: string) => void;
  isAiSearching?: boolean;
  onCancelSearch?: () => void;
  autoFocus?: boolean;
  aiButton?: React.ReactNode;
  filterButton?: React.ReactNode;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  placeholder,
  wrapperClassName,
  suggestions = [],
  recentSearches = [],
  onRemoveRecentSearch,
  onClearRecentSearches,
  onAiSearchSubmit,
  isAiSearching,
  onCancelSearch,
  autoFocus = false,
  aiButton,
  filterButton,
}) => {

  const {
    isDropdownVisible,
    shouldShowRecent,
    shouldShowSuggestions,
    shouldShowAiSuggestions,
    filteredSuggestions,
    aiSuggestions,
    isFetchingAiSuggestions,
    activeIndex,
    wrapperRef,
    listRef,
    inputProps,
    setActiveIndex,
    handleSuggestionClick,
  } = useSearchSuggestions({
    searchQuery,
    suggestions,
    recentSearches,
    isAiSearchEnabled: false, // AI enabled state is now managed externally
    onSelectSuggestion: onSearchChange,
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If Enter is pressed...
    if (e.key === 'Enter') {
      // And a suggestion is active...
      if (activeIndex > -1 && isDropdownVisible) {
        // Let the hook handle it to select the suggestion.
        inputProps.onKeyDown(e);
        const selectedSuggestion = (shouldShowRecent ? recentSearches : (shouldShowSuggestions ? filteredSuggestions : aiSuggestions))[activeIndex];
        onSearchSubmit(selectedSuggestion);
        return;
      }

      // Otherwise, treat it as a search submission.
      e.preventDefault();
      const query = searchQuery.trim();

      if (query) {
        onSearchSubmit(query);
      }

      // Blur the input to close any potential dropdown and signify submission.
      (e.target as HTMLInputElement).blur();
      return; // Stop further processing
    }
    
    // For other keys (like arrows), let the hook handle it.
    inputProps.onKeyDown(e);
  };


  const handleRemoveRecent = (e: React.MouseEvent, query: string) => {
    e.stopPropagation();
    onRemoveRecentSearch?.(query);
  };
  
  const showClearButton = onCancelSearch && searchQuery;

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClearRecentSearches?.();
  };

  return (
    <div className={cn('relative', wrapperClassName)} ref={wrapperRef}>
        <div className={cn(
            "relative flex items-center w-full h-10 bg-gray-100 border border-gray-200/80 rounded-xl transition-all duration-200",
            "focus-within:bg-white focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/50"
        )}>
            <div className="pl-4 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
                id="global-search-bar"
                type="search"
                placeholder={placeholder}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={inputProps.onFocus}
                onKeyDown={handleKeyDown}
                autoFocus={autoFocus} 
                className="block w-full h-full bg-transparent border-0 pl-2 text-sm text-gray-900 placeholder-gray-600 focus:ring-0 focus:outline-none truncate"
                autoComplete="off"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={isDropdownVisible}
                aria-controls="suggestions-listbox"
                aria-activedescendant={activeIndex > -1 ? `suggestion-${activeIndex}` : undefined}
            />
            <div className="pr-1 flex items-center flex-shrink-0 h-full gap-1">
                {isAiSearching && (
                    <SpinnerIcon className="h-5 w-5 text-gray-400" />
                )}
                
                {onCancelSearch && (
                  <Button
                      type="button"
                      onClick={onCancelSearch}
                      variant="ghost"
                      size="icon-sm"
                      className="text-gray-500 rounded-xl"
                      aria-label={searchQuery ? "Clear search" : "Close search"}
                  >
                      <XMarkIcon className="w-5 h-5" />
                  </Button>
                )}
                
                {aiButton}
                {filterButton}
            </div>
        </div>
      {isDropdownVisible && (
        <ul ref={listRef} id="suggestions-listbox" role="listbox" className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg max-h-80 overflow-y-auto z-10 animate-fade-in-down">
          {shouldShowRecent && (
            <>
              <li className="px-4 pt-3 pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Recent Searches</li>
              {recentSearches.map((search, index) => (
                <li
                  id={`suggestion-${index}`}
                  key={search}
                  role="option"
                  aria-selected={index === activeIndex}
                  onClick={() => {
                      handleSuggestionClick(search);
                      onSearchSubmit(search);
                  }}
                  className={`flex items-center justify-between text-sm text-gray-600 cursor-pointer transition-colors ${
                    index === activeIndex ? 'bg-red-500 text-white' : 'active:bg-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 px-4 py-2 flex-1">
                    <ClockIcon className={`w-4 h-4 ${index === activeIndex ? 'text-white' : 'text-gray-400'}`} />
                    <span>{search}</span>
                  </div>
                  <Button variant="overlay-dark" size="icon-sm" onClick={(e) => handleRemoveRecent(e, search)} aria-label={`Remove "${search}" from recent searches`} title="Remove">
                      <XMarkIcon className="w-4 h-4"/>
                  </Button>
                </li>
              ))}
              <li className="border-t border-gray-100 px-4 py-2 text-center">
                <Button variant="link" size="sm" onClick={handleClearAll} className="text-red-600 text-xs font-semibold">Clear All Searches</Button>
              </li>
            </>
          )}
          {shouldShowSuggestions && (
             filteredSuggestions.map((suggestion, index) => {
              const matchIndex = suggestion.toLowerCase().indexOf(searchQuery.toLowerCase());
              const before = suggestion.slice(0, matchIndex);
              const match = suggestion.slice(matchIndex, matchIndex + searchQuery.length);
              const after = suggestion.slice(matchIndex + searchQuery.length);
              return (
                <li
                  id={`suggestion-${index}`}
                  key={suggestion}
                  role="option"
                  aria-selected={index === activeIndex}
                  onClick={() => {
                    handleSuggestionClick(suggestion)
                    onSearchSubmit(suggestion);
                  }}
                  className={`px-4 py-2 text-sm text-gray-600 cursor-pointer transition-colors ${
                    index === activeIndex ? 'bg-red-500 text-white' : 'active:bg-gray-200'
                  }`}
                >
                  {before}
                  <strong className={index === activeIndex ? 'text-white' : 'text-gray-900'}>
                      {match}
                  </strong>
                  {after}
                </li>
              );
            })
          )}
          {shouldShowAiSuggestions && (
            <>
              <li className="px-4 pt-3 pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                <AIIcon className="w-4 h-4 text-red-500" />
                AI Suggestions
              </li>
              {isFetchingAiSuggestions && (
                <li className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600">
                    <SpinnerIcon className="w-4 h-4" />
                    <span>Generating ideas...</span>
                </li>
              )}
              {!isFetchingAiSuggestions && aiSuggestions.length === 0 && (
                <li className="px-4 py-2 text-sm text-gray-600">No suggestions found. Keep typing...</li>
              )}
              {aiSuggestions.map((suggestion, index) => (
                <li
                  id={`suggestion-${index}`}
                  key={suggestion}
                  role="option"
                  aria-selected={index === activeIndex}
                  onClick={() => {
                    handleSuggestionClick(suggestion)
                    onSearchSubmit(suggestion);
                  }}
                  className={`px-4 py-2 text-sm text-gray-600 cursor-pointer transition-colors ${
                    index === activeIndex ? 'bg-red-500 text-white' : 'active:bg-gray-200'
                  }`}
                >
                  {suggestion}
                </li>
              ))}
            </>
          )}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;