
import React, { useState, useRef, useEffect } from 'react';
import { Account, Subscription } from '../types';
import ModalShell from './ModalShell';
import { AlertIcon } from './Icons';
import { AccountForm } from './AccountForm';
import { Button } from './ui/Button';
import { useIsMounted } from '../hooks/useIsMounted';

interface AccountModalProps {
  mode: 'create' | 'upgrade';
  onClose: () => void;
  onCreate?: (newAccountData: Omit<Account, 'id' | 'joinDate' | 'role' | 'status' | 'subscription' | 'likedAccountIds' | 'referralCode' | 'referralCount' | 'referredBy'>, isSeller: boolean, referralCode?: string) => Promise<any>;
  onUpgrade?: (sellerData: Partial<Account>, tier: Subscription['tier']) => Promise<void>;
  allAccounts: Account[];
  accountToEdit?: Account; // Used for upgrade mode
  isSellerSignup?: boolean;
  targetTier?: Subscription['tier'];
}

export const AccountModal: React.FC<AccountModalProps> = ({ mode, onClose, onCreate, onUpgrade, allAccounts, accountToEdit, isSellerSignup, targetTier }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const isMounted = useIsMounted();

  const isUpgrading = mode === 'upgrade';
  const isCreating = mode === 'create';

  const title = isMapPickerOpen ? 'Select Location' 
    : isUpgrading ? 'Become a Seller'
    : (isSellerSignup ? 'Create a Seller Account' : 'Create New Account');
  
  const submitText = isUpgrading ? 'Submit for Review' : 'Create Account';

  const handleSubmit = async (formData: any, confirmPassword?: string, referralCode?: string) => {
    setIsSubmitting(true);
    setFormError('');
    try {
      if (isUpgrading && onUpgrade && targetTier) {
        await onUpgrade(formData, targetTier);
      } else if (isCreating && onCreate) {
        await onCreate(formData, !!isSellerSignup, referralCode);
      }
      if (isMounted()) {
        onClose();
      }
    } catch (error) {
      if (isMounted()) {
        setFormError('An unexpected error occurred. Please try again.');
        setIsSubmitting(false);
      }
    }
  };

  const renderFooter = () => {
    if (isMapPickerOpen || isCreating || isUpgrading) return null;

    return (
      <>
        <Button variant="overlay-dark" onClick={onClose} className="mr-auto">
          Cancel
        </Button>
        <Button type="submit" form="account-form" isLoading={isSubmitting} className="w-36" variant="pill-red">
          {submitText}
        </Button>
      </>
    );
  };

  return (
    <ModalShell
      panelRef={modalRef}
      onClose={onClose}
      title={title}
      footer={renderFooter()}
      panelClassName="w-full max-w-md"
      titleId="account-modal-title"
      trapFocus={!isMapPickerOpen} // Disable trap when map is open to avoid conflict with internal map focus
    >
      {/* When map is open, AccountForm handles rendering the map view itself to replace the form content */}
      <div className={isMapPickerOpen ? "p-0" : "p-4 sm:p-6"}>
        {!isMapPickerOpen && isUpgrading && (
          <p className="text-sm text-gray-600 mb-4">You're upgrading to the <span className="font-bold">{targetTier}</span> plan. Please provide your seller information to complete the process. Your account will be submitted for review.</p>
        )}
        <AccountForm
          account={accountToEdit}
          isEditing={isUpgrading} // isEditing is true only for upgrade form now
          allAccounts={allAccounts}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          formId="account-form"
          isSellerSignup={isSellerSignup || isUpgrading}
          onToggleMap={setIsMapPickerOpen}
          isUpgrading={isUpgrading}
        />
        {!isMapPickerOpen && formError && (
          <div role="alert" className="mt-4 bg-red-50 border border-red-200 text-red-800 p-3 rounded-md flex items-center gap-2">
            <AlertIcon className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{formError}</p>
          </div>
        )}
      </div>
    </ModalShell>
  );
};