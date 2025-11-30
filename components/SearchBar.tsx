
import React from 'react';
import { SearchIcon, SpinnerIcon, ClockIcon, XMarkIcon, SparklesIcon } from './Icons';
import { useSearchSuggestions } from '../hooks/useSearchSuggestions';
import { Button } from './ui/Button';

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
  isAiSearchEnabled?: boolean;
  onToggleAiSearch?: () => void;
  onAiSearchSubmit: (query: string) => void;
  isAiSearching?: boolean;
  autoFocus?: boolean;
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
  isAiSearchEnabled,
  onToggleAiSearch,
  onAiSearchSubmit,
  isAiSearching,
  autoFocus = false,
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
    isAiSearchEnabled: !!isAiSearchEnabled,
    onSelectSuggestion: onSearchChange,
    onError: (error) => {
        // Silent fail
    }
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
        if (isAiSearchEnabled && onAiSearchSubmit) {
          onAiSearchSubmit(query);
        } else if (!isAiSearchEnabled && onSearchSubmit) {
          onSearchSubmit(query);
        }
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
  
  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClearRecentSearches?.();
  };

  return (
    <div className={`relative ${wrapperClassName}`} ref={wrapperRef}>
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
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
        // Reduced right padding as filter button is removed. Changed py-3 to h-10 for consistent 40px height with buttons.
        className="block w-full h-10 bg-gray-100 border border-gray-200/80 rounded-full pl-11 pr-20 text-sm text-gray-900 placeholder-gray-600 focus:bg-white focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all duration-200 truncate"
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isDropdownVisible}
        aria-controls="suggestions-listbox"
        aria-activedescendant={activeIndex > -1 ? `suggestion-${activeIndex}` : undefined}
      />
      <div className="absolute inset-y-0 right-0 pr-2 sm:pr-2.5 flex items-center space-x-1 sm:space-x-1.5">
        {isAiSearching && (
            <SpinnerIcon className="h-5 w-5 text-gray-400" />
        )}
        
        {onToggleAiSearch && (
            <Button
                onClick={onToggleAiSearch}
                variant={isAiSearchEnabled ? 'pill-red' : 'outline'}
                size="icon-sm"
                className="text-xs font-bold uppercase tracking-wider"
                aria-label={isAiSearchEnabled ? 'Disable AI Search' : 'Enable AI Search'}
                title={isAiSearchEnabled ? 'Disable AI Search' : 'Enable AI Search'}
                aria-pressed={!!isAiSearchEnabled}
            >
                ai
            </Button>
        )}
      </div>
      {isDropdownVisible && (
        <ul ref={listRef} id="suggestions-listbox" role="listbox" className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg max-h-80 overflow-y-auto z-10 animate-fade-in-up">
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
                <SparklesIcon className="w-4 h-4 text-red-500" />
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
