import React from 'react';
import { Button } from './ui/Button';
import { TrashIcon, MinusIcon, PlusIcon } from './Icons';

interface QuantitySelectorProps {
  value: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove?: () => void;
  canRemove?: boolean;
  autoFocus?: boolean;
  size?: 'sm' | 'lg';
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  value,
  onChange,
  onBlur,
  onIncrement,
  onDecrement,
  onRemove,
  canRemove = false,
  autoFocus = false,
  size = 'sm'
}) => {
  const numValue = parseInt(value, 10);
  const showTrash = canRemove && !isNaN(numValue) && numValue <= 1;
  
  // Styles based on size
  const buttonSize = size === 'lg' ? 'icon' : 'icon-sm';
  const inputClass = size === 'lg' 
    ? "w-16 text-center text-lg font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-md focus:ring-red-500 focus:border-red-500"
    : "w-12 text-center text-base font-bold text-gray-900 bg-transparent border-x-0 border-t-0 border-b-2 border-gray-200 focus:ring-0 focus:border-red-500";
    
  const iconClass = size === 'lg' ? "w-6 h-6" : "w-5 h-5";

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={showTrash ? 'overlay-red' : 'overlay-dark'}
        size={buttonSize}
        onClick={showTrash && onRemove ? onRemove : onDecrement}
        aria-label={showTrash ? "Remove item" : "Decrease quantity"}
        title={showTrash ? "Remove item" : "Decrease quantity"}
        disabled={!showTrash && (isNaN(numValue) || numValue <= 1)}
      >
        {showTrash ? <TrashIcon className={iconClass} /> : <MinusIcon className={iconClass} />}
      </Button>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        min="1"
        className={inputClass}
        aria-label="Item quantity"
        autoFocus={autoFocus}
      />
      <Button
        variant="overlay-dark"
        size={buttonSize}
        onClick={onIncrement}
        aria-label="Increase quantity"
        title="Increase quantity"
      >
        <PlusIcon className={iconClass} />
      </Button>
    </div>
  );
};