
import React from 'react';
import { PostType } from '../types';
import { cn } from '../lib/utils';

export const LocaleChoiceBadge: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`absolute bg-black text-white text-xs font-bold uppercase px-2.5 py-1 rounded-md z-20 ${className}`} title="Recommended by Locale">
    Locale Choice
  </div>
);

export const SaleBadge: React.FC<{ percentage: number; size?: 'small' | 'medium'; className?: string }> = ({ percentage, size = 'small', className = '' }) => {
  const isSmall = size === 'small';
  
  // Tag styling variables
  const heightClass = isSmall ? 'h-6' : 'h-7';
  const textSize = isSmall ? 'text-xs' : 'text-sm';
  const padding = isSmall ? 'px-2' : 'px-3';
  
  // Arrow geometry
  const arrowWidth = isSmall ? '10px' : '12px';
  const arrowLeft = isSmall ? '-10px' : '-12px';
  const marginLeft = isSmall ? 'ml-2.5' : 'ml-3'; // Compensation for the arrow sticking out
  const holeClass = isSmall ? 'w-1 h-1 -left-1' : 'w-1.5 h-1.5 -left-1.5';

  return (
    <div 
        className={cn(
            "relative inline-flex items-center bg-amber-100 text-amber-800 font-bold rounded-r-md select-none",
            heightClass,
            textSize,
            padding,
            marginLeft,
            className
        )}
        title={`${percentage}% Discount`}
    >
      {/* Triangle tip */}
      <div 
        className="absolute top-0 bottom-0 bg-amber-100"
        style={{ 
            left: arrowLeft,
            width: arrowWidth,
            clipPath: 'polygon(100% 0, 100% 100%, 0 50%)'
        }}
      />
      
      {/* Hole simulation */}
      <div className={cn("absolute bg-white rounded-full top-1/2 -translate-y-1/2 shadow-sm", holeClass)} />
      
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
                'uppercase font-bold tracking-wider text-gray-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 rounded-sm',
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