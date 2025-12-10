import React, { createContext, useContext, useMemo, useCallback, useEffect, useRef } from 'react';
import { Notification, PriceAlert, AvailabilityAlert, Post, NotificationSettings } from '../types';
import { usePersistentState } from '../hooks/usePersistentState';
import { useAuth } from './AuthContext';
import { useUI } from './UIContext';
import { STORAGE_KEYS } from '../lib/constants';
import { formatCurrency } from '../utils/formatters';

interface ActivityContextType {
  notifications: Notification[];
  priceAlerts: PriceAlert[];
  availabilityAlerts: AvailabilityAlert[];
  settings: NotificationSettings;
  unreadCount: number;
  totalActivityCount: number;
  
  addNotification: (notificationData: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearAllNotifications: () => void;
  
  setPriceAlert: (postId: string, targetPrice: number) => void;
  deletePriceAlert: (postId: string) => void;
  
  setAvailabilityAlert: (postId: string) => void;
  deleteAvailabilityAlert: (postId: string) => void;
  toggleAvailabilityAlert: (postId: string) => void;
  checkAvailabilityAlerts: (post: Post) => void;
  checkPriceAlerts: (updatedPost: Post, originalPost: Post) => void;
  onSettingsChange: (newSettings: NotificationSettings) => void;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

const initialActivityData = {
  notifications: [],
  priceAlerts: [],
  availabilityAlerts: [],
  settings: {
    expiryAlertsEnabled: true,
    expiryThresholdDays: 3,
  },
};

export const ActivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentAccount } = useAuth();
  const { addToast } = useUI();

  // We store all activity data in one object keyed by userId to persist across logins
  const [allActivityData, setAllActivityData] = usePersistentState<Record<string, {
    notifications: Notification[];
    priceAlerts: PriceAlert[];
    availabilityAlerts: AvailabilityAlert[];
    settings: NotificationSettings;
  }>>(STORAGE_KEYS.USER_ACTIVITY_DATA, {});

  const currentUserId = currentAccount?.id;

  // Helper to access current user's data safely
  const userData = useMemo(() => {
    if (!currentUserId) return initialActivityData;
    const data = allActivityData[currentUserId] || initialActivityData;
    return {
      ...data,
      settings: { ...initialActivityData.settings, ...data.settings },
    };
  }, [allActivityData, currentUserId]);

  const notifications = userData.notifications;
  const priceAlerts = userData.priceAlerts;
  const availabilityAlerts = userData.availabilityAlerts;
  const settings = userData.settings;
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const totalActivityCount = unreadCount;

  const updateUserData = useCallback((updates: Partial<typeof userData>) => {
    if (!currentUserId) return;
    setAllActivityData(prev => ({
      ...prev,
      [currentUserId]: {
        ...(prev[currentUserId] || initialActivityData),
        ...updates
      }
    }));
  }, [currentUserId, setAllActivityData]);

  // --- Notifications ---

  const addNotification = useCallback((data: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    // If the recipient is the current user, update state