import React, { useState, useMemo, useEffect } from 'react';
import { Account, DisplayablePost, Notification, NotificationSettings } from '../types';
import { timeSince } from '../utils/formatters';
import { BellIcon, XMarkIcon, CheckIcon, ClockIcon } from './Icons';
import { TabButton, Button } from './ui/Button';
import { EmptyState } from './EmptyState';
import { PostList } from './PostList';
import { SettingsPage } from './SettingsPage';
import { useUI } from '../contexts/UIContext';
// FIX: Import context hooks
import { useActivity } from '../contexts/ActivityContext';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../contexts/PostsContext';
import { useNavigation } from '../contexts/NavigationContext';

// FIX: Update props interface to remove props
interface ActivityPageProps {}

export const ActivityPage: React.FC<ActivityPageProps> = () => {
  // FIX: Get data from contexts
  const { notifications, markAsRead: onDismiss, markAllAsRead: onDismissAll, settings, onSettingsChange } = useActivity();
  const { currentAccount, viewedPostIds, toggleAccountStatus, signOut: onSignOut } = useAuth();
  const { findPostById } = usePosts();
  const { navigateTo, activityInitialTab: initialTab } = useNavigation();

  const [activeTab, setActiveTab] = useState<'notifications' | 'alerts' | 'history' | 'settings'>(initialTab || 'notifications');
  const { gridView, isTabletOrDesktop } = useUI();

  useEffect(() => {
    if (initialTab) {
        setActiveTab(initialTab);
    }
  }, [initialTab]);
  
  const viewedPosts = useMemo(() => {
    return viewedPostIds.map(id => findPostById(id)).filter((p): p is DisplayablePost => !!p);
  }, [viewedPostIds, findPostById]);

  const onNotificationClick = (notification: Notification) => {
    onDismiss(notification.id);
    if (notification.postId) {
        const post = findPostById(notification.postId);
        if (post) navigateTo('all', { postId: notification.postId });
    } else if (notification.relatedAccountId) {
        const account = { id: notification.relatedAccountId } as Account;
        if (account) navigateTo('account', { account });
    } else if (notification.forumPostId) {
        navigateTo('forumPostDetail', { forumPostId: notification.forumPostId });
    }
  };

  const onArchiveAccount = () => {
    if(currentAccount) {
      toggleAccountStatus(currentAccount.id, false);
    }
  };


  // Split notifications into Alerts (system events) and General (social/account)
  const { alertNotifications, generalNotifications } = useMemo(() => {
      const alertTypes = new Set(['search_alert', 'expiry', 'price_drop', 'availability_alert']);
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
  
  const totalAlertsTabBadge = unreadAlertsCount;

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
                    <Button onClick={() => onDismiss(notification.id)} size="xs" variant="ghost" className="h-6 w-6 p-0 text-gray-400" aria-label="Mark as read">
                        <XMarkIcon className="w-4 h-4" />
                    </Button>
                )}
            </li>
        ))}
    </ul>
  );

  if (!currentAccount) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in-down max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Activity</h1>
        <div className="border-b border-gray-200">
            <div className="flex space-x-6" role="tablist">
                <TabButton onClick={() => setActiveTab('notifications')} isActive={activeTab === 'notifications'}>
                    Updates
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
                <TabButton onClick={() => setActiveTab('history')} isActive={activeTab === 'history'}>
                    History
                </TabButton>
                <TabButton onClick={() => setActiveTab('settings')} isActive={activeTab === 'settings'}>
                    Settings
                </TabButton>
            </div>
        </div>
        <div className="py-6 space-y-4">
            {activeTab === 'notifications' ? (
                generalNotifications.length === 0 ? (
                    <EmptyState
                        icon={<BellIcon />}
                        title="No Updates"
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
            ) : activeTab === 'alerts' ? (
                alertNotifications.length === 0 ? (
                    <EmptyState
                        icon={<BellIcon />}
                        title="No Alerts"
                        description="Triggered alerts, like price drops or availability notifications, will appear here."
                        className="py-8"
                    />
                ) : (
                    renderNotificationList(alertNotifications)
                )
            ) : activeTab === 'history' ? (
                 viewedPosts.length === 0 ? (
                    <EmptyState
                        icon={<ClockIcon />}
                        title="No Viewing History"
                        description="Posts you view will appear here."
                        className="py-8"
                    />
                ) : (
                    <PostList
                        posts={viewedPosts}
                        variant={isTabletOrDesktop ? gridView : 'default'}
                    />
                )
            ) : (
                <div className="-m-4 sm:-m-6 lg:-m-8">
                    <SettingsPage
                        settings={settings}
                        onSettingsChange={onSettingsChange}
                        onArchiveAccount={onArchiveAccount}
                        onSignOut={onSignOut}
                        currentAccount={currentAccount}
                    />
                </div>
            )}
        </div>
    </div>
  );
};