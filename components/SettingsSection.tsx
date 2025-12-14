
import React from 'react';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => {
  return (
    <fieldset>
      <legend className="text-lg font-medium text-gray-900">{title}</legend>
      <div className="mt-4 space-y-4 bg-white p-6 rounded-lg border border-gray-300/80">
        {children}
      </div>
    </fieldset>
  );
};