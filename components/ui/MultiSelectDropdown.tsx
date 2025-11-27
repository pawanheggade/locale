import React, { useState, useRef, useMemo } from 'react';
import { useClickOutside } from '../../hooks/useClickOutside';
import { ChevronDownIcon, SearchIcon } from '../Icons';
import { cn, overlayInputBaseStyles } from '../../lib/utils';
import { Input } from './Input';

export interface MultiSelectDropdownItem {
  value: string;
  label: string;
}

interface MultiSelectDropdownProps {
  items: MultiSelectDropdownItem[];
  selectedValues: string[];
  onSelectionChange: (selected: string[]) => void;
  placeholder?: string;
  variant?: 'default' | 'overlay';
  className?: string;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  items,
  selectedValues,
  onSelectionChange,
  placeholder = 'Select...',
  variant = 'default',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setIsOpen(false), isOpen);

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    return items.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [items, searchQuery]);

  const handleToggleItem = (value: string) => {
    const newSelection = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onSelectionChange(newSelection);
  };

  const buttonStyles = {
    default: 'border border-gray-300 bg-white rounded-md h-10 px-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500',
    overlay: overlayInputBaseStyles,
  };

  return (
    <div className={cn('relative w-full', className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center justify-between w-full text-left text-sm text-gray-800',
          buttonStyles[variant]
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">
          {selectedValues.length > 0 ? `${selectedValues.length} selected` : placeholder}
        </span>
        <ChevronDownIcon className={cn('w-4 h-4 text-gray-400 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 animate-fade-in-up">
          <div className="p-2 border-b">
            <div className="relative">
                <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-8 h-8 text-sm"
                    variant="overlay"
                />
            </div>
          </div>
          <ul className="max-h-60 overflow-y-auto" role="listbox">
            {filteredItems.map(item => (
              <li
                key={item.value}
                onClick={() => handleToggleItem(item.value)}
                className="flex items-center px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-100"
                role="option"
                aria-selected={selectedValues.includes(item.value)}
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(item.value)}
                  readOnly
                  className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  tabIndex={-1}
                />
                <span className="ml-3 truncate">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};