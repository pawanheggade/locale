
import React from 'react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  variant?: 'default' | 'large';
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({ className, variant = 'default', onClick }) => {
  const isLarge = variant === 'large';
  
  return (
    <div 
        className={cn(
            "flex items-baseline select-none relative font-['Comfortaa']",
            isLarge 
                ? "font-semibold text-[36px] text-gray-900" 
                : "font-semibold text-2xl sm:text-3xl text-gray-900 cursor-pointer active:scale-95 transition-transform",
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
            width={isLarge ? "25" : "18"} 
            height={isLarge ? "25" : "18"} 
            viewBox="0 0 12 12" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
            className={cn("absolute", isLarge ? "top-[80%] w-[25px] h-[25px]" : "top-[75%] w-[18px] h-[18px]")}
        >
          <path d="M2 2L6 10L10 2H2Z M1 7H11" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span>cale</span>
      
      {isLarge && (
        <div className="absolute right-0 top-[90%] text-[9px] uppercase tracking-widest flex flex-col items-end leading-tight text-gray-500 font-normal whitespace-nowrap font-['Comfortaa']">
            <span>hyperlocal</span>
            <span>community</span>
        </div>
      )}
    </div>
  );
};
