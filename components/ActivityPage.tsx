
import React, { useState, useMemo } from 'react';
import { Notification, PriceAlert, Post, AvailabilityAlert } from '../types';
import { timeSince, formatCurrency } from '../utils/formatters';
import { BellIcon, XMarkIcon, CheckIcon, TrashIcon, ClockIcon } from './Icons';
import { TabButton, Button } from './ui/Button';
import { EmptyState } from './EmptyState';

// --- Reusable Alert List Item Component ---
interface AlertListItemProps {
  post: Post;
  onDelete: (postId: string) => void;
  onViewPost: (postId: string) => void;
  children: React.ReactNode;
}

const AlertListItem: React.FC<AlertListItemProps> = ({ post, onDelete, onViewPost, children }) => {
  return (
    <li className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between gap-4">
      <button onClick={() => onViewPost(post.id)} className="flex items-center gap-3 flex-1 min-w-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-md -m-1 p-1">
        {post.media && post.media.length > 0 && (
          <img
            src={post.media[0].url}
            alt={post.title}
            className="w-16 h-16 object-cover rounded-md flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 truncate">{post.title}</p>
          {children}
        </div>
      </button>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          onClick={(e) => { e.stopPropagation(); onDelete(post.id); }}
          variant="ghost"
          size="icon-sm"
          className="text-gray-600"
          aria-label={`Delete alert for ${post.title}`}
        >
          <TrashIcon className="w-5 h-5" />
        </Button>
      </div>
    </li>
  );
};


interface ActivityPageProps {
  notifications: Notification[];
  alerts: PriceAlert[];
  availabilityAlerts: AvailabilityAlert[];
  posts: Post[];
  onDismiss: (notificationId: string) => void;
  onDismissAll: () => void;
  onNotificationClick: (notification: Notification) => void;
  onDeleteAlert: (postId: string) => void;
  onDeleteAvailabilityAlert: (postId: string) => void;
  onViewPost: (postId: string) => void;
}

export const ActivityPage: React.FC<ActivityPageProps> = ({
  notifications,
  alerts,
  availabilityAlerts,
  posts,
  onDismiss,
  onDismissAll,
  onNotificationClick,
  onDeleteAlert,
  onDeleteAvailabilityAlert,
  onViewPost,
}) => {
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
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in-up max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Activity</h1>
        <div className="border-b border-gray-200">
            <div className="flex space-x-6" role="tablist">
                <TabButton onClick={() => setActiveTab('notifications')} isActive={activeTab === 'notifications'}>
                    Notifications
                    {unreadGeneralCount > 0 && (
                        <span className="ml-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 h-5 min-w-[1.25rem] rounded-full flex items-center justify-center inline-flex align-middle">
                            {unreadGeneralCount}
                        </span>
                    )}
                </TabButton>
                <TabButton onClick={() => setActiveTab('alerts')} isActive={activeTab === 'alerts'}>
                    Alerts
                    {totalAlertsTabBadge > 0 && (
                        <span className="ml-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 h-5 min-w-[1.25rem] rounded-full flex items-center justify-center inline-flex align-middle">
                            {totalAlertsTabBadge}
                        </span>
                    )}
                </TabButton>
            </div>
        </div>
        <div className="py-6 space-y-4">
            {activeTab === 'notifications' ? (
                generalNotifications.length === 0 ? (
                    <EmptyState
                        icon={<BellIcon />}
                        title="No Notifications"
                        description="You have no new interactions."
                        className="py-8"
                    />
                ) : (
                    <div>
                        <div className="flex justify-end mb-4 -mt-2">
                          <Button
                            type="button"
                            onClick={onDismissAll}
                            variant="ghost"
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
                    <EmptyState
                        icon={<BellIcon />}
                        title="No Alerts"
                        description="Set alerts on products to be notified about price drops or availability."
                        className="py-8"
                    />
                ) : (
                    <div className="space-y-6">
                        {hasAlertHistory && (
                            <div>
                                {hasActiveAlerts && <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">Recent Activity</h4>}
                                {renderNotificationList(alertNotifications)}
                            </div>
                        )}
                        
                        {hasActiveAlerts && (
                            <div>
                                {hasAlertHistory && <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3 mt-2">Active Monitors</h4>}
                                <ul className="space-y-3">
                                    {availabilityAlertsWithPostData.map(({post}) => (
                                        <AlertListItem
                                            key={`avail-${post.id}`}
                                            post={post}
                                            onDelete={onDeleteAvailabilityAlert}
                                            onViewPost={onViewPost}
                                        >
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <ClockIcon className="w-4 h-4 text-amber-600" />
                                                <p className="text-sm text-amber-700 font-medium">Waiting for availability</p>
                                            </div>
                                        </AlertListItem>
                                    ))}
                                    {alertsWithPostData.map(({post, targetPrice}) => (
                                        <AlertListItem
                                            key={`price-${post.id}`}
                                            post={post}
                                            onDelete={onDeleteAlert}
                                            onViewPost={onViewPost}
                                        >
                                          <p className="text-sm text-gray-600">
                                            Current: <span className="font-medium text-gray-600">{formatCurrency(post.price)}</span>
                                          </p>
                                          <p className="text-sm text-red-600">
                                            Alert if ≤ <span className="font-bold">{formatCurrency(targetPrice)}</span>
                                          </p>
                                        </AlertListItem>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )
            )}
        </div>
    </div>
  );
};