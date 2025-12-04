import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';

interface EditPageViewProps {
  pageKey: 'terms' | 'privacy';
  initialContent: string;
  onSave: (newContent: string) => void;
  onBack: () => void;
}

export const EditPageView: React.FC<EditPageViewProps> = ({ pageKey, initialContent, onSave, onBack }) => {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    onSave(content);
    // Simulate save time and navigate back
    setTimeout(() => {
      setIsSaving(false);
      onBack();
    }, 500);
  };

  const title = pageKey === 'terms' ? 'Edit Terms of Service' : 'Edit Privacy Policy';

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto animate-fade-in-down p-4 sm:p-6 lg:p-8">
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
              <Button variant="overlay-dark" onClick={onBack} className="mr-auto">Cancel</Button>
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
