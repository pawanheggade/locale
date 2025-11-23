
import * as React from 'react';
import { Post, Media, Account, ModalState, DisplayablePost, NotificationSettings, Notification, SavedSearch, Subscription, PostCategory, BagItem, PriceAlert, ForumPost, ForumComment, CatalogItem, AvailabilityAlert } from '../types';

// Modal Imports
import { ConfirmationModal } from './ConfirmationModal';
import { MediaViewerModal } from './MediaViewerModal';
import { FindNearbyModal } from './FindNearbyModal';
import { ShareModal } from './ShareModal';
import ReportItemModal from './ReportItemModal';
import { FilterPanel } from './FilterPanel';
import SaveSearchModal from './SaveSearchModal';
import SavedSearchesModal from './SavedSearchesModal';
import SetPriceAlertModal from './SetPriceAlertModal';
import AddToBagModal from './AddToBagModal';
import SaveToListModal from './SaveToListModal';
import SettingsModal from './SettingsModal';
import NotificationsModal from './NotificationsModal';
import { AccountModal } from './AccountModal';
import ContactSellerModal from './ContactSellerModal';
import ForgotPasswordModal from './ForgotPasswordModal';
import { StaticContentModal } from './StaticContentModal';
import { CreateForumPostModal } from './CreateForumPostModal';
import { FeedbackModal } from './FeedbackModal';
import { SignInScreen } from './SignInScreen';
import { ManageCatalogModal } from './ManageCatalogModal';
import { ViewCatalogModal } from './ViewCatalogModal';
import { ProfileQRModal } from './ProfileQRModal';
import ModalShell from './ModalShell';

// This is a large props object, but it centralizes the dependencies for all modals.
interface AppModalsProps {
    activeModal: ModalState | null;
    closeModal: () => void;
    openModal: (modalState: ModalState) => void;
    currentAccount: Account | null;
    accounts: Account[];
    posts: Post[];
    archivedPosts: Post[];
    categories: PostCategory[];
    bag: BagItem[];
    priceAlerts: PriceAlert[];
    availabilityAlerts: AvailabilityAlert[];
    userNotifications: Notification[];
    notificationSettings: NotificationSettings;
    savedSearches: SavedSearch[];
    termsContent: string;
    privacyContent: string;

    isConfirming: boolean;
    isFindingNearby: boolean;
    userLocation: { lat: number; lng: number } | null;
    isSearchResult: boolean;

    // Handlers
    handleLogin: (account: Account, rememberMe: boolean) => void;
    handleSocialLogin: (provider: 'google' | 'apple') => void;
    handleUpdateAccount: (updatedAccount: Account) => Promise<any>;
    handleUpgradeToSeller: (sellerData: Partial<Account>, tier: Subscription['tier']) => Promise<void>;
    handleUpdateCurrentAccountDetails: (updatedAccount: Account) => void;
    handleReportSubmit: (postId: string, reason: string) => void;
    handleForumReportSubmit: (item: ForumPost | ForumComment, type: 'post' | 'comment', reason: string) => void;
    handleSetPriceAlert: (postId: string, targetPrice: number) => void;
    handleAddToBag: (postId: string, quantity: number) => void;
    handleRemoveBagItem: (itemId: string) => void;
    handleCreateAccount: (data: Omit<Account, 'id' | 'joinDate' | 'role' | 'status' | 'subscription' | 'savedAccountIds' | 'referralCode' | 'referralCount' | 'referredBy'>, isSeller: boolean, referralCode?: string) => Promise<any>;
    handleUpdateNotificationSettings: (newSettings: NotificationSettings) => void;
    handleNotificationClick: (notification: Notification) => void;
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
    deletePriceAlert: (postId: string) => void;
    deleteAvailabilityAlert: (postId: string) => void;
    handleFindNearby: (coords: { lat: number, lng: number }) => Promise<void>;
    handleSaveSearch: (name: string) => void;
    handleLoadSearch: (searchId: string) => void;
    handleDeleteSearch: (searchId: string) => void;
    withConfirmationLoading: (action: () => Promise<void> | void) => Promise<void>;
    handleArchiveCurrentAccountConfirm: () => Promise<void>;
    handleCreateForumPost: (postData: Omit<ForumPost, 'id' | 'authorId' | 'timestamp' | 'upvotes' | 'downvotes' | 'isPinned'>) => void;
    handleFeedbackSubmit: (content: string) => void;
    addCatalogItems?: (files: File[]) => Promise<void>;
    removeCatalogItem?: (itemId: string) => Promise<void>;
    onClearFilters: () => void;
    onSignOut: () => void;
}

export const AppModals: React.FC<AppModalsProps> = (props) => {
    const { 
        activeModal, closeModal, openModal, currentAccount, accounts, posts, archivedPosts, categories, bag, priceAlerts, availabilityAlerts, userNotifications, notificationSettings, savedSearches, termsContent, privacyContent,
        isConfirming, isFindingNearby, userLocation,
        handleLogin, handleSocialLogin, handleUpdateAccount, handleUpgradeToSeller, handleUpdateCurrentAccountDetails, handleReportSubmit, handleForumReportSubmit, handleSetPriceAlert, handleAddToBag, handleRemoveBagItem, handleCreateAccount, handleUpdateNotificationSettings, handleNotificationClick, setNotifications, deletePriceAlert, deleteAvailabilityAlert, handleFindNearby, handleSaveSearch, handleLoadSearch, handleDeleteSearch, withConfirmationLoading, handleArchiveCurrentAccountConfirm, handleCreateForumPost, handleFeedbackSubmit, addCatalogItems, removeCatalogItem, onClearFilters, onSignOut
     } = props;

    const modalRef = React.useRef<HTMLDivElement>(null);

    if (!activeModal) return null;
    
    const onOpenChange = (open: boolean) => {
        if (!open) {
            closeModal();
        }
    };
    
    const publicModals = new Set(['login', 'createAccount', 'forgotPassword', 'viewMedia', 'termsOfService', 'privacyPolicy', 'filterPanel', 'findNearby', 'sharePost', 'viewCatalog', 'profileQR']);
    if (!currentAccount && !publicModals.has(activeModal.type)) {
        return null;
    }

    switch (activeModal.type) {
      case 'login':
        return (
            <ModalShell panelRef={modalRef} onClose={closeModal} title="Sign in to Locale" panelClassName="w-full max-w-md" titleId="login-modal-title">
                <div className="p-6">
                    <SignInScreen
                        accounts={accounts}
                        onLogin={(account, rememberMe) => {
                            handleLogin(account, rememberMe);
                            closeModal();
                        }}
                        onSocialLogin={(provider) => {
                            handleSocialLogin(provider);
                            closeModal();
                        }}
                        onOpenCreateAccountModal={() => openModal({ type: 'createAccount' })}
                        onOpenPasswordAssistanceModal={() => openModal({ type: 'forgotPassword' })}
                        onOpenSellerAccountModal={() => openModal({ type: 'createAccount', data: { isSeller: true } })}
                        onOpenTermsModal={() => openModal({ type: 'termsOfService' })}
                        onOpenPrivacyModal={() => openModal({ type: 'privacyPolicy' })}
                    />
                </div>
            </ModalShell>
        );
      case 'viewMedia':
        return <MediaViewerModal media={activeModal.data.media} startIndex={activeModal.data.startIndex} onClose={closeModal} />;
      case 'findNearby':
        return <FindNearbyModal onClose={closeModal} onSearch={handleFindNearby} isSearching={isFindingNearby} />;
      case 'sharePost':
        return <ShareModal post={activeModal.data} onClose={closeModal} />;
      case 'reportItem': {
        const item = activeModal.data.item;
        const isForumItem = 'upvotes' in item; // Distinguishes ForumPost/Comment from Post
        
        const handleSubmit = (reason: string) => {
            if (isForumItem) {
                const type = 'title' in item ? 'post' : 'comment';
                handleForumReportSubmit(item as ForumPost | ForumComment, type, reason);
            } else {
                handleReportSubmit(item.id, reason);
            }
        };

        return <ReportItemModal item={item} onClose={closeModal} onSubmit={handleSubmit} />;
      }
      case 'filterPanel':
        return <FilterPanel isOpen={true} onClose={closeModal} isLocationAvailable={!!userLocation} onOpenFindNearbyModal={() => openModal({ type: 'findNearby' })} isFindingNearby={isFindingNearby} savedSearchesCount={savedSearches.length} currentAccount={currentAccount} />;
      case 'saveSearch':
        return <SaveSearchModal onSave={handleSaveSearch} onClose={closeModal} />;
      case 'viewSavedSearches':
        return <SavedSearchesModal savedSearches={savedSearches} onLoad={handleLoadSearch} onDelete={handleDeleteSearch} onClose={closeModal} />;
      case 'setPriceAlert':
        return <SetPriceAlertModal 
            post={activeModal.data} 
            onClose={closeModal} 
            onSetAlert={(price) => handleSetPriceAlert(activeModal.data.id, price)} 
            existingAlert={priceAlerts.find(a => a.postId === activeModal.data.id)} 
            onDeleteAlert={() => {
                openModal({
                    type: 'confirmation',
                    data: {
                        title: 'Remove Price Alert',
                        message: 'Are you sure you want to remove the price drop alert for this item?',
                        onConfirm: () => deletePriceAlert(activeModal.data.id),
                        confirmText: 'Remove',
                    }
                });
            }} 
        />;
      case 'addToBag':
        return <AddToBagModal post={activeModal.data} onClose={closeModal} onSave={(qty) => {handleAddToBag(activeModal.data.id, qty); closeModal();}} onRemove={() => {handleRemoveBagItem(bag.find(i => i.postId === activeModal.data.id)!.id); closeModal();}} existingItem={bag.find(i => i.postId === activeModal.data.id)} isSubmitting={false} />;
      case 'saveToList':
        return <SaveToListModal bagItemId={activeModal.data.bagItemId} onClose={closeModal} />;
      case 'settings':
        return <SettingsModal settings={notificationSettings} onSettingsChange={handleUpdateNotificationSettings} onClose={closeModal} onArchiveAccount={() => openModal({type: 'confirmation', data: { title: 'Archive Account', message: 'Are you sure you want to archive your account? This will sign you out and hide your profile.', confirmText: 'Archive', onConfirm: handleArchiveCurrentAccountConfirm, confirmClassName: 'glass-button-pill-amber-light'}})} onSignOut={() => { closeModal(); onSignOut(); }} currentAccount={currentAccount!} />;
      case 'notifications':
        return <NotificationsModal notifications={userNotifications} alerts={priceAlerts} availabilityAlerts={availabilityAlerts} posts={posts} onDismiss={(id) => setNotifications(p => p.map(n => n.id === id ? {...n, isRead: true} : n))} onDismissAll={() => setNotifications(p => p.map(n => ({...n, isRead: true})))} onNotificationClick={handleNotificationClick} onDeleteAlert={deletePriceAlert} onDeleteAvailabilityAlert={deleteAvailabilityAlert} onClose={closeModal} />;
      case 'contactStore':
        return <ContactSellerModal author={activeModal.data.author} post={activeModal.data.post} currentAccount={currentAccount!} onClose={closeModal} prefilledMessage={activeModal.data.prefilledMessage} />;
      case 'createAccount':
        return <AccountModal mode="create" allAccounts={accounts} onClose={closeModal} onCreate={handleCreateAccount} isSellerSignup={activeModal.data?.isSeller} />;
      case 'forgotPassword':
        return <ForgotPasswordModal onClose={closeModal} />;
      case 'editAccount':
        return <AccountModal mode="edit" accountToEdit={activeModal.data} allAccounts={accounts} onClose={closeModal} onUpdate={handleUpdateAccount} />;
      case 'termsOfService':
        return <StaticContentModal title="Terms of Service" content={termsContent} onClose={closeModal} />;
      case 'privacyPolicy':
        return <StaticContentModal title="Privacy Policy" content={privacyContent} onClose={closeModal} />;
      case 'confirmation': {
        const { onConfirm, ...restData } = activeModal.data;
        return (
          <ConfirmationModal
            onClose={closeModal}
            onConfirm={() => withConfirmationLoading(onConfirm)}
            {...restData}
            isConfirming={isConfirming}
          />
        );
      }
      case 'createForumPost':
        return <CreateForumPostModal onClose={closeModal} onSubmit={handleCreateForumPost} />;
      case 'upgradeToSeller':
          return <AccountModal mode="upgrade" accountToEdit={currentAccount} allAccounts={accounts} onClose={closeModal} onUpgrade={handleUpgradeToSeller} targetTier={activeModal.data.tier} />;
      case 'feedback':
          return <FeedbackModal onClose={closeModal} onSubmit={handleFeedbackSubmit} />;
      case 'manageCatalog':
          return addCatalogItems && removeCatalogItem && currentAccount ? <ManageCatalogModal onClose={closeModal} onAdd={addCatalogItems} onRemove={removeCatalogItem} catalog={currentAccount.catalog || []} /> : null;
      case 'viewCatalog':
          return <ViewCatalogModal catalog={activeModal.data.catalog} onClose={closeModal} />;
      case 'profileQR':
          return <ProfileQRModal account={activeModal.data} onClose={closeModal} />;
      default:
        return null;
    }
}
