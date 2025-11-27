import React, { useState, useRef, useEffect, KeyboardEvent, ReactNode, forwardRef } from 'react';
import { useClickOutside } from '../../hooks/useClickOutside';
import { ChevronDownIcon } from '../Icons';
import { cn } from '../../lib/utils';

export interface DropdownItem {
  value: string;
  label: string;
}

interface DropdownProps {
  items: DropdownItem[];
  selectedValue: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  variant?: 'default' | 'overlay';
  className?: string;
}

export const Dropdown = forwardRef<HTMLButtonElement, DropdownProps>(
  ({ items, selectedValue, onSelect, placeholder = 'Select...', variant = 'default', className }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    useClickOutside(dropdownRef, () => setIsOpen(false), isOpen);

    const selectedItem = items.find(item => item.value === selectedValue);

    const handleSelect = (value: string) => {
      onSelect(value);
      setIsOpen(false);
    };

    useEffect(() => {
      if (isOpen && listRef.current) {
        const selectedEl = listRef.current.querySelector('[aria-selected="true"]');
        if (selectedEl) {
          selectedEl.scrollIntoView({ block: 'nearest' });
        }
      }
    }, [isOpen]);
    
    useEffect(() => {
        if (isOpen && activeIndex >= 0 && listRef.current) {
          const activeItem = listRef.current.children[activeIndex] as HTMLLIElement;
          if (activeItem) {
            activeItem.scrollIntoView({ block: 'nearest' });
          }
        }
    }, [activeIndex, isOpen]);

    const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(!isOpen);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!isOpen) setIsOpen(true);
        setActiveIndex(prev => (prev < items.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!isOpen) setIsOpen(true);
        setActiveIndex(prev => (prev > 0 ? prev - 1 : items.length - 1));
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleItemKeyDown = (e: KeyboardEvent<HTMLLIElement>, value: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSelect(value);
      }
    };

    const buttonStyles = {
      default: 'border border-gray-300 bg-white rounded-md h-10 px-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500',
      overlay: 'bg-transparent border-0 rounded-none h-10 px-1 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-b-2 focus-visible:border-red-500',
    };

    return (
      <div className={cn('relative w-full', className)} ref={dropdownRef}>
        <button
          ref={ref}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          className={cn('flex items-center justify-between w-full text-left text-sm text-gray-800', buttonStyles[variant])}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="truncate">{selectedItem?.label || placeholder}</span>
          <ChevronDownIcon className={cn('w-4 h-4 text-gray-400 transition-transform', isOpen && 'rotate-180')} />
        </button>
        {isOpen && (
          <ul
            ref={listRef}
            className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto animate-fade-in-up"
            role="listbox"
          >
            {items.map((item, index) => (
              <li
                key={item.value}
                onClick={() => handleSelect(item.value)}
                onKeyDown={(e) => handleItemKeyDown(e, item.value)}
                onMouseOver={() => setActiveIndex(index)}
                className={cn(
                  'px-4 py-2 text-sm text-gray-700 cursor-pointer',
                  index === activeIndex && 'bg-gray-100',
                  item.value === selectedValue && 'font-semibold bg-red-50 text-red-700'
                )}
                role="option"
                aria-selected={item.value === selectedValue}
                tabIndex={0}
              >
                {item.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
);
Dropdown.displayName = 'Dropdown';