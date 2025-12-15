
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useActivity } from '../contexts/ActivityContext';
import { useUI } from '../contexts/UIContext';
import { SettingsSection } from './SettingsSection';
import { SettingsRow } from './SettingsRow';
import { Switch } from './ui/Switch';

// This component is now a self-contained View
export const SettingsPage: React.FC = () => {
  const { currentAccount, toggleAccountStatus } = useAuth();
  const { settings, onSettingsChange } = useActivity();
  const { openModal } = useUI();

  if (!currentAccount) return null;

  const isSeller = currentAccount.subscription.tier !== 'Personal';

  const handleArchiveAccount = () => {
    toggleAccountStatus(currentAccount.id, false);
  };

  return (
    <div className="animate-fade-in-down max-w-2xl mx-auto">
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
                        <div className="pt-4 mt-4 border-t border-gray-300/80 animate-fade-in-down">
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
                                className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-red-600"
                                />
                                <span className="font-semibold text-gray-800 w-20 text-center bg-gray-50 py-1 rounded-md">
                                {settings.expiryThresholdDays} day{settings.expiryThresholdDays > 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>
                    )}
                </SettingsSection>
            )}

            <SettingsSection title="Account">
                <SettingsRow
                    onClick={handleArchiveAccount}
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
