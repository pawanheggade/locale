import React from 'react';
import { cn } from '../../lib/utils';
import { Input, InputProps } from './Input';

interface CurrencyInputProps extends InputProps {}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({ className, ...props }) => {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <span className="text-gray-600 sm:text-sm">₹</span>
      </div>
      <Input
        type="number"
        className={cn('pl-7', className)}
        placeholder="0.00"
        min="0"
        step="0.01"
        {...props}
      />
    </div>
  );
};
