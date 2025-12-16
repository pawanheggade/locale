
import React, { useRef } from 'react';
import { ModalState, SavedSearchFilters } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { useActivity } from '../contexts/ActivityContext';
import { useFilters } from '../contexts/FiltersContext';
import { useConfirmationModal } from '../hooks/useConfirmationModal';
import { ConfirmationModal } from './ConfirmationModal';
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
import { FeedbackModal } from './FeedbackModal';
import { SignInScreen } from './SignInScreen';
import { ViewCatalogModal } from './ViewCatalogModal';
import { ProfileQRModal } from './ProfileQRModal';
import { EditSocialsModal } from './EditSocialsModal';
import ModalShell from './ModalShell';
import { Logo } from './Logo';
import { PostCard } from './PostCard';
import { SEO } from './SEO';

interface AppModalsProps {
    isFindingNearby: boolean;
    handleFindNearby: (coords: { lat: number, lng: number }) => Promise<void>;
    userLocation: { lat: number; lng: number } | null;
    onEnableLocation: () => Promise<void>;
}

export const AppModals: React.FC<AppModalsProps> = ({ 
    isFindingNearby, handleFindNearby, userLocation, onEnableLocation
}) => {
    const { 
        currentAccount, accounts, bag, 
        login, socialLogin, createAccount, upgradeToSeller, 
        addReport, addForumReport, 
        addToBag, removeBagItem, savedSearches, addSavedSearch, deleteSavedSearch, 
        addFeedback, termsContent, privacyContent,
    } = useAuth();
    
    const { activeModal, closeModal, openModal } = useUI();
    
    const { 
      priceAlerts, setPriceAlert, deletePriceAlert 
    } = useActivity();
    const { dispatchFilterAction, filterState } = useFilters();
    const showConfirmation = useConfirmationModal();

    const modalRef = useRef<HTMLDivElement>(null);

    const handleLoadSearch = (searchId: string) => {
        const search = savedSearches.find(s => s.id === searchId);
        if (search) {
            dispatchFilterAction({ type: 'SET_FILTERS_FROM_SAVED', payload: search.filters });
            closeModal();
        }
    };

    const handleSaveSearch = (name: string) => {
        const { searchQuery, filterType, filterCategory, sortOption, minPrice, maxPrice, filterTags, filterOnSale } = filterState;
        const filtersToSave: SavedSearchFilters = { searchQuery, filterType, filterCategory, sortOption, minPrice, maxPrice, filterTags, filterOnSale };
        addSavedSearch({ id: `saved-${Date.now()}`, name, filters: filtersToSave });
    };

    const publicModals = new Set(['login', 'createAccount', 'forgotPassword', 'termsOfService', 'privacyPolicy', 'filterPanel', 'findNearby', 'sharePost', 'viewCatalog', 'profileQR', 'viewPost']);
    
    // Redirect to login if a protected modal is requested without an account
    if (!currentAccount && activeModal && !publicModals.has(activeModal.type)) {
        // We need to defer this slightly or ensure we don't cause a loop. 
        // Ideally, the triggering component checks this, but this is a safety net.
        // For render purity, we'll return null here and effect-based redirect would be better, 
        // but typically openModal handles the state. 
        // We'll render the Login modal instead.
        return (
             <ModalShell 
                panelRef={modalRef} 
                onClose={closeModal} 
                title={
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 min-w-[280px]">
                        <div className="flex justify-end">
                            <Logo className="text-3xl sm:text-4xl" />
                        </div>
                        <div className="h-10 w-px bg-gray-900/10"></div>
                        <div className="flex flex-col items-start justify-center">
                            <span className="font-['Comfortaa'] font-bold text-[13px] text-gray-500 lowercase leading-none mb-0.5">hyperlocal</span>
                            <span className="font-['Comfortaa'] font-bold text-[13px] text-gray-500 lowercase leading-none">community</span>
                        </div>
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
    }

    if (!activeModal) {
        return null;
    }

    switch (activeModal.type) {
      case 'login':
        return (
            <ModalShell 
                panelRef={modalRef} 
                onClose={closeModal} 
                title={
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 min-w-[280px]">
                        <div className="flex justify-end">
                            <Logo className="text-3xl sm:text-4xl" />
                        </div>
                        <div className="h-10 w-px bg-gray-900/10"></div>
                        <div className="flex flex-col items-start justify-center">
                            <span className="font-['Comfortaa'] font-bold text-[13px] text-gray-500 lowercase leading-none mb-0.5">hyperlocal</span>
                            <span className="font-['Comfortaa'] font-bold text-[13px] text-gray-500 lowercase leading-none">community</span>
                        </div>
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
        return <SaveSearchModal onSave={handleSaveSearch} onClose={closeModal} />;
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
        return <AccountModal mode="create" allAccounts={accounts} onClose={closeModal} onCreate={async (d, s, r) => { await createAccount(d as any, s, r); }} isSellerSignup={activeModal.data?.isSeller} />;
      case 'forgotPassword':
        return <ForgotPasswordModal onClose={closeModal} />;
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
      case 'upgradeToSeller':
          return <AccountModal mode="upgrade" accountToEdit={currentAccount!} allAccounts={accounts} onClose={closeModal} onUpgrade={(sellerData, tier) => upgradeToSeller(currentAccount!.id, sellerData, tier)} targetTier={activeModal.data.tier} />;
      case 'feedback':
          return <FeedbackModal onClose={closeModal} onSubmit={(c) => { addFeedback(c); closeModal(); }} />;
      case 'viewCatalog':
          return <ViewCatalogModal catalog={activeModal.data.catalog} accountId={activeModal.data.accountId} onClose={closeModal} />;
      case 'profileQR':
          return <ProfileQRModal account={activeModal.data} onClose={closeModal} />;
      case 'editSocials':
          return <EditSocialsModal onClose={closeModal} />;
      case 'viewPost':
          return (
            <ModalShell
                panelRef={modalRef}
                onClose={closeModal}
                title=""
                panelClassName="w-full max-w-md bg-transparent border-0 shadow-none"
                titleId="view-post-title"
            >
                <SEO 
                    title={activeModal.data.title}
                    description={activeModal.data.description.slice(0, 160)}
                    image={activeModal.data.media?.[0]?.url}
                    type="article"
                />
                <PostCard
                    post={activeModal.data}
                    currentAccount={currentAccount}
                    index={0}
                    enableEntryAnimation={false}
                    isInitiallyExpanded={true}
                />
            </ModalShell>
          );
      default:
        return null;
    }
};
