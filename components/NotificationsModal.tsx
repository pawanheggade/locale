
import React, { useRef, useState, useMemo } from 'react';
import { Notification, PriceAlert, Post, AvailabilityAlert } from '../types';
import ModalShell from './ModalShell';
import { timeSince, formatCurrency } from '../utils/formatters';
import { BellIcon, XMarkIcon, CheckIcon, TrashIcon, ClockIcon } from './Icons';
import { TabButton, Button } from './ui/Button';

interface PriceAlertListItemProps {
  alert: PriceAlert & { post: Post };
  onDelete: (postId: string) => void;
}

const PriceAlertListItem: React.FC<PriceAlertListItemProps> = ({ alert, onDelete }) => {
  const { post, targetPrice } = alert;

  return (
    <li className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {post.media && post.media.length > 0 && (
          <img
            src={post.media[0].url}
            alt={post.title}
            className="w-16 h-16 object-cover rounded-md flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 truncate">{post.title}</p>
          <p className="text-sm text-gray-700">
            Current: <span className="font-medium text-gray-700">{formatCurrency(post.price)}</span>
          </p>
          <p className="text-sm text-red-600">
            Alert if ≤ <span className="font-bold">{formatCurrency(targetPrice)}</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          onClick={() => onDelete(post.id)}
          variant="glass"
          size="icon-sm"
          className="text-gray-500"
          aria-label={`Delete alert for ${post.title}`}
        >
          <TrashIcon className="w-5 h-5" />
        </Button>
      </div>
    </li>
  );
};

interface AvailabilityAlertListItemProps {
    alert: AvailabilityAlert & { post: Post };
    onDelete: (postId: string) => void;
}

const AvailabilityAlertListItem: React.FC<AvailabilityAlertListItemProps> = ({ alert, onDelete }) => {
    const { post } = alert;
  
    return (
      <li className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {post.media && post.media.length > 0 && (
            <img
              src={post.media[0].url}
              alt={post.title}
              className="w-16 h-16 object-cover rounded-md flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 truncate">{post.title}</p>
            <div className="flex items-center gap-1.5 mt-1">
                <ClockIcon className="w-4 h-4 text-amber-600" />
                <p className="text-sm text-amber-700 font-medium">Waiting for availability</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            onClick={() => onDelete(post.id)}
            variant="glass"
            size="icon-sm"
            className="text-gray-500"
            aria-label={`Delete availability alert for ${post.title}`}
          >
            <TrashIcon className="w-5 h-5" />
          </Button>
        </div>
      </li>
    );
  };


interface NotificationsModalProps {
  notifications: Notification[];
  alerts: PriceAlert[];
  availabilityAlerts: AvailabilityAlert[];
  posts: Post[];
  onDismiss: (notificationId: string) => void;
  onDismissAll: () => void;
  onNotificationClick: (notification: Notification) => void;
  onDeleteAlert: (postId: string) => void;
  onDeleteAvailabilityAlert: (postId: string) => void;
  onClose: () => void;
}

const NotificationsModal: React.FC<NotificationsModalProps> = ({
  notifications,
  alerts,
  availabilityAlerts,
  posts,
  onDismiss,
  onDismissAll,
  onNotificationClick,
  onDeleteAlert,
  onDeleteAvailabilityAlert,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'notifications' | 'alerts'>('notifications');

  // Split notifications into Alerts (system events) and General (social/account)
  const { alertNotifications, generalNotifications } = useMemo(() => {
      const alertTypes = new Set(['search_alert', 'expiry']);
      return notifications.reduce((acc, n) => {
          if (alertTypes.has(n.type)) {
              acc.alertNotifications.push(n);
          } else {
              acc.generalNotifications.push(n);
          }
          return acc;
      }, { alertNotifications: [] as Notification[], generalNotifications: [] as Notification[] });
  }, [notifications]);

  const unreadGeneralCount = generalNotifications.filter(n => !n.isRead).length;
  const unreadAlertsCount = alertNotifications.filter(n => !n.isRead).length;
  
  const activeAlertsCount = alerts.length + availabilityAlerts.length;
  const totalAlertsTabBadge = unreadAlertsCount + activeAlertsCount;

  const alertsWithPostData = alerts
    .map(alert => {
      const post = posts.find(p => p.id === alert.postId);
      return post ? { ...alert, post } : null;
    })
    .filter((item): item is (PriceAlert & { post: Post }) => item !== null);
    
  const availabilityAlertsWithPostData = availabilityAlerts
    .map(alert => {
        const post = posts.find(p => p.id === alert.postId);
        return post ? { ...alert, post } : null;
    })
    .filter((item): item is (AvailabilityAlert & { post: Post }) => item !== null);
    
  const hasActiveAlerts = alertsWithPostData.length > 0 || availabilityAlertsWithPostData.length > 0;
  const hasAlertHistory = alertNotifications.length > 0;

  const renderNotificationList = (items: Notification[]) => (
     <ul className="space-y-3">
        {items.map((notification) => (
            <li key={notification.id} className={`p-3 rounded-lg flex items-start gap-3 transition-colors ${notification.isRead ? 'bg-gray-50' : 'bg-gray-100'}`}>
                <div className="flex-1">
                    <button onClick={() => onNotificationClick(notification)} className="text-left w-full">
                        <p className="text-sm text-gray-800">{notification.message}</p>
                    </button>
                    <p className="text-xs text-gray-600 mt-1">{timeSince(notification.timestamp)}</p>
                </div>
                {!notification.isRead && (
                    <Button onClick={() => onDismiss(notification.id)} size="xs" variant="ghost" className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600" aria-label="Mark as read">
                        <XMarkIcon className="w-4 h-4" />
                    </Button>
                )}
            </li>
        ))}
    </ul>
  );

  return (
    <ModalShell
      panelRef={modalRef}
      onClose={onClose}
      title="Activity"
      panelClassName="w-full max-w-lg"
      titleId="notifications-modal-title"
    >
        <div className="p-4 border-b">
            <div className="flex space-x-2 p-1 bg-gray-100 rounded-full overflow-x-auto hide-scrollbar" role="tablist">
                <TabButton onClick={() => setActiveTab('notifications')} isActive={activeTab === 'notifications'} size="sm">
                    Notifications
                    {unreadGeneralCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 h-5 min-w-[1.25rem] rounded-full flex items-center justify-center">
                            {unreadGeneralCount}
                        </span>
                    )}
                </TabButton>
                <TabButton onClick={() => setActiveTab('alerts')} isActive={activeTab === 'alerts'} size="sm">
                    Alerts
                    {totalAlertsTabBadge > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 h-5 min-w-[1.25rem] rounded-full flex items-center justify-center">
                            {totalAlertsTabBadge}
                        </span>
                    )}
                </TabButton>
            </div>
        </div>
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {activeTab === 'notifications' ? (
                generalNotifications.length === 0 ? (
                    <div className="text-center py-12 flex flex-col items-center">
                        <BellIcon className="w-16 h-16 text-gray-300" />
                        <h3 className="mt-4 text-lg font-medium text-gray-800">No Notifications</h3>
                        <p className="mt-1 text-sm text-gray-700">You have no new interactions.</p>
                    </div>
                ) : (
                    <div>
                        <div className="flex justify-end mb-4 -mt-2">
                          <Button
                            type="button"
                            onClick={onDismissAll}
                            variant="glass"
                            size="sm"
                            className="gap-1.5 text-gray-600"
                          >
                            <CheckIcon className="w-4 h-4" />
                            Mark all as read
                          </Button>
                        </div>
                        {renderNotificationList(generalNotifications)}
                    </div>
                )
            ) : (
                (!hasActiveAlerts && !hasAlertHistory) ? (
                    <div className="text-center py-12 flex flex-col items-center">
                        <BellIcon className="w-16 h-16 text-gray-300" />
                        <h3 className="mt-4 text-lg font-medium text-gray-800">No Alerts</h3>
                        <p className="mt-1 text-sm text-gray-700 max-w-xs">Set alerts on products to be notified about price drops or availability.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {hasAlertHistory && (
                            <div>
                                {hasActiveAlerts && <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Recent Activity</h4>}
                                {renderNotificationList(alertNotifications)}
                            </div>
                        )}
                        
                        {hasActiveAlerts && (
                            <div>
                                {hasAlertHistory && <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 mt-2">Active Monitors</h4>}
                                <ul className="space-y-3">
                                    {availabilityAlertsWithPostData.map((alert) => (
                                        <AvailabilityAlertListItem
                                            key={alert.id}
                                            alert={alert}
                                            onDelete={onDeleteAvailabilityAlert}
                                        />
                                    ))}
                                    {alertsWithPostData.map((alert) => (
                                        <PriceAlertListItem
                                            key={alert.id}
                                            alert={alert}
                                            onDelete={onDeleteAlert}
                                        />
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )
            )}
        </div>
    </ModalShell>
  );
};

export default NotificationsModal;
