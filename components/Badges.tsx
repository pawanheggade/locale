import React from 'react';
import { PostType } from '../types';
import { cn } from '../lib/utils';

export const LocaleChoiceBadge: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`absolute bg-black text-white text-xs font-bold uppercase px-2.5 py-1 rounded-md z-20 shadow-md ${className}`} title="Recommended by Locale">
    Locale Choice
  </div>
);

export const SaleBadge: React.FC<{ percentage: number; size?: 'small' | 'medium'; className?: string }> = ({ percentage, size = 'small', className = '' }) => {
  const sizeClasses = size === 'small'
    ? 'text-xs px-2.5 py-1'
    : 'text-sm px-3 py-1';
  
  return (
    <div className={`bg-amber-100 text-amber-800 font-bold rounded-md ${sizeClasses} ${className}`}>
      {percentage}% OFF
    </div>
  );
};

export const CategoryBadge: React.FC<{ category: string; onClick: (e: React.MouseEvent<HTMLButtonElement>) => void; size?: 'small' | 'medium'; className?: string; }> = ({ category, onClick, size = 'small', className = '' }) => {
    const sizeClasses = size === 'small' ? 'text-xs' : 'text-sm';
    const colorClasses = 'glass-button-pill text-gray-800 font-medium';

    return (
        <button
            onClick={onClick}
            className={cn(
                'rounded-full truncate normal-case transition-all flex-shrink-0 px-3 py-1',
                sizeClasses, 
                colorClasses, 
                className
            )}
            title={`Filter by category: ${category}`}
        >
            {category}
        </button>
    );
};

export const TypeBadge: React.FC<{ type: PostType; onClick: (e: React.MouseEvent<HTMLButtonElement>) => void; size?: 'small' | 'medium'; className?: string }> = ({ type, onClick, size = 'small', className = '' }) => {
    const sizeClasses = size === 'small' ? 'text-xs' : 'text-sm';
    const colorClasses = 'glass-button-pill text-gray-800 font-medium';

    return (
        <button
            onClick={onClick}
            className={cn(
                'rounded-full truncate normal-case transition-all flex-shrink-0 capitalize px-3 py-1',
                sizeClasses, 
                colorClasses, 
                className
            )}
            title={`Filter by type: ${type.toLowerCase()}`}
        >
            {type.toLowerCase()}
        </button>
    );
};