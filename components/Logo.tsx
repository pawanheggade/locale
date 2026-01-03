
import React from 'react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({ className, onClick }) => {
  return (
    <div 
        className={cn(
            "select-none font-['Comfortaa'] font-bold text-3xl sm:text-4xl text-gray-900 cursor-pointer active:scale-95 transition-transform",
            className
        )}
        onClick={onClick}
        onKeyDown={(e) => {
            if (onClick && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onClick();
            }
        }}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        aria-label="Locale Home"
    >
      locale
    </div>
  );
};
