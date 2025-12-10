
import React, { useState } from 'react';
import { Textarea } from './ui/Textarea';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';
import { FixedPageFooter } from './FixedPageFooter';

interface EditPageViewProps {}

export const EditPageView: React.FC<EditPageViewProps> = () => {
  const { editingAdminPageKey: pageKey } = useNavigation();
  const { termsContent, setTermsContent, privacyContent, setPrivacyContent } = useAuth();
  const { handleBack } = useNavigation();

  const initialContent = pageKey === 'terms' ? termsContent : privacyContent;
  const onSave = pageKey === 'terms' ? setTermsContent : setPrivacyContent;

  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    onSave(content);
    setTimeout(() => {
      setIsSaving(false);
      handleBack();
    }, 500);
  };

  const title = pageKey === 'terms' ? 'Edit Terms of Service' : 'Edit Privacy Policy';
  
  if (!pageKey) {
    return <div className="p-8 text-center">Page not found.</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto animate-fade-in-down p-4 sm:p-6 lg:p-8 pb-28">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">{title}</h1>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-[60vh] p-3 border rounded-md font-mono text-sm bg-white text-gray-900 border-gray-200 focus:ring-1 focus:ring-red-500 focus:border-red-500"
            placeholder="Enter HTML content..."
          />
        </div>
      </div>
      <FixedPageFooter
        onCancel={handleBack}
        onSubmit={handleSave}
        isLoading={isSaving}
        submitText="Save Changes"
      />
    </div>
  );
};

export default EditPageView;
