import React from 'react';
import { cn, inputBaseStyles } from '../../lib/utils';
import { ChevronDownIcon } from '../Icons';

const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div className="relative">
      <select
        className={cn(
          'h-10 w-full appearance-none py-2 pl-3 pr-8',
          inputBaseStyles,
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <ChevronDownIcon className="h-4 w-4" />
      </div>
    </div>
  );
});
Select.displayName = 'Select';

export { Select };