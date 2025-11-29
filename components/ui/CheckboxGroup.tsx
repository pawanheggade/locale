import React from 'react';
import { cn } from '../../lib/utils';

interface CheckboxGroupProps {
  title: string;
  description?: string;
  options: readonly { id: string, label: string }[] | readonly string[];
  selectedOptions: string[];
  onChange: (newSelection: string[]) => void;
  error?: string;
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({ title, description, options, selectedOptions, onChange, error }) => {
  const handleCheckboxChange = (optionValue: string) => {
    const newSelection = selectedOptions.includes(optionValue)
      ? selectedOptions.filter(item => item !== optionValue)
      : [...selectedOptions, optionValue];
    onChange(newSelection);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-600">{title}</label>
      {description && <p className="text-xs text-gray-600">{description}</p>}
      <div className="mt-2 space-y-2">
        {options.map(option => {
          const optionValue = typeof option === 'string' ? option : option.id;
          const optionLabel = typeof option === 'string' ? option : option.label;
          return (
            <div key={optionValue} className="flex items-center">
              <input
                id={`${title.replace(/\s+/g, '-')}-${optionValue}`}
                type="checkbox"
                checked={selectedOptions.includes(optionValue)}
                onChange={() => handleCheckboxChange(optionValue)}
                className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <label htmlFor={`${title.replace(/\s+/g, '-')}-${optionValue}`} className="ml-2 block text-sm text-gray-900 cursor-pointer">
                {optionLabel}
              </label>
            </div>
          );
        })}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
};
