


import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useClickOutside } from './useClickOutside';

/**
 * Manages keyboard navigation (up, down, enter, escape) for a list of suggestions.
 * @param itemCount The number of items in the suggestion list.
 * @param onSelect Callback fired with the selected index when Enter is pressed.
 * @param onClose Callback fired when Escape is pressed.
 * @param isOpen Boolean indicating if the suggestion list is visible.
 */
export const useSuggestionKeyboardNav = (
  itemCount: number,
  onSelect: (index: number) => void,
  onClose: () => void,
  isOpen: boolean
) => {
  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);

  // Reset index when items change or dropdown visibility changes
  useEffect(() => {
    setActiveIndex(-1);
  }, [itemCount, isOpen]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeItem = listRef.current.children[activeIndex] as HTMLElement;
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || itemCount === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex(prev => (prev < itemCount - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex(prev => (prev > 0 ? prev - 1 : itemCount - 1));
          break;
        case 'Enter':
          if (activeIndex > -1) {
            e.preventDefault();
            onSelect(activeIndex);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [isOpen, itemCount, activeIndex, onSelect, onClose]
  );

  return { activeIndex, setActiveIndex, listRef, handleKeyDown };
};


interface UseSearchSuggestionsProps {
  searchQuery: string;
  suggestions: string[];
  recentSearches: string[];
  isAiSearchEnabled: boolean;
  onSelectSuggestion: (suggestion: string) => void;
}

export const useSearchSuggestions = ({
  searchQuery,
  suggestions,
  recentSearches,
  isAiSearchEnabled,
  onSelectSuggestion,
}: UseSearchSuggestionsProps) => {
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const shouldShowRecent = isFocused && !isAiSearchEnabled && searchQuery.length === 0 && recentSearches.length > 0;
  const shouldShowSuggestions = isFocused && !isAiSearchEnabled && searchQuery.length > 0 && filteredSuggestions.length > 0;
  
  const isDropdownVisible = shouldShowRecent || shouldShowSuggestions;
  const currentSuggestions = shouldShowRecent ? recentSearches : filteredSuggestions;

  const { activeIndex, setActiveIndex, listRef, handleKeyDown } = useSuggestionKeyboardNav(
    currentSuggestions.length,
    (index) => {
      onSelectSuggestion(currentSuggestions[index]);
      setIsFocused(false);
    },
    () => setIsFocused(false),
    isDropdownVisible
  );

  useClickOutside(wrapperRef, () => {
      setIsFocused(false);
  });

  useEffect(() => {
    if (searchQuery) {
      setFilteredSuggestions(suggestions.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 7));
    } else {
      setFilteredSuggestions([]);
    }
  }, [searchQuery, suggestions]);
  
  const handleSuggestionClick = (suggestion: string) => {
    onSelectSuggestion(suggestion);
    setIsFocused(false);
  };

  return {
    isDropdownVisible,
    shouldShowRecent,
    shouldShowSuggestions,
    isFocused,
    filteredSuggestions,
    activeIndex,
    wrapperRef,
    listRef,
    inputProps: {
      onFocus: () => setIsFocused(true),
      onKeyDown: handleKeyDown,
    },
    setActiveIndex,
    handleSuggestionClick,
  };
};