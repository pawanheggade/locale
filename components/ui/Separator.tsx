
import React from 'react';
import { cn } from '../../lib/utils';

interface SeparatorProps {
  label?: string;
  className?: string;
  lineClassName?: string;
  labelClassName?: string;
}

export const Separator: React.FC<SeparatorProps> = ({ 
  label, 
  className, 
  lineClassName = "border-gray-200", 
  labelClassName = "text-sm text-gray-500" 
}) => {
  return (
    <div className={cn("relative flex items-center w-full", className)}>
      <div className={cn("flex-grow border-t", lineClassName)} />
      {label && <span className={cn("flex-shrink mx-4", labelClassName)}>{label}</span>}
      <div className={cn("flex-grow border-t", lineClassName)} />
    </div>
  );
};
