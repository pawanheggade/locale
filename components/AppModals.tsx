import * as React from 'react';
import { useRef } from 'react';
import { Notification, Account, Post, DisplayablePost } from '../types';

// Context Imports
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../contexts/PostsContext';
import { useForum } from '../contexts/ForumContext';
import { useUI } from '../contexts/UIContext';
import { useFilters } from '../contexts/FiltersContext';
import { useActivity } from '../contexts/ActivityContext';

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
import { useConfirmationModal } from '../hooks/useConfirmationModal';
import { Logo } from './Logo';

// Only keeping props that are still managed by App.tsx (location specific state)
interface AppModalsProps {
    activeModal: any; // Simplified type, or import ModalState
    closeModal: () => void;
    openModal: (modalState: any) => void;
    
    // Location State (Managed in App.tsx due to map coordination)
    isFindingNearby: boolean;
    handleFindNearby: (coords: { lat: number, lng: number }) => Promise<void>;
    userLocation: { lat: number; lng: number } | null;
    
    // Session mgmt override if needed, otherwise handled locally
    onSignOut: () => void;
    onEnableLocation: () => Promise<void>;
}

export const AppModals: React.FC<AppModalsProps> = ({ 
    activeModal, closeModal, openModal, 
    isFindingNearby, handleFindNearby, userLocation, onSignOut, onEnableLocation
}) => {
    const { 
        currentAccount, accounts, bag, 
        login, socialLogin, createAccount, updateAccount, upgradeToSeller, 
        addReport, addForumReport, 
        addToBag, removeBagItem, savedSearches, addSavedSearch, deleteSavedSearch, 
        addCatalogItems, removeCatalogItem, addFeedback, termsContent, privacyContent,
    } = useAuth();
    
    const { findPostById } = usePosts();
    const { 
      priceAlerts, setPriceAlert, deletePriceAlert 
    } = useActivity();

    const { addPost: createForumPost } = useForum();
    const { dispatchFilterAction } = useFilters();
    const showConfirmation = useConfirmationModal();

    const modalRef = useRef<HTMLDivElement>(null);

    if (!activeModal) return null;
    
    const handleLoadSearch = (searchId: string) => {
        const search = savedSearches.find(s => s.id === searchId);
        if (search) {
            dispatchFilterAction({ type: 'SET_FILTERS_FROM_SAVED', payload: search.filters });
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
            <ModalShell 
                panelRef={modalRef} 
                onClose={closeModal} 
                title={
                    <div className="flex flex-col items-center pb-2">
                        <Logo variant="large" />
                    </div>
                }
                panelClassName="w-full max-w-md" 
                titleId="login-modal-title"
            >
                <div className="p-6">
                    <SignInScreen
                        accounts={accounts}
                        onLogin={(account, rememberMe) => { login(account, rememberMe); closeModal(); }}
                        onSocialLogin={(provider) => { socialLogin(provider); closeModal(); }}
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
        const isForumItem = 'upvotes' in item;
        const handleSubmit = (reason: string) => {
            if (isForumItem) {
                const type = 'title' in item ? 'post' : 'comment';
                addForumReport(item as any, type, reason);
            } else {
                addReport(item.id, reason);
            }
            closeModal();
        };
        return <ReportItemModal item={item} onClose={closeModal} onSubmit={handleSubmit} />;
      }
      case 'filterPanel':
        return <FilterPanel isOpen={true} onClose={closeModal} isLocationAvailable={!!userLocation} onOpenFindNearbyModal={() => openModal({ type: 'findNearby' })} isFindingNearby={isFindingNearby} savedSearchesCount={savedSearches.length} currentAccount={currentAccount} onEnableLocation={onEnableLocation} />;
      case 'saveSearch':
        return <SaveSearchModal onSave={(name) => { addSavedSearch({ id: `saved-${Date.now()}`, name, filters: {} as any }); }} onClose={closeModal} />;
      case 'viewSavedSearches':
        return <SavedSearchesModal savedSearches={savedSearches} onLoad={handleLoadSearch} onDelete={deleteSavedSearch} onClose={closeModal} />;
      case 'setPriceAlert':
        return <SetPriceAlertModal 
            post={activeModal.data} 
            onClose={closeModal} 
            onSetAlert={(price) => setPriceAlert(activeModal.data.id, price)} 
            existingAlert={priceAlerts.find(a => a.postId === activeModal.data.id)} 
            onDeleteAlert={() => {
                showConfirmation({
                    title: 'Remove Price Alert',
                    message: 'Are you sure you want to remove the price drop alert for this item?',
                    onConfirm: () => {
                      deletePriceAlert(activeModal.data.id);
                      closeModal();
                    },
                    confirmText: 'Remove',
                });
            }} 
        />;
      case 'addToBag':
        return <AddToBagModal post={activeModal.data} onClose={closeModal} onSave={(qty) => {addToBag(activeModal.data.id, qty); closeModal();}} onRemove={() => {removeBagItem(bag.find(i => i.postId === activeModal.data.id)!.id); closeModal();}} existingItem={bag.find(i => i.postId === activeModal.data.id)} isSubmitting={false} />;
      case 'saveToList':
        return <SaveToListModal bagItemId={activeModal.data.bagItemId} onClose={closeModal} />;
      case 'contactStore':
        return <ContactSellerModal author={activeModal.data.author} post={activeModal.data.post} currentAccount={currentAccount!} onClose={closeModal} prefilledMessage={activeModal.data.prefilledMessage} />;
      case 'createAccount':
        return <AccountModal mode="create" allAccounts={accounts} onClose={closeModal} onCreate={async (d, s, r) => { await createAccount(d, s, r); }} isSellerSignup={activeModal.data?.isSeller} />;
      case 'forgotPassword':
        return <ForgotPasswordModal onClose={closeModal} />;
      case 'editAccount':
        return <AccountModal mode="edit" accountToEdit={activeModal.data} allAccounts={accounts} onClose={closeModal} onUpdate={updateAccount} />;
      case 'termsOfService':
        return <StaticContentModal title="Terms of Service" content={termsContent} onClose={closeModal} />;
      case 'privacyPolicy':
        return <StaticContentModal title="Privacy Policy" content={privacyContent} onClose={closeModal} />;
      case 'confirmation': {
        return (
          <ConfirmationModal
            onClose={closeModal}
            {...activeModal.data}
          />
        );
      }
      case 'createForumPost':
        return <CreateForumPostModal onClose={closeModal} onSubmit={(data) => { createForumPost(data); closeModal(); }} />;
      case 'upgradeToSeller':
          return <AccountModal mode="upgrade" accountToEdit={currentAccount!} allAccounts={accounts} onClose={closeModal} onUpgrade={(sellerData, tier) => upgradeToSeller(currentAccount!.id, sellerData, tier)} targetTier={activeModal.data.tier} />;
      case 'feedback':
          return <FeedbackModal onClose={closeModal} onSubmit={(c) => { addFeedback(c); closeModal(); }} />;
      case 'manageCatalog':
          return addCatalogItems && removeCatalogItem && currentAccount ? <ManageCatalogModal onClose={closeModal} onAdd={addCatalogItems} onRemove={removeCatalogItem} catalog={currentAccount.catalog || []} /> : null;
      case 'viewCatalog':
          return <ViewCatalogModal catalog={activeModal.data.catalog} onClose={closeModal} />;
      case 'profileQR':
          return <ProfileQRModal account={activeModal.data} onClose={closeModal} />;
      default:
        return null;
    }
};