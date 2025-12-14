
import React from 'react';
import { cn } from '../lib/utils';

interface SettingsRowProps {
  title: string;
  description?: string;
  onClick?: (e: React.MouseEvent) => void;
  control?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'warning';
  className?: string;
}

export const SettingsRow: React.FC<SettingsRowProps> = ({ title, description, onClick, control, variant = 'default', className }) => {
  const variantClasses = {
    default: { title: 'text-gray-900' },
    destructive: { title: 'text-red-600' },
    warning: { title: 'text-amber-700' },
  };

  const handleRowClick = (e: React.MouseEvent) => {
    // If the click is on an interactive element inside the row, don't trigger the row's main onClick.
    // This allows the switch/control to handle its own event.
    if ((e.target as HTMLElement).closest('button, input, a')) {
      return;
    }
    onClick?.(e);
  };

  return (
    <div
      onClick={handleRowClick}
      className={cn(
        "w-full text-left p-4 -m-4 rounded-lg transition-colors",
        onClick && "cursor-pointer active:bg-gray-50",
        className
      )}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e as any); }} : undefined}
    >
      <div className="flex-1">
        {/* Top row for title and control */}
        <div className="flex items-center justify-between">
          <span className={cn("font-semibold", variantClasses[variant].title)}>{title}</span>
          {control && (
            <div className="flex-shrink-0 ml-4">
              {control}
            </div>
          )}
        </div>
        
        {/* Bottom row for full-width description */}
        {description && (
          <p className="text-sm text-gray-600 font-normal mt-1">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};