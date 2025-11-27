import React from 'react';
import { cn } from '../lib/utils';
import { Label } from './ui/Label';

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  description?: string;
  children: React.ReactElement;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({ id, label, error, description, children, className }) => {
  const child = React.Children.only(children);
  const errorId = `${id}-error`;

  return (
    <div className={cn(className)}>
      <div className="flex justify-between items-baseline mb-1">
        <Label htmlFor={id}>{label}</Label>
        {description && <span className="text-xs text-gray-500">{description}</span>}
      </div>
      {/* FIX: Cast the child element to `React.ReactElement<any>` to resolve the TypeScript overload error. This allows passing props like `id` even when the child's specific props type cannot be inferred. */}
      {React.cloneElement(child as React.ReactElement<any>, {
        id: id,
        'aria-describedby': error ? errorId : undefined,
        'aria-invalid': !!error,
        // FIX: Safely access child.props.className with a type assertion, as TypeScript
        // cannot guarantee its existence on a generic React.ReactElement's props.
        className: cn((child.props as { className?: string }).className, error ? 'border-red-500' : ''),
      })}
      {error && <p id={errorId} className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};