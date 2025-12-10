import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';

// FIX: Remove props interface.
interface EditPageViewProps {}

export const EditPageView: React.FC<EditPageViewProps> = () => {
  // FIX: Get pageKey from context.
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
    // Simulate save time and navigate back
    setTimeout(() => {
      setIsSaving(false);
      handleBack();
    }, 500);
  };

  const title = pageKey === 'terms' ? 'Edit Terms of Service' : 'Edit Privacy Policy';
  
  // FIX: Add guard clause for when pageKey is not available.
  if (!pageKey) {
    return <div className="p-8 text-center">Page not found.</div>;
  }

  return (
    <div className="flex flex-col">
      <div className="animate-fade-in-down pb-28">
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
      <div className="fixed bottom-0 left-0 right-0 z-[100] animate-slide-in-up" style={{ animationDelay: '200ms' }}>
        <div className="bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="py-3 flex items-center gap-3">
              <Button variant="overlay-dark" onClick={handleBack} className="mr-auto">Cancel</Button>
              <Button onClick={handleSave} isLoading={isSaving} size="lg" variant="pill-red">
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPageView;