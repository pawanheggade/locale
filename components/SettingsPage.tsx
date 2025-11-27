import React, { useState } from 'react';
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
  const { addToast, openModal } = useUI();
  const [notificationPermission, setNotificationPermission] = useState('Notification' in window ? Notification.permission : 'default');

  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) {
        addToast("This browser does not support desktop notifications.", 'error');
        return;
    }

    if (notificationPermission === 'granted') {
        addToast("Notifications are already enabled.", 'success');
        return;
    }

    try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission === 'granted') {
            addToast("Notifications enabled successfully!", 'success');
            new Notification("Notifications Enabled", { body: "You will now receive updates from Locale." });
        } else {
            addToast("Notification permission was not granted.", 'error');
        }
    } catch (error) {
        console.error("Error requesting notification permission:", error);
        addToast("Failed to enable notifications.", 'error');
    }
  };

  const isSeller = currentAccount.subscription.tier !== 'Personal';

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in-up max-w-2xl mx-auto">
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
                        <div className="pt-4 mt-4 border-t border-gray-200 animate-fade-in-up">
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

            <SettingsSection title="Browser Notifications">
                {notificationPermission !== 'granted' ? (
                    <SettingsRow
                        onClick={handleEnableNotifications}
                        title="Enable Push Notifications"
                        description={
                            notificationPermission === 'denied' 
                            ? "You have blocked notifications. Please enable them in your browser settings."
                            : "Get notified about new messages and important updates."
                        }
                        variant={notificationPermission === 'denied' ? 'destructive' : 'default'}
                    />
                ) : (
                    <div className="p-3 bg-green-50 text-green-800 rounded-md text-sm">
                        Browser push notifications are currently <span className="font-semibold">enabled</span>.
                    </div>
                )}
            </SettingsSection>

            <SettingsSection title="Support">
                 <SettingsRow
                    onClick={() => openModal({ type: 'feedback' })}
                    title="Send Feedback"
                    description="Share your thoughts or report issues to help us improve."
                />
            </SettingsSection>
            
            <SettingsSection title="Account">
                <SettingsRow
                    onClick={onArchiveAccount}
                    title="Archive Account"
                    description="Temporarily deactivate your account. You can reactivate it later."
                    variant="warning"
                />
                <SettingsRow
                    onClick={onSignOut}
                    title="Sign Out"
                    description="End your session on this device."
                    variant="destructive"
                />
            </SettingsSection>
        </div>
    </div>
  );
};
