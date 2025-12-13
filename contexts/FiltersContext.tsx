



import React, { createContext, useReducer, useContext, useMemo, useCallback, useEffect } from 'react';
import { PostType, FilterAction, FiltersState, SavedSearchFilters } from '../types';
import { performAiSearch } from '../utils/gemini';
import { usePosts } from './PostsContext';
import { STORAGE_KEYS } from '../lib/constants';

export const initialFiltersState: FiltersState = {
  searchQuery: '',
  filterType: 'all',
  filterCategory: 'all',
  sortOption: 'relevance-desc',
  minPrice: '',
  maxPrice: '',
  filterTags: [],
  filterExpiringSoon: false,
  filterShowExpired: false,
  filterLast7Days: false,
  filterDistance: 0,
  isAiSearchEnabled: false,
  isAiSearching: false,
  aiSmartFilterResults: null,
  filterOnSale: false,
};

const filtersReducer = (state: FiltersState, action: FilterAction): FiltersState => {
  switch (action.type) {
    case 'SET_SEARCH_QUERY': return { ...state, searchQuery: action.payload };
    case 'SET_FILTER_TYPE': return { ...state, filterType: action.payload };
    case 'SET_FILTER_CATEGORY': return { ...state, filterCategory: action.payload };
    case 'SET_SORT_OPTION': return { ...state, sortOption: action.payload };
    case 'SET_MIN_PRICE': return { ...state, minPrice: action.payload };
    case 'SET_MAX_PRICE': return { ...state, maxPrice: action.payload };
    case 'SET_FILTER_TAGS': return { ...state, filterTags: action.payload };
    case 'SET_FILTER_EXPIRING_SOON': return { ...state, filterExpiringSoon: action.payload };
    case 'SET_FILTER_SHOW_EXPIRED': return { ...state, filterShowExpired: action.payload };
    case 'SET_FILTER_LAST_7_DAYS': return { ...state, filterLast7Days: action.payload };
    case 'SET_FILTER_DISTANCE': return { ...state, filterDistance: action.payload };
    case 'SET_AI_SEARCH_ENABLED': return { ...state, isAiSearchEnabled: action.payload };
    case 'SET_AI_SEARCHING': return { ...state, isAiSearching: action.payload };
    case 'SET_AI_RESULTS': return { ...state, aiSmartFilterResults: action.payload };
    case 'SET_FILTER_ON_SALE': return { ...state, filterOnSale: action.payload };
    case 'SET_ALL_FILTERS':
        return action.payload;
    case 'SET_FILTERS_FROM_SAVED':
      return {
        ...state,
        searchQuery: action.payload.searchQuery,
        filterType: action.payload.filterType,
        filterCategory: action.payload.filterCategory,
        sortOption: action.payload.sortOption,
        minPrice: action.payload.minPrice,
        maxPrice: action.payload.maxPrice,
        filterTags: action.payload.filterTags,
        filterOnSale: action.payload.filterOnSale ?? false,
        filterExpiringSoon: initialFiltersState.filterExpiringSoon,
        filterShowExpired: initialFiltersState.filterShowExpired,
        filterLast7Days: initialFiltersState.filterLast7Days,
        filterDistance: initialFiltersState.filterDistance,
        aiSmartFilterResults: initialFiltersState.aiSmartFilterResults,
      };
    case 'CLEAR_FILTERS': return {
      ...initialFiltersState,
      isAiSearchEnabled: state.isAiSearchEnabled
    };
    default:
      return state;
  }
};

const initFilters = (defaultState: FiltersState): FiltersState => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.FILTERS);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with default state to ensure compatibility and reset transient fields
      return {
        ...defaultState,
        ...parsed,
        isAiSearching: false,
        aiSmartFilterResults: null,
        isAiSearchEnabled: false,
      };
    }
  } catch (error) {
    console.error('Failed to load filters from storage:', error);
  }
  return defaultState;
};

interface FiltersContextType {
  filterState: FiltersState;
  dispatchFilterAction: React.Dispatch<FilterAction>;
  isAnyFilterActive: boolean;
  handleAiSearchSubmit: (query: string) => Promise<void>;
  handleToggleAiSearch: () => void;
  onClearFilters: () => void;
}

const FiltersContext = createContext<FiltersContextType | undefined>(undefined);

export const FiltersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filterState, dispatchFilterAction] = useReducer(filtersReducer, initialFiltersState, initFilters);
  const { posts } = usePosts();

  // Persist filters to local storage whenever they change
  useEffect(() => {
    const { isAiSearching, isAiSearchEnabled, aiSmartFilterResults, ...persistentState } = filterState;
    try {
      window.localStorage.setItem(STORAGE_KEYS.FILTERS, JSON.stringify(persistentState));
    } catch (e) {
      console.error("Failed to save filters to storage:", e);
    }
  }, [filterState]);

  useEffect(() => {
    // When in AI search mode, if the user clears the search box, also clear the AI results.
    if (filterState.isAiSearchEnabled && !filterState.searchQuery.trim() && filterState.aiSmartFilterResults) {
      dispatchFilterAction({ type: 'SET_AI_RESULTS', payload: null });
    }
  }, [filterState.isAiSearchEnabled, filterState.searchQuery, filterState.aiSmartFilterResults]);

  const handleAiSearchSubmit = useCallback(async (query: string) => {
    if (!query.trim()) {
      dispatchFilterAction({ type: 'SET_AI_RESULTS', payload: null });
      return;
    }
    dispatchFilterAction({ type: 'SET_AI_SEARCHING', payload: true });
    dispatchFilterAction({ type: 'SET_AI_RESULTS', payload: null });
    try {
      const results = await performAiSearch(query, posts);
      dispatchFilterAction({ type: 'SET_AI_RESULTS', payload: results });
    } catch (error) {
      console.error(error);
      dispatchFilterAction({ type: 'SET_AI_RESULTS', payload: [] });
    } finally {
      dispatchFilterAction({ type: 'SET_AI_SEARCHING', payload: false });
    }
  }, [posts]);

  const handleToggleAiSearch = useCallback(() => {
    const isTurningOff = filterState.isAiSearchEnabled;
    if (isTurningOff) {
      dispatchFilterAction({ type: 'SET_AI_RESULTS', payload: null });
    }
    dispatchFilterAction({ type: 'SET_AI_SEARCH_ENABLED', payload: !isTurningOff });
  }, [filterState.isAiSearchEnabled]);

  const onClearFilters = useCallback(() => {
    dispatchFilterAction({ type: 'CLEAR_FILTERS' });
  }, []);

  const isAnyFilterActive = useMemo(() => {
    return (
        filterState.sortOption !== 'relevance-desc' ||
        filterState.searchQuery.trim() !== '' ||
        filterState.filterType !== 'all' ||
        filterState.filterCategory !== 'all' ||
        filterState.minPrice !== '' ||
        filterState.maxPrice !== '' ||
        filterState.filterTags.length > 0 ||
        (filterState.isAiSearchEnabled && filterState.aiSmartFilterResults !== null) ||
        filterState.filterExpiringSoon ||
        filterState.filterShowExpired ||
        filterState.filterLast7Days ||
        filterState.filterDistance > 0 ||
        filterState.filterOnSale
    );
  }, [filterState]);

  const value = useMemo(() => ({
    filterState,
    dispatchFilterAction,
    isAnyFilterActive,
    handleAiSearchSubmit,
    handleToggleAiSearch,
    onClearFilters,
  }), [filterState, isAnyFilterActive, handleAiSearchSubmit, handleToggleAiSearch, onClearFilters]);

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
};

export const useFilters = () => {
  const context = useContext(FiltersContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FiltersProvider');
  }
  return context;
};