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
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../contexts/PostsContext';
import { useForum } from '../contexts/ForumContext';
import { useNavigation } from '../App';
import { useUI } from '../contexts/UIContext';
import { useConfirmationModal } from '../hooks/useConfirmationModal';

interface AdminPanelProps {
  initialView?: AdminView;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ initialView }) => {
  const [view, setView] = useState<AdminView>(initialView || 'accounts');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { 
    accounts, currentAccount, deleteAccount, updateAccountRole, toggleAccountStatus, approveAccount, rejectAccount, updateSubscription,
    reports, setReports, feedbackList, setFeedbackList, termsContent, setTermsContent, privacyContent, setPrivacyContent, addFeedback
  } = useAuth();
  
  const { 
    // FIX: rename allDisplayablePosts to allPosts for consistency and to fix reference error
    posts: allPosts, archivedPosts, categories, createPost: createPostInContext, updatePost: updatePostInContext, 
    deletePostPermanently, addCategory, updateCategory, deleteCategory, findPostById, priceUnits, addPriceUnit, updatePriceUnit, deletePriceUnit
  } = usePosts();

  const { 
    posts: forumPosts, getPostWithComments, categories: forumCategories, addCategory: addForumCategory, 
    updateCategory: updateForumCategory, deleteCategory: deleteForumCategory 
  } = useForum();
  
  const { navigateTo } = useNavigation();
  const { openModal } = useUI();
  const showConfirmation = useConfirmationModal();
  
  useClickOutside(dropdownRef, () => setIsDropdownOpen(false), isDropdownOpen);

  const handleToggleFeedbackArchive = (feedbackId: string) => {
      setFeedbackList(prev => prev.map(f => f.id === feedbackId ? { ...f, isArchived: !f.isArchived } : f));
  };

  const handleDeleteFeedback = (feedbackId: string) => {
      showConfirmation({
        title: 'Delete Feedback',
        message: 'Are you sure you want to delete this feedback?',
        onConfirm: () => {
            setFeedbackList(prev => prev.filter(f => f.id !== feedbackId));
        },
        confirmText: 'Delete',
        confirmClassName: 'bg-red-600 text-white',
      });
  };

  const handleMarkFeedbackAsRead = (feedbackId: string) => {
    setFeedbackList(prev => prev.map(f => f.id === feedbackId ? { ...f, isRead: true } : f));
  };

  const handleBulkFeedbackAction = (ids: string[], action: 'markRead' | 'archive' | 'unarchive' | 'delete') => {
      if (action === 'delete') {
          showConfirmation({
            title: 'Delete Feedback',
            message: `Are you sure you want to delete ${ids.length} feedback items?`,
            onConfirm: () => {
                setFeedbackList(prev => prev.filter(f => !ids.includes(f.id)));
            },
            confirmText: 'Delete',
            confirmClassName: 'bg-red-600 text-white',
          });
      } else {
          setFeedbackList(prev => {
              return prev.map(f => {
                  if (ids.includes(f.id)) {
                      if (action === 'markRead') return { ...f, isRead: true };
                      if (action === 'archive') return { ...f, isArchived: true };
                      if (action === 'unarchive') return { ...f, isArchived: false };
                  }
                  return f;
              });
          });
      }
  };

  const handleViewChange = (newView: AdminView) => {
    setView(newView);
    setIsDropdownOpen(false);
  };

  const navItems: { id: AdminView, label: string, icon: React.ReactNode, badge?: number }[] = [
    { id: 'accounts', label: 'Accounts', icon: <UserIcon className="w-5 h-5" /> },
    { id: 'posts', label: 'Posts', icon: <ArchiveBoxIcon className="w-5 h-5" /> },
    { id: 'categories', label: 'Categories', icon: <HashtagIcon className="w-5 h-5" /> },
    { id: 'pages', label: 'Pages', icon: <DocumentIcon className="w-5 h-5" /> },
    { id: 'reports', label: 'Reports', icon: <FlagIcon className="w-5 h-5" />, badge: reports.length },
    { id: 'feedback', label: 'Feedback', icon: <ChatBubbleBottomCenterTextIcon className="w-5 h-5" />, badge: feedbackList.filter(f => !f.isRead).length },
    { id: 'analytics', label: 'Analytics', icon: <ChartBarIcon className="w-5 h-5" /> },
  ];

  const viewProps = {
    // FIX: Pass allPosts and fix missing/mismatched props for AccountsView and FeedbackView
    accounts, allPosts, currentAccount: currentAccount!, 
    onDeleteAccount: (account: Account) => deleteAccount(account.id),
    onUpdateAccountRole: updateAccountRole,
    onUpdateSubscription: updateSubscription,
    onEditAccount: (acc: Account) => openModal({ type: 'editAccount', data: acc }), 
    onToggleAccountStatus: (acc: Account) => toggleAccountStatus(acc.id, true), 
    onApproveAccount: approveAccount, onRejectAccount: rejectAccount, categories, addCategory, 
    updateCategory, deleteCategory, reports, 
    onReportAction: (report: Report, action: 'dismiss' | 'delete') => { if(action==='delete') { /* delete logic handled in context */ } setReports(prev => prev.filter(r => r.id !== report.id)); }, 
    feedbackList, onDeleteFeedback: handleDeleteFeedback, onToggleFeedbackArchive: handleToggleFeedbackArchive, 
    onMarkFeedbackAsRead: handleMarkFeedbackAsRead, 
    onBulkAction: handleBulkFeedbackAction, 
    onViewPost: (post: DisplayablePost) => navigateTo('postDetail', { postId: post.id }), 
    onEditPost: (postId: string) => navigateTo('editPost', { postId }), 
    onDeletePost: deletePostPermanently, termsContent, onUpdateTerms: setTermsContent, 
    privacyContent, onUpdatePrivacy: setPrivacyContent, initialView, forumPosts, 
    getPostWithComments, onViewForumPost: (postId: string) => navigateTo('forumPostDetail', { forumPostId: postId }), 
    forumCategories, onAddForumCategory: addForumCategory, onUpdateForumCategory: updateForumCategory, 
    onDeleteForumCategory: deleteCategory, priceUnits, onAddPriceUnit: addPriceUnit, onUpdatePriceUnit: updatePriceUnit, 
    onDeletePriceUnit: deletePriceUnit
  };

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
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
        <main className="md:col-span-3">
          {view === 'accounts' && <AccountsView {...viewProps} />}
          {view === 'posts' && <PostsView {...viewProps} />}
          {view === 'reports' && <ReportsView {...viewProps} />}
          {view === 'categories' && <CategoriesView
            categories={categories} onAddCategory={addCategory} onUpdateCategory={updateCategory} onDeleteCategory={deleteCategory}
            forumCategories={forumCategories} onAddForumCategory={addForumCategory} onUpdateForumCategory={updateForumCategory} onDeleteForumCategory={deleteForumCategory}
            priceUnits={priceUnits} onAddPriceUnit={addPriceUnit} onUpdatePriceUnit={updatePriceUnit} onDeletePriceUnit={deletePriceUnit}
          />}
          {view === 'analytics' && <DataVisualizationView accounts={accounts} allPosts={allPosts} categories={categories} />}
          {view === 'pages' && <AdminPagesView termsContent={termsContent} onUpdateTerms={setTermsContent} privacyContent={privacyContent} onUpdatePrivacy={setPrivacyContent} />}
          {view === 'feedback' && <FeedbackView {...viewProps} />}
        </main>
      </div>
    </div>
  );
};
