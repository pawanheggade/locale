
import React from 'react';
import { PostType } from '../types';
import { cn } from '../lib/utils';

export const LocaleChoiceBadge: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`absolute bg-black text-white text-xs font-bold uppercase px-2.5 py-1 rounded-md z-20 ${className}`} title="Recommended by Locale">
    Locale Choice
  </div>
);

export const SaleBadge: React.FC<{ percentage: number; size?: 'small' | 'medium'; className?: string }> = ({ percentage, size = 'small', className = '' }) => {
  const sizeClasses = size === 'small'
    ? 'text-base px-2.5 py-1'
    : 'text-lg px-3 py-1';
  
  return (
    <div className={`bg-amber-100 text-amber-800 font-bold rounded-md ${sizeClasses} ${className}`}>
      {percentage}% OFF
    </div>
  );
};

// Generic FilterBadge to reduce duplication
interface FilterBadgeProps {
    label: string;
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
    title: string;
    size?: 'small' | 'medium';
    className?: string;
}

const FilterBadge: React.FC<FilterBadgeProps> = ({ label, onClick, title, size = 'small', className = '' }) => {
    const sizeClasses = size === 'small' ? 'text-xs' : 'text-sm';

    return (
        <button
            onClick={onClick}
            className={cn(
                'uppercase font-bold tracking-wider text-gray-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 rounded-sm',
                sizeClasses, 
                className
            )}
            title={title}
        >
            {label}
        </button>
    );
};

export const CategoryBadge: React.FC<{ category: string; onClick: (e: React.MouseEvent<HTMLButtonElement>) => void; size?: 'small' | 'medium'; className?: string; }> = ({ category, onClick, ...props }) => (
    <FilterBadge
        label={category}
        onClick={onClick}
        title={`Filter by category: ${category}`}
        {...props}
    />
);

export const TypeBadge: React.FC<{ type: PostType; onClick: (e: React.MouseEvent<HTMLButtonElement>) => void; size?: 'small' | 'medium'; className?: string }> = ({ type, onClick, ...props }) => (
    <FilterBadge
        label={type}
        onClick={onClick}
        title={`Filter by type: ${type.toLowerCase()}`}
        {...props}
    />
);