import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '../Icons';
import { Button } from '../ui/Button';

export const SortableHeader: React.FC<{
  label: React.ReactNode;
  sortKey: any;
  sortConfig: any | null;
  requestSort: (key: any) => void;
  className?: string;
}> = ({ label, sortKey, sortConfig, requestSort, className = '' }) => {
  const isSorted = sortConfig?.key === sortKey;
  const directionIcon = isSorted ? (sortConfig.direction === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />) : null;
  
  // Determine ARIA sort state
  let ariaSort: React.AriaAttributes['aria-sort'] = 'none';
  if (isSorted) {
      ariaSort = sortConfig.direction === 'asc' ? 'ascending' : 'descending';
  }

  return (
    <th 
        scope="col" 
        className={`px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider ${className}`}
        aria-sort={ariaSort}
    >
      <Button
        onClick={() => requestSort(sortKey)}
        variant="ghost"
        className="p-0 h-auto font-medium text-gray-600 hover:text-gray-900 gap-1 uppercase tracking-wider text-xs"
        aria-label={typeof label === 'string' ? `Sort by ${label}` : 'Sort column'}
      >
        {label}
        {directionIcon}
      </Button>
    </th>
  );
};