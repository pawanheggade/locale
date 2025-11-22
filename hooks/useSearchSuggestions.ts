import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDebounce } from './useDebounce';
import { generateSearchSuggestions } from '../utils/gemini';

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
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isFetchingAiSuggestions, setIsFetchingAiSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(searchQuery, 300);

  const shouldShowRecent = isFocused && !isAiSearchEnabled && searchQuery.length === 0 && recentSearches.length > 0;
  const shouldShowSuggestions = isFocused && !isAiSearchEnabled && searchQuery.length > 0 && filteredSuggestions.length > 0;
  const shouldShowAiSuggestions = isFocused && isAiSearchEnabled && searchQuery.length > 1;

  const isDropdownVisible = shouldShowRecent || shouldShowSuggestions || shouldShowAiSuggestions;
  const currentSuggestions = shouldShowRecent ? recentSearches : (shouldShowSuggestions ? filteredSuggestions : aiSuggestions);

  const { activeIndex, setActiveIndex, listRef, handleKeyDown } = useSuggestionKeyboardNav(
    currentSuggestions.length,
    (index) => {
      onSelectSuggestion(currentSuggestions[index]);
      setIsFocused(false);
    },
    () => setIsFocused(false),
    isDropdownVisible
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      
      const scoredAndFiltered = suggestions
        .map((suggestion, index) => {
          const lowercasedSuggestion = suggestion.toLowerCase();
          let matchScore = 0;

          if (lowercasedSuggestion.includes(lowercasedQuery)) {
            matchScore = 100;
            if (lowercasedSuggestion.startsWith(lowercasedQuery)) matchScore = 500;
            if (lowercasedSuggestion === lowercasedQuery) matchScore = 1000;
          } else {
            return null;
          }

          const relevanceScore = suggestions.length - index;
          const finalScore = matchScore + relevanceScore;

          return { suggestion, score: finalScore };
        })
        .filter((item): item is { suggestion: string; score: number } => item !== null);

      scoredAndFiltered.sort((a, b) => b.score - a.score);
      const finalSuggestions = scoredAndFiltered.map(item => item.suggestion);

      setFilteredSuggestions(finalSuggestions.slice(0, 7));
    } else {
      setFilteredSuggestions([]);
    }
  }, [searchQuery, suggestions]);

  useEffect(() => {
    if (isAiSearchEnabled && debouncedQuery.trim().length > 1) {
      const fetchAiSuggestions = async () => {
        setIsFetchingAiSuggestions(true);
        const newSuggestions = await generateSearchSuggestions(debouncedQuery);
        // Only update if the query hasn't changed, to prevent race conditions
        if (debouncedQuery === searchQuery) {
            setAiSuggestions(newSuggestions);
        }
        setIsFetchingAiSuggestions(false);
      };
      fetchAiSuggestions();
    } else {
      setAiSuggestions([]);
    }
  }, [debouncedQuery, isAiSearchEnabled, searchQuery]);
  
  const handleSuggestionClick = (suggestion: string) => {
    onSelectSuggestion(suggestion);
    setIsFocused(false);
  };

  return {
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
    inputProps: {
      onFocus: () => setIsFocused(true),
      onKeyDown: handleKeyDown,
    },
    setActiveIndex,
    handleSuggestionClick,
  };
};