import React, { useState } from 'react';
import { Account } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { AccountForm } from './AccountForm';
import { Button } from './ui/Button';
import { useNavigation } from '../contexts/NavigationContext';

// FIX: Remove props interface.
interface EditProfilePageProps {}

export const EditProfilePage: React.FC<EditProfilePageProps> = () => {
  // FIX: Get account from context.
  const { viewingAccount: account } = useNavigation();
  const { accounts: allAccounts, updateAccountDetails } = useAuth();
  const { handleBack } = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

  const handleSubmit = async (formData: Partial<Account>) => {
    if (!account) return;
    setIsSubmitting(true);
    try {
      updateAccountDetails({ ...account, ...formData });
      handleBack();
    } catch (error) {
      console.error("Failed to update account", error);
      setIsSubmitting(false);
    }
  };

  if (!account) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto animate-fade-in-down pb-28 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
            {!isMapPickerOpen && <h1 className="text-3xl font-bold text-gray-800 mb-6">Edit Profile</h1>}
            <AccountForm
              account={account}
              isEditing={true}
              allAccounts={allAccounts}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              formId="edit-profile-form"
              onToggleMap={setIsMapPickerOpen}
            />
        </div>
      </div>
      {!isMapPickerOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] animate-slide-in-up" style={{ animationDelay: '200ms' }}>
            <div className="bg-white border-t border-gray-100">
                <div className="max-w-2xl mx-auto px-4 sm:px-6">
                    <div className="py-3 flex items-center gap-3">
                        <Button variant="overlay-dark" onClick={handleBack} className="mr-auto">Cancel</Button>
                        <Button type="submit" form="edit-profile-form" isLoading={isSubmitting} size="lg" variant="pill-red">
                            Save Changes
                        </Button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default EditProfilePage;