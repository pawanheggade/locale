
import React, { useRef, useState } from 'react';
import { NotificationSettings, Account } from '../types';
import ModalShell from './ModalShell';
import { useUI } from '../contexts/UIContext';
import { Button } from './ui/Button';

interface SettingsModalProps {
  settings: NotificationSettings;
  onSettingsChange: (newSettings: NotificationSettings) => void;
  onClose: () => void;
  onArchiveAccount: () => void;
  onSignOut: () => void;
  currentAccount: Account;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onSettingsChange, onClose, onArchiveAccount, onSignOut, currentAccount }) => {
  const modalRef = useRef<HTMLDivElement>(null);
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

  const renderFooter = () => (
    <Button type="button" onClick={onClose} variant="glass-red">
      Done
    </Button>
  );

  const isSeller = currentAccount.subscription.tier !== 'Personal';

  return (
    <ModalShell
      panelRef={modalRef}
      onClose={onClose}
      title="Settings"
      footer={renderFooter()}
      panelClassName="w-full max-w-md"
      titleId="settings-modal-title"
    >
      <div className="p-6 space-y-6">
        {isSeller && (
          <fieldset>
            <legend className="text-lg font-medium text-gray-900">In-App Notifications</legend>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <label htmlFor="expiry-alerts-toggle" className="flex flex-col cursor-pointer">
                  <span className="font-medium text-gray-700">Item Expiry Alerts</span>
                  <span className="text-sm text-gray-700">Get notified when your posts are about to expire.</span>
                </label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.expiryAlertsEnabled}
                  id="expiry-alerts-toggle"
                  onClick={() => onSettingsChange({ ...settings, expiryAlertsEnabled: !settings.expiryAlertsEnabled })}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 ${
                    settings.expiryAlertsEnabled ? 'bg-red-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      settings.expiryAlertsEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              
              {settings.expiryAlertsEnabled && (
                <div className="pt-4 border-t border-gray-200 animate-fade-in-up">
                  <label htmlFor="expiry-threshold" className="block text-sm font-medium text-gray-700">
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
            </div>
          </fieldset>
        )}

        <fieldset>
            <legend className="text-lg font-medium text-gray-900">Browser Notifications</legend>
            <div className="mt-4">
                {notificationPermission !== 'granted' ? (
                    <div className="text-left">
                        <p className="text-sm text-gray-700 mb-3">Get notified about new messages and important updates directly on your device.</p>
                        <button
                            onClick={handleEnableNotifications}
                            disabled={notificationPermission === 'denied'}
                            className="w-full text-left px-4 py-3 rounded-full transition-colors disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed glass-button-pill"
                        >
                            <h4 className="font-semibold text-gray-800">Enable Push Notifications</h4>
                            {notificationPermission === 'denied' && <p className="text-xs text-red-600 mt-1">You have blocked notifications. Please enable them in your browser settings.</p>}
                        </button>
                    </div>
                ) : (
                    <div className="p-3 bg-green-50 text-green-800 rounded-md text-sm">
                        Browser push notifications are currently <span className="font-semibold">enabled</span>.
                    </div>
                )}
            </div>
        </fieldset>

        <fieldset>
            <legend className="text-lg font-medium text-gray-900">Support</legend>
            <div className="mt-4">
                <button
                    onClick={() => openModal({ type: 'feedback' })}
                    className="w-full text-left px-4 py-3 rounded-full transition-colors glass-button-pill"
                >
                    <h4 className="font-semibold text-gray-800">Send Feedback</h4>
                    <p className="text-sm text-gray-600">Share your thoughts or report issues to help us improve.</p>
                </button>
            </div>
        </fieldset>
        
        <fieldset>
          <legend className="text-lg font-medium text-gray-900">Account</legend>
          <div className="mt-4 space-y-2">
            <button
              onClick={onArchiveAccount}
              className="w-full text-left px-4 py-3 rounded-full transition-colors glass-button-pill-red-light"
            >
              <h4 className="font-semibold">Archive Account</h4>
              <p className="text-sm">Temporarily deactivate your account. You can reactivate it later.</p>
            </button>
            <button
              onClick={onSignOut}
              className="w-full text-left px-4 py-3 rounded-full transition-colors glass-button-pill-amber-light"
            >
              <h4 className="font-semibold">Sign Out</h4>
              <p className="text-sm">End your session on this device.</p>
            </button>
          </div>
        </fieldset>
      </div>
    </ModalShell>
  );
};
export default SettingsModal;
