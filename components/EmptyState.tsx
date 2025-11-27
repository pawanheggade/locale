
import React from 'react';
import { cn } from '../lib/utils';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon, 
  title, 
  description, 
  action, 
  className 
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-12 px-4 animate-fade-in", className)}>
      <div className="text-gray-400 mb-4 [&>svg]:w-16 [&>svg]:h-16">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
      {description && (
        <p className="text-gray-600 mt-2 max-w-md text-sm sm:text-base">{description}</p>
      )}
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
};
