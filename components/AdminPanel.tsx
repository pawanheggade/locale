

import React, { useState, useRef } from 'react';
import { Account, DisplayablePost, PostCategory, Subscription, Report, AdminView, ForumPost, DisplayableForumPost, ForumComment, Feedback } from '../types';
import { FlagIcon, UserIcon, HashtagIcon, ChartBarIcon, PencilIcon, ChevronDownIcon, ArchiveBoxIcon, ChatBubbleBottomCenterTextIcon, DocumentIcon } from './Icons';
import { DataVisualizationView } from './DataVisualizationView';
import { AdminPagesView } from './AdminPagesView';
import { AccountsView } from './admin/AccountsView';
import { PostsView } from './admin/PostsView';
import { ReportsView } from './admin/ReportsView';
import { CategoriesView } from './admin/CategoriesView';
import { FeedbackView } from './admin/FeedbackView';
import { useClickOutside } from '../hooks/useClickOutside';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

interface AdminPanelProps {
  accounts: Account[];
  allPosts: DisplayablePost[];
  currentAccount: Account;
  onDeleteAccount: (account: Account) => void;
  onUpdateAccountRole: (accountId: string, role: 'account' | 'admin') => void;
  onEditAccount: (account: Account) => void;
  onToggleAccountStatus: (account: Account) => void;
  onApproveAccount: (accountId: string) => void;
  onRejectAccount: (account: Account) => void;
  categories: PostCategory[];
  onAddCategory: (name: string) => void;
  onUpdateCategory: (oldName: string, newName: string) => void;
  onDeleteCategory: (name: string) => void;
  onUpdateSubscription: (accountId: string, tier: Subscription['tier']) => void;
  reports: Report[];
  onReportAction: (report: Report, action: 'dismiss' | 'delete') => void;
  onViewPost: (post: DisplayablePost) => void;
  onEditPost: (postId: string) => void;
  onDeletePost: (postId: string) => void;
  termsContent: string;
  privacyContent: string;
  initialView?: AdminView;
  // Forum props for moderation
  forumPosts: ForumPost[];
  getPostWithComments: (postId: string) => DisplayableForumPost | null;
  onViewForumPost: (postId: string) => void;
  // Forum category management
  forumCategories: string[];
  onAddForumCategory: (name: string) => void;
  onUpdateForumCategory: (oldName: string, newName: string) => void;
  onDeleteForumCategory: (name: string) => void;
  // Price Unit management
  priceUnits: string[];
  onAddPriceUnit: (name: string) => void;
  onUpdatePriceUnit: (oldName: string, newName: string) => void;
  onDeletePriceUnit: (name: string) => void;
  // Feedback
  feedbackList: Feedback[];
  onDeleteFeedback: (id: string) => void;
  onToggleFeedbackArchive: (id: string) => void;
  onMarkFeedbackAsRead: (id: string) => void;
  onBulkFeedbackAction: (ids: string[], action: 'markRead' | 'archive' | 'unarchive' | 'delete') => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = (props) => {
  const [view, setView] = useState<AdminView>(props.initialView || 'accounts');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setIsDropdownOpen(false), isDropdownOpen);

  const handleViewChange = (newView: AdminView) => {
    setView(newView);
    setIsDropdownOpen(false);
  };

  const navItems: { id: AdminView, label: string, icon: React.ReactNode, badge?: number }[] = [
    { id: 'accounts', label: 'Accounts', icon: <UserIcon className="w-5 h-5" /> },
    { id: 'posts', label: 'Posts', icon: <ArchiveBoxIcon className="w-5 h-5" /> },
    { id: 'categories', label: 'Categories', icon: <HashtagIcon className="w-5 h-5" /> },
    { id: 'pages', label: 'Pages', icon: <DocumentIcon className="w-5 h-5" /> },
    { id: 'reports', label: 'Reports', icon: <FlagIcon className="w-5 h-5" />, badge: props.reports.length },
    { id: 'feedback', label: 'Feedback', icon: <ChatBubbleBottomCenterTextIcon className="w-5 h-5" />, badge: props.feedbackList.filter(f => !f.isRead).length },
    { id: 'analytics', label: 'Analytics', icon: <ChartBarIcon className="w-5 h-5" /> },
  ];

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
        {/* Dropdown for smaller screens */}
        <div className="relative md:hidden" ref={dropdownRef}>
          <Button 
            onClick={() => setIsDropdownOpen(prev => !prev)} 
            variant="overlay-dark"
            className="flex items-center gap-2 px-3 py-2 font-semibold text-gray-600"
          >
            <span>{navItems.find(item => item.id === view)?.label}</span>
             {(() => {
                 const currentItem = navItems.find(item => item.id === view);
                 if (currentItem && currentItem.badge && currentItem.badge > 0) {
                     return (
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold">
                            {currentItem.badge}
                        </span>
                     )
                 }
                 return null;
             })()}
            <ChevronDownIcon className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </Button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl z-10 p-2 animate-zoom-in origin-top-right">
              {navItems.map(item => (
                <Button
                  key={item.id}
                  onClick={() => handleViewChange(item.id)}
                  variant={view === item.id ? "overlay-red" : "overlay-dark"}
                  className={`w-full justify-between px-3 py-2 h-auto rounded-lg mb-1 last:mb-0 ${view === item.id ? 'bg-red-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && item.badge > 0 && (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold">
                        {item.badge}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Navigation for larger screens */}
        <nav className="hidden md:block md:col-span-1 space-y-2">
          {navItems.map(item => (
            <Button
              key={item.id}
              onClick={() => handleViewChange(item.id)}
              variant="ghost"
              className={cn(
                'w-full justify-between px-4 py-2.5 text-sm font-semibold rounded-full',
                view === item.id ? 'bg-red-100 text-red-700' : 'text-gray-600'
              )}
            >
              <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
              </div>
              {item.badge && item.badge > 0 && (
                <span className={cn(
                  'flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold',
                  view === item.id ? 'bg-red-600 text-white' : 'bg-red-500 text-white'
                )}>
                    {item.badge}
                </span>
              )}
            </Button>
          ))}
        </nav>
        {/* Main Content Area */}
        <main className="md:col-span-3">
          {view === 'accounts' && <AccountsView {...props} />}
          {view === 'posts' && <PostsView {...props} />}
          {view === 'reports' && <ReportsView {...props} />}
          {view === 'categories' && <CategoriesView
            categories={props.categories}
            onAddCategory={props.onAddCategory}
            onUpdateCategory={props.onUpdateCategory}
            onDeleteCategory={props.onDeleteCategory}
            forumCategories={props.forumCategories}
            onAddForumCategory={props.onAddForumCategory}
            onUpdateForumCategory={props.onUpdateForumCategory}
            onDeleteForumCategory={props.onDeleteForumCategory}
            priceUnits={props.priceUnits}
            onAddPriceUnit={props.onAddPriceUnit}
            onUpdatePriceUnit={props.onUpdatePriceUnit}
            onDeletePriceUnit={props.onDeletePriceUnit}
          />}
          {view === 'analytics' && <DataVisualizationView accounts={props.accounts} allPosts={props.allPosts} categories={props.categories} />}
          {view === 'pages' && <AdminPagesView termsContent={props.termsContent} privacyContent={props.privacyContent} />}
          {view === 'feedback' && <FeedbackView feedbackList={props.feedbackList} accounts={props.accounts} onDeleteFeedback={props.onDeleteFeedback} onToggleFeedbackArchive={props.onToggleFeedbackArchive} onMarkFeedbackAsRead={props.onMarkFeedbackAsRead} onBulkAction={props.onBulkFeedbackAction} />}
        </main>
      </div>
    </div>
  );
};