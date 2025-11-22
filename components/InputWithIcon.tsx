import React from 'react';
import { cn } from '../lib/utils';
import { Input, InputProps } from './ui/Input';
import { Label } from './ui/Label';

interface InputWithIconProps extends InputProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  error?: string;
  containerClassName?: string;
}

export const InputWithIcon: React.FC<InputWithIconProps> = ({
  id,
  label,
  icon,
  error,
  containerClassName = '',
  className,
  ...props
}) => {
  const errorId = `${id}-error`;

  return (
    <div className={containerClassName}>
      <Label htmlFor={id}>
        {label}
      </Label>
      <div className="mt-1 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" aria-hidden="true">
          {icon}
        </div>
        <Input
          id={id}
          className={cn('pl-10', error ? 'border-red-500' : '', className)}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
      </div>
      {error && <p id={errorId} className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};