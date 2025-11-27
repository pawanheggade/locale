import React from 'react';
import { cn, inputBaseStyles } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'overlay';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, variant = 'default', ...props }, ref) => {
  const variantStyles = {
    default: 'h-10 px-3 py-2',
    overlay: 'h-10 px-1 py-2 bg-transparent border-0 border-b-2 border-gray-300 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-red-500'
  };

  return (
    <input
      type={type}
      className={cn(
        'flex w-full file:border-0 file:bg-transparent file:text-sm file:font-medium',
        variant === 'default' && inputBaseStyles,
        variantStyles[variant],
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };