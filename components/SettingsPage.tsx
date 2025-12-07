import React from 'react';
import { NotificationSettings, Account } from '../types';
import { useUI } from '../contexts/UIContext';
import { SettingsSection } from './SettingsSection';
import { SettingsRow } from './SettingsRow';
import { Switch } from './ui/Switch';

interface SettingsPageProps {
  settings: NotificationSettings;
  onSettingsChange: (newSettings: NotificationSettings) => void;
  onArchiveAccount: () => void;
  onSignOut: () => void;
  currentAccount: Account;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ settings, onSettingsChange, onArchiveAccount, onSignOut, currentAccount }) => {
  const { openModal } = useUI();

  const isSeller = currentAccount.subscription.tier !== 'Personal';

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in-down max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Settings</h1>
        <div className="space-y-8">
            {isSeller && (
                <SettingsSection title="In-App Notifications">
                    <SettingsRow
                        title="Item Expiry Alerts"
                        description="Get notified when your posts are about to expire."
                        onClick={() => onSettingsChange({ ...settings, expiryAlertsEnabled: !settings.expiryAlertsEnabled })}
                        control={
                            <Switch
                                checked={settings.expiryAlertsEnabled}
                                onCheckedChange={(checked) => onSettingsChange({ ...settings, expiryAlertsEnabled: checked })}
                                aria-label="Toggle item expiry alerts"
                            />
                        }
                    />
                
                    {settings.expiryAlertsEnabled && (
                        <div className="pt-4 mt-4 border-t border-gray-200 animate-fade-in-down">
                            <label htmlFor="expiry-threshold" className="block text-sm font-medium text-gray-600">
                                Notify me when an item will expire in:
                            </label>
                            <div className="flex items-center gap-4 mt-2">
                                <input
                                id="expiry-threshold"
                                type="range"
                                min="1"
                                max="14"
                                value={settings.expiryThresholdDays}
                                onChange={(e) => onSettingsChange({ ...settings, expiryThresholdDays: parseInt(e.target.value, 10) })}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                                />
                                <span className="font-semibold text-gray-800 w-20 text-center bg-gray-100 py-1 rounded-md">
                                {settings.expiryThresholdDays} day{settings.expiryThresholdDays > 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>
                    )}
                </SettingsSection>
            )}

            <SettingsSection title="Account">
                <SettingsRow
                    onClick={onSignOut}
                    title="Sign Out"
                    description="End your session on this device."
                    variant="destructive"
                />
                <SettingsRow
                    onClick={onArchiveAccount}
                    title="Archive Account"
                    description="Temporarily deactivate your account. You can reactivate it later."
                    variant="warning"
                />
            </SettingsSection>
            
            <SettingsSection title="Support">
                 <SettingsRow
                    onClick={() => openModal({ type: 'feedback' })}
                    title="Send Feedback"
                    description="Share your thoughts or report issues to help us improve."
                />
            </SettingsSection>
        </div>
    </div>
  );
};