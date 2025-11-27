
import React from 'react';

const ActiveIndicator = () => (
    <span className="block h-2 w-2 rounded-full bg-red-500" aria-label="Filter active"></span>
);

interface FilterSectionProps {
  title: string;
  isActive: boolean;
  children: React.ReactNode;
  htmlFor?: string;
}

export const FilterSection: React.FC<FilterSectionProps> = ({ title, isActive, children, htmlFor }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-600">
          {title}
        </label>
        {isActive && <ActiveIndicator />}
      </div>
      {children}
    </div>
  );
};
