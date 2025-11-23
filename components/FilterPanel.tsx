
import React, { useState, useRef, useEffect } from 'react';
import { PostType, PostCategory, Account } from '../types';
import { XCircleIcon, ChevronDownIcon, SpinnerIcon, StarIcon, MapPinIcon } from './Icons';
import ModalShell from './ModalShell';
import { FilterSection } from './FilterSection';
import { useFilters } from '../contexts/FiltersContext';
import { usePosts } from '../contexts/PostsContext';
import { useUI } from '../contexts/UIContext';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Button } from './ui/Button';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isLocationAvailable: boolean;
  savedSearchesCount: number;
  onOpenFindNearbyModal: () => void;
  isFindingNearby: boolean;
  currentAccount: Account | null;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  isOpen,
  onClose,
  isLocationAvailable,
  savedSearchesCount,
  onOpenFindNearbyModal,
  isFindingNearby,
  currentAccount,
}) => {
  const { filterState, dispatchFilterAction, onClearFilters, isAnyFilterActive } = useFilters();
  const { allAvailableTags, categories: allCategories } = usePosts();
  const { openModal } = useUI();

  const panelRef = useRef<HTMLDivElement>(null);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target as Node)) {
            if (isMountedRef.current) {
              setIsTagDropdownOpen(false);
            }
        }
    };
    if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSavedClick = () => {
    if (currentAccount) {
      openModal({ type: 'viewSavedSearches' });
    } else {
      onClose();
      setTimeout(() => openModal({ type: 'login' }), 350);
    }
  };

  const handleSaveSearchClick = () => {
    if (currentAccount) {
      openModal({ type: 'saveSearch' });
    } else {
      onClose();
      setTimeout(() => openModal({ type: 'login' }), 350);
    }
  };

  const handleClearFiltersConfirm = () => {
      openModal({
          type: 'confirmation',
          data: {
              title: 'Clear All Filters',
              message: 'Are you sure you want to clear all active filters and search criteria?',
              onConfirm: () => {
                  onClearFilters();
                  // Do not re-open panel, user wants to see results.
              },
              confirmText: 'Clear All',
              confirmClassName: 'bg-red-600 text-white',
          }
      });
  };

  const isTypeFilterActive = filterState.filterType !== 'all';
  const isCategoryFilterActive = filterState.filterCategory !== 'all';
  const isPriceFilterActive = filterState.minPrice !== '' || filterState.maxPrice !== '';
  const isTagsFilterActive = filterState.filterTags.length > 0;
  const isDistanceFilterActive = filterState.filterDistance > 0;
  const isStatusFilterActive = filterState.filterLast7Days || filterState.filterExpiringSoon || filterState.filterShowExpired;
  const isSortActive = filterState.sortOption !== 'date-desc';


  if (!isOpen) {
    return null;
  }
  
  const filteredAvailableTags = allAvailableTags.filter(tag =>
    tag.toLowerCase().includes(tagSearchQuery.toLowerCase())
  );

  const handleTagChange = (tag: string) => {
    const newSelectedTags = filterState.filterTags.includes(tag)
        ? filterState.filterTags.filter(t => t !== tag)
        : [...filterState.filterTags, tag];
    dispatchFilterAction({ type: 'SET_FILTER_TAGS', payload: newSelectedTags });
  };

  const renderFooter = () => (
    <>
      <Button
        onClick={onClose}
        className="w-full flex-1"
        size="lg"
        variant="glass-red"
      >
        Show Results
      </Button>
    </>
  );
  
  const DISTANCE_STEPS = [0, 5, 10, 25, 50, 100]; // 0 is "Any"
  const currentStepIndex = DISTANCE_STEPS.indexOf(filterState.filterDistance) > -1 ? DISTANCE_STEPS.indexOf(filterState.filterDistance) : 0;
  
  const handleDistanceSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const stepIndex = parseInt(e.target.value, 10);
      dispatchFilterAction({ type: 'SET_FILTER_DISTANCE', payload: DISTANCE_STEPS[stepIndex] });
  };

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
        <div className="p-4 sm:p-6 space-y-6">
          {isAnyFilterActive && (
            <Button
              onClick={handleClearFiltersConfirm}
              variant="glass"
              className="w-full gap-2 text-base font-medium text-gray-700"
            >
              <XCircleIcon className="w-5 h-5" aria-hidden="true" />
              <span>Clear All Filters</span>
            </Button>
          )}
          <div>
              <div className="grid grid-cols-2 gap-2">
                  <Button
                      variant="glass"
                      size="sm"
                      onClick={handleSavedClick}
                      className="gap-2 font-medium relative"
                      aria-label="View saved searches"
                  >
                      <StarIcon className="w-5 h-5" />
                      <span>Saved</span>
                      {currentAccount && savedSearchesCount > 0 && (
                        <span className="absolute -top-1 -right-1 block h-4 w-4 rounded-full bg-red-500 text-white text-xs font-bold border-2 border-white">{savedSearchesCount}</span>
                      )}
                  </Button>
                   <Button
                    variant="glass"
                    size="sm"
                    onClick={onOpenFindNearbyModal}
                    disabled={isFindingNearby}
                    className="gap-2 font-medium"
                    aria-label="Find nearby posts"
                  >
                      {isFindingNearby ? <SpinnerIcon className="w-5 h-5" /> : <MapPinIcon className="w-5 h-5" />}
                      <span>Nearby</span>
                  </Button>
              </div>
              {isAnyFilterActive && (
                <Button
                  onClick={handleSaveSearchClick}
                  variant="glass"
                  size="sm"
                  className="w-full mt-2 gap-2 font-medium text-gray-700 animate-fade-in-up"
                  aria-label="Save current search and filters"
                >
                    <span>Save Current Search</span>
                </Button>
              )}
          </div>
          <hr className="border-gray-200" />
          
          <FilterSection title="Distance" htmlFor="distance-filter" isActive={isDistanceFilterActive}>
            <div className="flex items-center gap-4">
                <input
                id="distance-filter"
                type="range"
                min="0"
                max={DISTANCE_STEPS.length - 1}
                step="1"
                value={currentStepIndex}
                onChange={handleDistanceSliderChange}
                disabled={!isLocationAvailable}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600 disabled:bg-gray-100 disabled:accent-gray-400"
                aria-valuetext={filterState.filterDistance > 0 ? `Within ${filterState.filterDistance} km` : 'Any Distance'}
                />
                <span className="font-semibold text-gray-800 w-28 text-center bg-gray-100 py-1 rounded-md text-sm">
                {filterState.filterDistance > 0 ? `Within ${filterState.filterDistance} km` : 'Any Distance'}
                </span>
            </div>
            {!isLocationAvailable && (
                <p className="text-xs text-gray-500 mt-1">Enable location services to use this filter.</p>
            )}
          </FilterSection>

          <hr className="border-gray-200" />
          
          <FilterSection title="Price Range" isActive={isPriceFilterActive}>
            <div className="flex items-center gap-2">
              <div className="relative w-full">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gray-500 text-sm">₹</span>
                </div>
                <Input
                  type="number"
                  placeholder="Min"
                  value={filterState.minPrice}
                  onChange={(e) => dispatchFilterAction({ type: 'SET_MIN_PRICE', payload: e.target.value })}
                  className="w-full pl-7 pr-2"
                  aria-label="Minimum price"
                />
              </div>
              <span className="text-gray-500">–</span>
              <div className="relative w-full">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gray-500 text-sm">₹</span>
                </div>
                <Input
                  type="number"
                  placeholder="Max"
                  value={filterState.maxPrice}
                  onChange={(e) => dispatchFilterAction({ type: 'SET_MAX_PRICE', payload: e.target.value })}
                  className="w-full pl-7 pr-2"
                  aria-label="Maximum price"
                />
              </div>
            </div>
          </FilterSection>

          <FilterSection title="Sort By" htmlFor="sort-option-filter" isActive={isSortActive}>
            <Select
                id="sort-option-filter"
                value={filterState.sortOption}
                onChange={(e) => dispatchFilterAction({ type: 'SET_SORT_OPTION', payload: e.target.value })}
            >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="title-asc">Title: A-Z</option>
                <option value="title-desc">Title: Z-A</option>
                <option value="location-asc">Location: A-Z</option>
                <option value="location-desc">Location: Z-A</option>
                <option value="distance-asc" disabled={!isLocationAvailable}>
                    Distance: Nearest {isLocationAvailable ? '' : '(Unavailable)'}
                </option>
            </Select>
          </FilterSection>

          <FilterSection title="Type" htmlFor="type-filter" isActive={isTypeFilterActive}>
            <Select
              id="type-filter"
              value={filterState.filterType}
              onChange={(e) => dispatchFilterAction({ type: 'SET_FILTER_TYPE', payload: e.target.value as 'all' | PostType })}
            >
              <option value="all">All Types</option>
              {Object.values(PostType).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </Select>
          </FilterSection>
          
          <FilterSection title="Category" htmlFor="category-filter" isActive={isCategoryFilterActive}>
            <Select
              id="category-filter"
              value={filterState.filterCategory}
              onChange={(e) => dispatchFilterAction({ type: 'SET_FILTER_CATEGORY', payload: e.target.value as 'all' | PostCategory })}
            >
              <option value="all">All Categories</option>
              {allCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </Select>
          </FilterSection>

          <FilterSection title="Tags" isActive={isTagsFilterActive}>
            <div className="relative" ref={tagDropdownRef}>
                <button
                    onClick={() => setIsTagDropdownOpen(prev => !prev)}
                    className="w-full flex justify-between items-center px-3 py-2 text-left focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 glass-button-pill"
                >
                    <span className="text-sm text-gray-700">
                        {filterState.filterTags.length > 0 ? `${filterState.filterTags.length} selected` : 'Select tags...'}
                    </span>
                    <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isTagDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isTagDropdownOpen && (
                    <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                        <div className="p-2 border-b"><Input type="text" value={tagSearchQuery} onChange={e => setTagSearchQuery(e.target.value)} placeholder="Search tags..." className="w-full" /></div>
                        <ul>
                            {filteredAvailableTags.map(tag => (
                                <li key={tag} className="flex items-center p-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleTagChange(tag)}>
                                    <input type="checkbox" checked={filterState.filterTags.includes(tag)} readOnly className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500" />
                                    <label className="ml-3 text-sm text-gray-600">{tag}</label>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
          </FilterSection>

          <hr className="border-gray-200" />

          <FilterSection title="Status" isActive={isStatusFilterActive}>
            <div className="space-y-4 pt-2">
              <div className="relative flex items-start">
                <div className="flex h-6 items-center">
                  <input
                    id="filter-last-7-days"
                    name="filter-last-7-days"
                    type="checkbox"
                    checked={filterState.filterLast7Days}
                    onChange={(e) => dispatchFilterAction({ type: 'SET_FILTER_LAST_7_DAYS', payload: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="filter-last-7-days" className="font-medium text-gray-700 cursor-pointer">
                    New Arrivals
                  </label>
                </div>
              </div>

              <div className="relative flex items-start">
                <div className="flex h-6 items-center">
                  <input
                    id="filter-expiring-soon"
                    name="filter-expiring-soon"
                    type="checkbox"
                    checked={filterState.filterExpiringSoon}
                    onChange={(e) => dispatchFilterAction({ type: 'SET_FILTER_EXPIRING_SOON', payload: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="filter-expiring-soon" className="font-medium text-gray-700 cursor-pointer">
                    Expiring Soon
                  </label>
                </div>
              </div>

              <div className="relative flex items-start">
                <div className="flex h-6 items-center">
                  <input
                    id="filter-show-expired"
                    name="filter-show-expired"
                    type="checkbox"
                    checked={filterState.filterShowExpired}
                    onChange={(e) => dispatchFilterAction({ type: 'SET_FILTER_SHOW_EXPIRED', payload: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="filter-show-expired" className="font-medium text-gray-700 cursor-pointer">
                    Show Expired
                  </label>
                </div>
              </div>
            </div>
          </FilterSection>
        </div>
    </ModalShell>
  );
};
