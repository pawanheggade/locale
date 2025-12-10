import React, { useState } from 'react';
import { Account } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { AccountForm } from './AccountForm';
import { useNavigation } from '../contexts/NavigationContext';
import { FixedPageFooter } from './FixedPageFooter';

interface EditProfilePageProps {}

export const EditProfilePage: React.FC<EditProfilePageProps> = () => {
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
        <FixedPageFooter
            onCancel={handleBack}
            submitFormId="edit-profile-form"
            isLoading={isSubmitting}
            submitText="Save Changes"
        />
      )}
    </div>
  );
};

export default EditProfilePage;