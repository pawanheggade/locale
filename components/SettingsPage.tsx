import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useActivity } from '../contexts/ActivityContext';
import { useUI } from '../contexts/UIContext';
import { SettingsSection } from './SettingsSection';
import { SettingsRow } from './SettingsRow';
import { Switch } from './ui/Switch';
import { useConfirmationModal } from '../hooks/useConfirmationModal';

// This component is now a self-contained View
export const SettingsPage: React.FC = () => {
  const { currentAccount, toggleAccountStatus, signOut } = useAuth();
  const { settings, onSettingsChange } = useActivity();
  const { openModal } = useUI();
  const showConfirmation = useConfirmationModal();

  if (!currentAccount) return null;

  const isSeller = currentAccount.subscription.tier !== 'Personal';
  
  const handleSignOutClick = () => {
    showConfirmation({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      onConfirm: signOut,
      confirmText: 'Sign Out',
      confirmClassName: 'bg-red-600 text-white',
    });
  };

  const handleArchiveAccount = () => {
    toggleAccountStatus(currentAccount.id, false);
  };

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
                        <div className="pt-4 mt-4 border-t border-gray-200/80 animate-fade-in-down">
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
                    onClick={handleSignOutClick}
                    title="Sign Out"
                    description="End your session on this device."
                    variant="destructive"
                />
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