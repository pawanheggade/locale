import React from 'react';
import { cn } from '../../lib/utils';
import { Dropdown, DropdownItem } from './Dropdown';

// FIX: Changed SelectProps to no longer extend SelectHTMLAttributes, as this component
// renders a custom Dropdown (which uses a <button>), not a native <select>.
// Inheriting from SelectHTMLAttributes caused type conflicts with the underlying button's props.
// This new interface defines only the necessary props and allows passthrough of valid button attributes, ensuring type safety.
// FIX: Omit 'onSelect' to prevent type collision with the custom Dropdown's onSelect prop.
interface SelectProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'value' | 'children' | 'onSelect'> {
  value?: string | number | readonly string[] | undefined;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  variant?: 'default' | 'overlay';
  children: React.ReactNode;
}

const Select = React.forwardRef<
  HTMLButtonElement, // Ref is now for the button inside Dropdown
  SelectProps
>(({ className, children, value, onChange, variant = 'default', ...props }, ref) => {
  const items: DropdownItem[] = React.Children.map(children, child => {
    if (React.isValidElement(child) && child.type === 'option') {
      const option = child as React.ReactElement<React.OptionHTMLAttributes<HTMLOptionElement>>;
      if(option.props.disabled) return null;
      return {
        value: String(option.props.value),
        label: String(option.props.children),
      };
    }
    return null;
  }).filter((item): item is DropdownItem => item !== null);

  const handleSelect = (selectedValue: string) => {
    if (onChange) {
      // Simulate a select change event for compatibility
      const event = {
        target: { value: selectedValue },
        currentTarget: { value: selectedValue },
      } as unknown as React.ChangeEvent<HTMLSelectElement>;
      onChange(event);
    }
  };

  return (
    <Dropdown
      ref={ref}
      items={items}
      selectedValue={String(value)}
      onSelect={handleSelect}
      variant={variant}
      className={className}
      {...props}
    />
  );
});
Select.displayName = 'Select';

export { Select };