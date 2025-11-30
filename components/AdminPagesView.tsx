
import React, { useState, useCallback, useMemo } from 'react';
import { EditPageModal } from './EditPageModal';
import { sanitizeHtml } from '../utils/security';
import { Button } from './ui/Button';
import { PencilIcon } from './Icons';

interface AdminPagesViewProps {
  termsContent: string;
  onUpdateTerms: (content: string) => void;
  privacyContent: string;
  onUpdatePrivacy: (content: string) => void;
}

type EditingPage = 'terms' | 'privacy' | null;

// Reusable component for displaying a static page section in the admin panel
const PageSection: React.FC<{
  title: string;
  content: string;
  onEdit: () => void;
}> = ({ title, content, onEdit }) => {
    
    const sanitizedContent = useMemo(() => sanitizeHtml(content), [content]);

    return (
        <div className="bg-white rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
                <Button
                    onClick={onEdit}
                    variant="overlay-dark"
                    className="font-semibold text-gray-700 gap-2"
                >
                    <PencilIcon className="w-4 h-4" />
                    Edit
                </Button>
            </div>
            <div
                className="prose max-w-none p-4 border rounded-md h-64 overflow-y-auto bg-gray-50"
                dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
        </div>
    );
};

export const AdminPagesView: React.FC<AdminPagesViewProps> = ({ termsContent, onUpdateTerms, privacyContent, onUpdatePrivacy }) => {
  const [editing, setEditing] = useState<EditingPage>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback((content: string) => {
    setIsSaving(true);
    if (editing === 'terms') {
      onUpdateTerms(content);
    } else if (editing === 'privacy') {
      onUpdatePrivacy(content);
    }
    setIsSaving(false);
    setEditing(null);
  }, [editing, onUpdateTerms, onUpdatePrivacy]);

  return (
    <>
      <div className="space-y-6">
        <PageSection
            title="Terms of Service"
            content={termsContent}
            onEdit={() => setEditing('terms')}
        />
        <PageSection
            title="Privacy Policy"
            content={privacyContent}
            onEdit={() => setEditing('privacy')}
        />
      </div>
      {editing && (
        <EditPageModal
            title={editing === 'terms' ? 'Edit Terms of Service' : 'Edit Privacy Policy'}
            content={editing === 'terms' ? termsContent : privacyContent}
            onSave={handleSave}
            onClose={() => setEditing(null)}
            isSaving={isSaving}
        />
      )}
    </>
  );
};