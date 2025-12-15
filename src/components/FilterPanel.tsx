
import React, { useState, useRef, useMemo } from 'react';
import { PostType, PostCategory, Account } from '../types';
import { XCircleIcon, StarIcon, MapPinIcon } from './Icons';
import ModalShell from './ModalShell';
import { FilterSection } from './FilterSection';
import { useFilters } from '../contexts/FiltersContext';
import { usePosts } from '../contexts/PostsContext';
import { useUI } from '../contexts/UIContext';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { MultiSelectDropdown } from './ui/MultiSelectDropdown';
import { cn } from '../lib/utils';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isLocationAvailable: boolean;
  savedSearchesCount: number;
  onOpenFindNearbyModal: () => void;
  isFindingNearby: boolean;
  currentAccount: Account | null;
  onEnableLocation: () => Promise<void>;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  isOpen,
  onClose,
  isLocationAvailable,
  savedSearchesCount,
  onOpenFindNearbyModal,
  isFindingNearby,
  currentAccount,
  onEnableLocation,
}) => {
  const { filterState, dispatchFilterAction, onClearFilters, isAnyFilterActive } = useFilters();
  const { allAvailableTags, categories: allCategories } = usePosts();
  const { openModal } = useUI();
  const panelRef = useRef<HTMLDivElement>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  
  const handleSavedClick = () => {
    if (currentAccount) {
      openModal({ type: 'viewSavedSearches' });
    } else {
      onClose();
      setTimeout(() => openModal({ type: 'login' }), 350);
    }
  };

  const handleClearFilters = () => {
      onClearFilters();
      onClose();
  };

  const handleEnableLocationClick = async () => {
      setIsLoadingLocation(true);
      try {
          await onEnableLocation();
      } catch (e) {
          // Error handling is managed by the App component (toasts)
      } finally {
          setIsLoadingLocation(false);
      }
  };
  
  const tagItems = allAvailableTags.map(tag => ({ value: tag, label: tag }));

  const renderFooter = () => (
    <Button onClick={onClose} className="w-full flex-1" size="lg" variant="pill-red">
      Show Results
    </Button>
  );
  
  const DISTANCE_STEPS = [0, 5, 10, 25, 50, 100]; // 0 is "Any"
  const currentStepIndex = DISTANCE_STEPS.indexOf(filterState.filterDistance) > -1 ? DISTANCE_STEPS.indexOf(filterState.filterDistance) : 0;
  
  const handleDistanceSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const stepIndex = parseInt(e.target.value, 10);
      dispatchFilterAction({ type: 'SET_FILTER_DISTANCE', payload: DISTANCE_STEPS[stepIndex] });
  };

  // FIX: Add explicit types to mainSortOptions and granularSortOptions to include the optional 'disabled' property.
  const mainSortOptions: { value: string; label: string; disabled?: boolean }[] = useMemo(() => [
    { value: 'relevance-desc', label: 'Recommended' },
    { value: 'popularity-desc', label: 'Trending' },
    { value: 'date-desc', label: 'Latest' },
  ], []);

  const granularSortOptions: { value: string; label: string; disabled?: boolean }[] = useMemo(() => [
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'distance-asc', label: 'Distance: Nearest', disabled: !isLocationAvailable },
    { value: 'distance-desc', label: 'Distance: Farthest', disabled: !isLocationAvailable },
  ], [isLocationAvailable]);

  // FIX: Explicitly type `sortOptionsToShow` to help TypeScript infer the type of `option` in the map function.
  const sortOptionsToShow: { value: string; label: string; disabled?: boolean }[] = useMemo(() => {
    const isCurrentSelectionMain = mainSortOptions.some(opt => opt.value === filterState.sortOption);
    
    if (isCurrentSelectionMain) {
      const currentMainOption = mainSortOptions.find(opt => opt.value === filterState.sortOption);
      // Prepend the current main sort option so it's visible as the selected value,
      // but don't include the other main options to keep the list clean.
      return currentMainOption ? [currentMainOption, ...granularSortOptions] : granularSortOptions;
    }
    
    // If a granular option is selected (or nothing matching main), return only the granular options
    return granularSortOptions;
    
  }, [filterState.sortOption, mainSortOptions, granularSortOptions]);
  
  const isSortActive = !mainSortOptions.some(opt => opt.value === filterState.sortOption);

  if (!isOpen) return null;

  return (
    <ModalShell
        panelRef={panelRef}
        onClose={onClose}
        title="Filters"
        footer={renderFooter()}
        position="right"
        panelClassName="w-full max-w-sm"
        titleId="filter-panel-title"
    >
        <div className="p-4 space-y-6">
          {isAnyFilterActive && (
            <Button onClick={handleClearFilters} variant="overlay-red" className="w-full gap-2 text-base font-medium">
              <XCircleIcon className="w-5 h-5" aria-hidden="true" />
              <span>Clear All Filters</span>
            </Button>
          )}
          <div>
              <div className="grid grid-cols-2 gap-2">
                  <Button variant="overlay-dark" size="sm" onClick={handleSavedClick} className="gap-2 font-medium relative" aria-label="View saved searches">
                      <StarIcon className="w-5 h-5" />
                      <span>Saved</span>
                      {currentAccount && savedSearchesCount > 0 && (
                        <span className="absolute -top-1 -right-1 block h-4 w-4 rounded-full bg-red-500 text-white text-xs font-bold border-2 border-white">{savedSearchesCount}</span>
                      )}
                  </Button>
                   <Button variant="overlay-dark" size="sm" onClick={onOpenFindNearbyModal} disabled={isFindingNearby} className="gap-2 font-medium" aria-label="Find nearby posts">
                      <MapPinIcon className="w-5 h-5" />
                      <span>Nearby</span>
                  </Button>
              </div>
          </div>
          <hr className="border-gray-200" />
          
          <FilterSection title="Distance" htmlFor="distance-filter" isActive={filterState.filterDistance > 0}>
            <div className={cn("flex items-center gap-3", !isLocationAvailable && "opacity-50")}>
                <input
                  id="distance-filter"
                  type="range"
                  min="0"
                  max={DISTANCE_STEPS.length - 1}
                  step="1"
                  value={currentStepIndex}
                  onChange={handleDistanceSliderChange}
                  disabled={!isLocationAvailable}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600 disabled:bg-gray-100 disabled:accent-gray-400"
                  aria-valuetext={filterState.filterDistance > 0 ? `Within ${filterState.filterDistance} km` : 'Any Distance'}
                />
                <span className="font-semibold text-gray-800 w-28 text-center bg-gray-100 py-1 rounded-md text-sm shrink-0">
                  {filterState.filterDistance > 0 ? `Within ${filterState.filterDistance} km` : 'Any Distance'}
                </span>
            </div>
            {!isLocationAvailable && (
                <div className="mt-3">
                    <Button 
                        onClick={handleEnableLocationClick} 
                        isLoading={isLoadingLocation}
                        variant="outline" 
                        size="sm" 
                        className="w-full border-red-200 text-red-600 hover:bg-red-50"
                    >
                        Enable Location Services
                    </Button>
                </div>
            )}
          </FilterSection>

          <hr className="border-gray-200" />
          
          <FilterSection title="Price Range" isActive={filterState.minPrice !== '' || filterState.maxPrice !== ''}>
            <div className="flex items-center gap-2">
              <Input type="number" placeholder="Min Price" value={filterState.minPrice} onChange={(e) => dispatchFilterAction({ type: 'SET_MIN_PRICE', payload: e.target.value })} variant="overlay" className="flex-1 min-w-0" />
              <span className="text-gray-600">–</span>
              <Input type="number" placeholder="Max Price" value={filterState.maxPrice} onChange={(e) => dispatchFilterAction({ type: 'SET_MAX_PRICE', payload: e.target.value })} variant="overlay" className="flex-1 min-w-0" />
            </div>
          </FilterSection>

          <FilterSection title="Sort By" htmlFor="sort-by-filter" isActive={isSortActive}>
            <Select
              id="sort-by-filter"
              value={filterState.sortOption}
              onChange={(e) => dispatchFilterAction({ type: 'SET_SORT_OPTION', payload: e.target.value })}
              variant="overlay"
            >
              {sortOptionsToShow.map(option => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FilterSection>

          <FilterSection title="Type" htmlFor="type-filter" isActive={filterState.filterType !== 'all'}>
            <Select id="type-filter" value={filterState.filterType} onChange={(e) => dispatchFilterAction({ type: 'SET_FILTER_TYPE', payload: e.target.value as 'all' | PostType })} variant="overlay">
              <option value="all">All Types</option>
              {Object.values(PostType).map((type: PostType) => <option key={type} value={type}>{type}</option>)}
            </Select>
          </FilterSection>
          
          <FilterSection title="Category" htmlFor="category-filter" isActive={filterState.filterCategory !== 'all'}>
            <Select id="category-filter" value={filterState.filterCategory} onChange={(e) => dispatchFilterAction({ type: 'SET_FILTER_CATEGORY', payload: e.target.value as 'all' | PostCategory })} variant="overlay">
              <option value="all">All Categories</option>
              {allCategories.map(category => <option key={category} value={category}>{category}</option>)}
            </Select>
          </FilterSection>

          <FilterSection title="Tags" isActive={filterState.filterTags.length > 0}>
            <MultiSelectDropdown
                items={tagItems}
                selectedValues={filterState.filterTags}
                onSelectionChange={(selected) => dispatchFilterAction({ type: 'SET_FILTER_TAGS', payload: selected })}
                placeholder="Select tags..."
                variant="overlay"
            />
          </FilterSection>

          <hr className="border-gray-200" />

          <FilterSection title="Status" isActive={filterState.filterExpiringSoon || filterState.filterShowExpired}>
            <div className="space-y-4 pt-2">
              {(
                [
                  { id: 'filter-expiring-soon', label: 'Expiring Soon', checked: filterState.filterExpiringSoon, action: 'SET_FILTER_EXPIRING_SOON' },
                  { id: 'filter-show-expired', label: 'Show Expired', checked: filterState.filterShowExpired, action: 'SET_FILTER_SHOW_EXPIRED' },
                ] as { id: string; label: string; checked: boolean; action: 'SET_FILTER_EXPIRING_SOON' | 'SET_FILTER_SHOW_EXPIRED' }[]
              ).map(({id, label, checked, action}) => (
                <div key={id} className="relative flex items-start">
                    <div className="flex h-6 items-center">
                        <input id={id} type="checkbox" checked={checked} onChange={(e) => dispatchFilterAction({ type: action, payload: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer" />
                    </div>
                    <div className="ml-3 text-sm"><label htmlFor={id} className="font-medium text-gray-600 cursor-pointer">{label}</label></div>
                </div>
              ))}
            </div>
          </FilterSection>
        </div>
    </ModalShell>
  );
};
