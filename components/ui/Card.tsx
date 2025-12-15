
import React from 'react';
import { cn } from '../../lib/utils';

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('bg-white rounded-xl border border-gray-300/80 overflow-hidden flex flex-col', className)}
    {...props}
  />
));
Card.displayName = 'Card';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-4 flex-grow', className)} {...props} />
));
CardContent.displayName = 'CardContent';

export { Card, CardContent };
