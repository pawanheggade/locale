

import React from 'react';
import { SearchIcon, SpinnerIcon, ClockIcon, XMarkIcon, AIIcon } from './Icons';
import { useSearchSuggestions } from '../hooks/useSearchSuggestions';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { useFilters } from '../contexts/FiltersContext';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (query: string) => void;
  placeholder: string;
  wrapperClassName?: string;
  recentSearches?: string[];
  onRemoveRecentSearch?: (query: string) => void;
  onClearRecentSearches?: () => void;
  onAiSearchSubmit: (query: string) => void;
  isAiSearching?: boolean;
  onCancelSearch?: () => void;
  autoFocus?: boolean;
  aiButton?: React.ReactNode;
  hideSearchIcon?: boolean;
  leftAccessory?: React.ReactNode;
}

const aiExamplePrompts = [
    "vintage chairs in Mumbai",
    "weekend workshops near me",
    "handmade decor for living room",
];

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  placeholder,
  wrapperClassName,
  recentSearches = [],
  onRemoveRecentSearch,
  onClearRecentSearches,
  onAiSearchSubmit,
  isAiSearching,
  onCancelSearch,
  autoFocus = false,
  aiButton,
  hideSearchIcon = false,
  leftAccessory,
}) => {
  const { filterState } = useFilters();

  const {
    isDropdownVisible,
    shouldShowRecent,
    shouldShowSuggestions,
    isFocused,
    filteredSuggestions,
    activeIndex,
    wrapperRef,
    listRef,
    inputProps,
    handleSuggestionClick,
  } = useSearchSuggestions({
    searchQuery,
    suggestions: [],
    recentSearches,
    isAiSearchEnabled: filterState.isAiSearchEnabled,
    onSelectSuggestion: onSearchChange,
  });
  
  const shouldShowAiExamples = isFocused && filterState.isAiSearchEnabled && searchQuery.length === 0;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const currentSuggestions = shouldShowRecent ? recentSearches : filteredSuggestions;
      if (activeIndex > -1 && isDropdownVisible) {
        inputProps.onKeyDown(e);
        const selectedSuggestion = (shouldShowAiExamples ? aiExamplePrompts : currentSuggestions)[activeIndex];
        onSearchSubmit(selectedSuggestion);
        return;
      }
      e.preventDefault();
      if (searchQuery.trim()) {
        onSearchSubmit(searchQuery.trim());
      }
      (e.target as HTMLInputElement).blur();
      return;
    }
    inputProps.onKeyDown(e);
  };


  const handleRemoveRecent = (e: React.MouseEvent, query: string) => {
    e.stopPropagation();
    onRemoveRecentSearch?.(query);
  };
  
  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClearRecentSearches?.();
  };

  const currentDropdownVisible = isDropdownVisible || shouldShowAiExamples;

  return (
    <div className={cn('relative', wrapperClassName)} ref={wrapperRef}>
        <div className={cn(
            "relative flex items-center w-full h-10 bg-gray-50 border border-gray-300/80 rounded-xl",
            "focus-within:bg-white focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/50"
        )}>
            {leftAccessory ? (
                <div className="pl-1 shrink-0">{leftAccessory}</div>
            ) : !hideSearchIcon ? (
              <div className="pl-4 flex items-center pointer-events-none shrink-0">
                  <SearchIcon className="h-5 w-5 text-gray-600" aria-hidden="true" />
              </div>
            ) : null }
            <input
                id="global-search-bar"
                type="search"
                placeholder={placeholder}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={inputProps.onFocus}
                onKeyDown={handleKeyDown}
                autoFocus={autoFocus} 
                className={cn("block w-full h-full bg-transparent border-0 text-sm text-gray-900 placeholder-gray-600 focus:ring-0 focus:outline-none truncate",
                    (leftAccessory || !hideSearchIcon) ? 'pl-2' : 'pl-4'
                )}
                autoComplete="off"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={currentDropdownVisible}
                aria-controls="suggestions-listbox"
                aria-activedescendant={activeIndex > -1 ? `suggestion-${activeIndex}` : undefined}
            />
            <div className="pr-1 flex items-center flex-shrink-0 h-full gap-1">
                {isAiSearching && (
                    <div className="flex items-center gap-1 text-gray-600 text-sm">
                        <SpinnerIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">AI is thinking...</span>
                    </div>
                )}
                
                {onCancelSearch && (
                  <Button
                      type="button"
                      onClick={onCancelSearch}
                      variant="ghost"
                      size="icon-sm"
                      className="text-gray-600 rounded-xl"
                      aria-label={searchQuery ? "Clear search" : "Close search"}
                  >
                      <XMarkIcon className="w-5 h-5" />
                  </Button>
                )}
                
                {aiButton}
            </div>
        </div>
      {currentDropdownVisible && (
        <ul ref={listRef} id="suggestions-listbox" role="listbox" className="absolute top-full mt-2 w-full bg-white border border-gray-300 rounded-lg max-h-80 overflow-y-auto z-10 animate-fade-in-down">
          {shouldShowAiExamples && (
            <>
              <li className="px-4 pt-3 pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                <AIIcon className="w-4 h-4 text-red-500" />
                Try asking...
              </li>
              {aiExamplePrompts.map((prompt, index) => (
                 <li
                    id={`suggestion-${index}`}
                    key={prompt}
                    role="option"
                    aria-selected={index === activeIndex}
                    onClick={() => {
                        handleSuggestionClick(prompt);
                        onSearchSubmit(prompt);
                    }}
                    className={`px-4 py-2 text-sm text-gray-600 cursor-pointer ${
                        index === activeIndex ? 'bg-red-500 text-white' : 'active:bg-gray-300'
                    }`}
                >
                  "{prompt}"
                </li>
              ))}
            </>
          )}
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
                  className={`flex items-center justify-between text-sm text-gray-600 cursor-pointer ${
                    index === activeIndex ? 'bg-red-500 text-white' : 'active:bg-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 px-4 py-2 flex-1">
                    <ClockIcon className={`w-4 h-4 ${index === activeIndex ? 'text-white' : 'text-gray-600'}`} />
                    <span>{search}</span>
                  </div>
                  <Button variant="overlay-dark" size="icon-sm" onClick={(e) => handleRemoveRecent(e, search)} aria-label={`Remove "${search}" from recent searches`} title="Remove">
                      <XMarkIcon className="w-4 h-4"/>
                  </Button>
                </li>
              ))}
              {onClearRecentSearches && (
                <li className="border-t border-gray-50 px-4 py-2 text-center">
                    <Button variant="link" size="sm" onClick={handleClearAll} className="text-red-600 text-xs font-semibold">Clear All Searches</Button>
                </li>
              )}
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
                  className={`px-4 py-2 text-sm text-gray-600 cursor-pointer ${
                    index === activeIndex ? 'bg-red-500 text-white' : 'active:bg-gray-300'
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
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
