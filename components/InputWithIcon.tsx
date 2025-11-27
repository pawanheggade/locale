import React from 'react';
import { cn } from '../lib/utils';
import { Input, InputProps } from './ui/Input';

interface InputWithIconProps extends InputProps {
  icon: React.ReactNode;
  containerClassName?: string;
}

export const InputWithIcon: React.FC<InputWithIconProps> = ({
  icon,
  containerClassName = '',
  className,
  ...props
}) => {
  return (
    <div className={cn('relative', containerClassName)}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" aria-hidden="true">
        {icon}
      </div>
      <Input
        className={cn('pl-10', className)}
        {...props}
      />
    </div>
  );
};
