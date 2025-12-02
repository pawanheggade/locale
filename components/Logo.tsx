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
            "flex items-baseline select-none relative font-['Comfortaa'] font-bold text-2xl sm:text-3xl text-gray-900 cursor-pointer active:scale-95 transition-transform",
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
      <span>l</span>
      <span className="relative inline-flex flex-col items-center">
        <span>o</span>
        <svg 
            width="18"
            height="18"
            viewBox="0 0 12 12" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
            className="absolute top-[75%] w-[0.6em] h-[0.6em]"
        >
          <path d="M2 2L6 10L10 2H2Z" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M1 7H11" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span>cale</span>
    </div>
  );
};