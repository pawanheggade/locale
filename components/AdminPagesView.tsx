
import React, { useMemo } from 'react';
import { sanitizeHtml } from '../utils/security';
import { Button } from './ui/Button';
import { PencilIcon } from './Icons';
import { useNavigation } from '../contexts/NavigationContext';

interface AdminPagesViewProps {
  termsContent: string;
  privacyContent: string;
}

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
                    className="font-semibold text-gray-600 gap-2"
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

export const AdminPagesView: React.FC<AdminPagesViewProps> = ({ termsContent, privacyContent }) => {
  const { navigateTo } = useNavigation();

  return (
    <div className="space-y-6">
      <PageSection
          title="Terms of Service"
          content={termsContent}
          onEdit={() => navigateTo('editAdminPage', { pageKey: 'terms' })}
      />
      <PageSection
          title="Privacy Policy"
          content={privacyContent}
          onEdit={() => navigateTo('editAdminPage', { pageKey: 'privacy' })}
      />
    </div>
  );
};