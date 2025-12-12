
import React, { createContext, useContext, useMemo, useCallback } from 'react';
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
    // If the recipient is the current user, update state directly. 
    // If it's another user (e.g. triggered by current user's action), we update the store for that ID.
    const newNotification: Notification = {
      ...data,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      isRead: false,
    };

    setAllActivityData(prev => {
      const targetId = data.recipientId;
      const targetData = prev[targetId] || initialActivityData;
      return {
        ...prev,
        [targetId]: {
          ...targetData,
          notifications: [newNotification, ...targetData.notifications]
        }
      };
    });

    // Browser Notification if it's for the logged in user
    if (data.recipientId === currentUserId && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Locale', { body: data.message });
    }
  }, [currentUserId, setAllActivityData]);

  const markAsRead = useCallback((id: string) => {
    updateUserData({
      notifications: notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
    });
  }, [notifications, updateUserData]);

  const markAllAsRead = useCallback(() => {
    updateUserData({
      notifications: notifications.map(n => ({ ...n, isRead: true }))
    });
  }, [notifications, updateUserData]);

  const clearAllNotifications = useCallback(() => {
    updateUserData({ notifications: [] });
  }, [updateUserData]);

  // --- Settings ---
  const onSettingsChange = useCallback((newSettings: NotificationSettings) => {
    updateUserData({ settings: newSettings });
  }, [updateUserData]);


  // --- Alerts ---

  const setPriceAlert = useCallback((postId: string, targetPrice: number) => {
    const existingIndex = priceAlerts.findIndex(a => a.postId === postId);
    let newAlerts = [...priceAlerts];
    if (existingIndex > -1) {
      newAlerts[existingIndex] = { ...newAlerts[existingIndex], targetPrice };
    } else {
      newAlerts.push({ id: `alert-${Date.now()}`, postId, targetPrice });
    }
    updateUserData({ priceAlerts: newAlerts });
    addToast('Price alert set!', 'success');
  }, [priceAlerts, updateUserData, addToast]);

  const deletePriceAlert = useCallback((postId: string) => {
    updateUserData({
      priceAlerts: priceAlerts.filter(a => a.postId !== postId)
    });
    addToast('Price alert removed.', 'success');
  }, [priceAlerts, updateUserData, addToast]);

  const setAvailabilityAlert = useCallback((postId: string) => {
    if (!availabilityAlerts.some(a => a.postId === postId)) {
      updateUserData({
        availabilityAlerts: [...availabilityAlerts, { id: `avail-${Date.now()}`, postId }]
      });
      addToast('You will be notified when available.', 'success');
    }
  }, [availabilityAlerts, updateUserData, addToast]);

  const deleteAvailabilityAlert = useCallback((postId: string) => {
    updateUserData({
      availabilityAlerts: availabilityAlerts.filter(a => a.postId !== postId)
    });
    addToast('Availability alert removed.', 'success');
  }, [availabilityAlerts, updateUserData, addToast]);

  const toggleAvailabilityAlert = useCallback((postId: string) => {
    if (availabilityAlerts.some(a => a.postId === postId)) {
      deleteAvailabilityAlert(postId);
    } else {
      setAvailabilityAlert(postId);
    }
  }, [availabilityAlerts, deleteAvailabilityAlert, setAvailabilityAlert]);

  const checkPriceAlerts = useCallback((updatedPost: Post, originalPost: Post) => {
    const newPrice = updatedPost.salePrice ?? updatedPost.price;
    if (newPrice === undefined) return;

    setAllActivityData(prev => {
        const nextState = { ...prev };
        let hasChanges = false;
        
        Object.keys(nextState).forEach(userId => {
            const userActivity = nextState[userId] || initialActivityData;
            const matchingAlerts = userActivity.priceAlerts.filter(a => a.postId === updatedPost.id);
            
            if (matchingAlerts.length > 0) {
                const triggeredAlerts: PriceAlert[] = [];
                
                matchingAlerts.forEach(alert => {
                    // Alert triggers if the new price is at or below the target price
                    if (newPrice <= alert.targetPrice) {
                        triggeredAlerts.push(alert);
                    }
                });

                if (triggeredAlerts.length > 0) {
                    // Remove triggered alerts
                    const remainingAlerts = userActivity.priceAlerts.filter(a => !triggeredAlerts.some(triggered => triggered.id === a.id));

                    const newNotifications: Notification[] = triggeredAlerts.map(alert => {
                        const originalPriceFormatted = formatCurrency(originalPost.salePrice ?? originalPost.price);
                        const newPriceFormatted = formatCurrency(newPrice);
                        return {
                            id: `notif-price-${Date.now()}-${alert.id}`,
                            recipientId: userId,
                            message: `Price drop for "${updatedPost.title}"! It's now ${newPriceFormatted}, down from ${originalPriceFormatted}.`,
                            timestamp: Date.now(),
                            isRead: false,
                            type: 'price_drop',
                            postId: updatedPost.id,
                        };
                    });

                    nextState[userId] = {
                        ...userActivity,
                        priceAlerts: remainingAlerts,
                        notifications: [...newNotifications, ...userActivity.notifications],
                    };
                    hasChanges = true;
                }
            }
        });

        return hasChanges ? nextState : prev;
    });
  }, [setAllActivityData]);

  const checkAvailabilityAlerts = useCallback((post: Post) => {
    setAllActivityData(prev => {
      const nextState = { ...prev };
      let hasChanges = false;

      Object.keys(nextState).forEach(userId => {
        const userActivity = nextState[userId] || initialActivityData;
        const alertIndex = userActivity.availabilityAlerts.findIndex(a => a.postId === post.id);
        
        if (alertIndex > -1) {
          const newAlerts = [...userActivity.availabilityAlerts];
          newAlerts.splice(alertIndex, 1);
          
          const notif: Notification = {
            id: `notif-avail-${Date.now()}`,
            recipientId: userId,
            message: `Good news! "${post.title}" is available again.`,
            timestamp: Date.now(),
            isRead: false,
            type: 'availability_alert',
            postId: post.id
          };

          nextState[userId] = {
            ...userActivity,
            availabilityAlerts: newAlerts,
            notifications: [notif, ...userActivity.notifications]
          };
          hasChanges = true;
        }
      });

      return hasChanges ? nextState : prev;
    });
  }, [setAllActivityData]);

  const value = useMemo(() => ({
    notifications,
    priceAlerts,
    availabilityAlerts,
    settings,
    unreadCount,
    totalActivityCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    setPriceAlert,
    deletePriceAlert,
    setAvailabilityAlert,
    deleteAvailabilityAlert,
    toggleAvailabilityAlert,
    checkAvailabilityAlerts,
    checkPriceAlerts,
    onSettingsChange,
  }), [
    notifications, priceAlerts, availabilityAlerts, settings, unreadCount, totalActivityCount,
    addNotification, markAsRead, markAllAsRead, clearAllNotifications,
    setPriceAlert, deletePriceAlert, setAvailabilityAlert, deleteAvailabilityAlert,
    toggleAvailabilityAlert,
    checkAvailabilityAlerts,
    checkPriceAlerts,
    onSettingsChange,
  ]);

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
};
