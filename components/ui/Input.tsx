import React from 'react';
import { cn, inputBaseStyles, overlayInputBaseStyles } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'overlay';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, variant = 'default', ...props }, ref) => {
  const variantStyles = {
    default: 'h-10 px-3 py-2',
    overlay: cn(overlayInputBaseStyles, 'py-2'),
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