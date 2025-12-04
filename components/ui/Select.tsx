
import React from 'react';
import { cn } from '../../lib/utils';
import { Dropdown, DropdownItem } from './Dropdown';

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  variant?: 'default' | 'overlay';
  size?: any; // To satisfy React.forwardRef, but we don't use it.
}

const Select = React.forwardRef<
  HTMLButtonElement, // Ref is now for the button inside Dropdown
  SelectProps
  // FIX: Destructure and ignore the native 'onSelect' prop to avoid type conflicts with the Dropdown's 'onSelect'.
>(({ className, children, value, onChange, variant = 'default', onSelect, onSubmit, ...props }, ref) => {
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