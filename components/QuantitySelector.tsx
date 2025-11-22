
import React from 'react';
import { Button } from './ui/Button';
import { TrashIcon } from './Icons';

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
    
  const buttonTextClass = size === 'lg' ? "text-gray-800 text-2xl font-bold" : "text-gray-800 text-lg";

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="glass"
        size={buttonSize}
        onClick={showTrash && onRemove ? onRemove : onDecrement}
        className={showTrash ? "text-red-600" : buttonTextClass}
        aria-label={showTrash ? "Remove item" : "Decrease quantity"}
        title={showTrash ? "Remove item" : "Decrease quantity"}
        disabled={!showTrash && (isNaN(numValue) || numValue <= 1)}
      >
        {showTrash ? <TrashIcon className={size === 'lg' ? "w-5 h-5" : "w-4 h-4"} /> : '-'}
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
        variant="glass"
        size={buttonSize}
        onClick={onIncrement}
        className={buttonTextClass}
        aria-label="Increase quantity"
      >
        +
      </Button>
    </div>
  );
};
