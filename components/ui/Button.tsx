
import React from 'react';
import { cn } from '../../lib/utils';
import { SpinnerIcon } from '../Icons';

const buttonVariants = {
  variant: {
    default: 'bg-red-600 text-white active:bg-red-800',
    destructive: 'bg-red-100 text-red-700 border border-red-200',
    outline: 'border border-gray-300 bg-white text-gray-600',
    secondary: 'bg-gray-50 text-gray-600 border border-gray-300',
    ghost: 'border border-transparent bg-transparent text-gray-600',
    link: 'text-red-600 underline-offset-4',
    'pill-red': 'bg-red-600 text-white active:bg-red-500 border-transparent',
    'circular-red': 'bg-red-600 text-white active:bg-red-500 border-transparent',
    'pill-lightred': 'bg-red-400 text-white active:bg-red-300 border-transparent',
    'circular-lightred': 'bg-red-400 text-white active:bg-red-300 border-transparent',
    'pill-amber': 'bg-amber-500 text-white active:bg-amber-400 border-transparent',
    'pill-dark': 'bg-gray-900 text-white active:bg-gray-700 border-transparent',
    'pill-slate': 'bg-slate-600 text-white active:bg-slate-500 border-transparent',
    // Overlay Variants
    overlay: 'bg-transparent text-white border-none shadow-none',
    'overlay-dark': 'bg-transparent text-gray-600 border-none shadow-none',
    'overlay-red': 'bg-transparent text-red-600 border-none shadow-none',
    'overlay-amber': 'bg-transparent text-amber-600 border-none shadow-none',
  },
  size: {
    default: 'h-10 px-4 py-2 text-sm',
    sm: 'h-9 px-3 text-sm',
    xs: 'h-7 px-2.5 text-xs',
    lg: 'h-11 px-8',
    icon: 'h-10 w-10',
    'icon-sm': 'h-9 w-9',
    'icon-xs': 'h-6 w-6',
    'icon-lg': 'h-12 w-12',
  },
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  as?: 'button' | 'a';
  variant?: keyof typeof buttonVariants.variant;
  size?: keyof typeof buttonVariants.size;
  isLoading?: boolean;
  href?: string;
  target?: string;
  rel?: string;
}

const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  ({ className, as = 'button', variant = 'default', size = 'default', isLoading = false, children, ...props }, ref) => {
    const Comp: any = as;

    return (
      <Comp
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-95 transition-transform duration-75',
          'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500',
          buttonVariants.variant[variant],
          buttonVariants.size[size],
          size === 'xs' && 'text-xs',
          className
        )}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? <SpinnerIcon className="h-5 w-5" /> : children}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

interface TabButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  onClick: () => void;
  isActive: boolean;
  children: React.ReactNode;
  size?: 'sm' | 'default';
  className?: string;
}

const TabButton: React.FC<TabButtonProps> = ({ onClick, isActive, children, size = 'default', className, ...props }) => {
  const textSize = size === 'sm' ? 'text-sm' : 'text-sm sm:text-base';
  const padding = size === 'sm' ? 'py-2 px-1' : 'py-3 px-1';
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-shrink-0 flex items-center justify-center gap-2 font-medium whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 rounded-sm active:scale-95 transition-transform duration-75 origin-center',
        textSize,
        padding,
        isActive
          ? 'text-red-600'
          : 'text-gray-600',
        className
      )}
      role="tab"
      aria-selected={isActive}
      {...props}
    >
      {children}
    </button>
  );
};
TabButton.displayName = 'TabButton';


export { Button, TabButton };
