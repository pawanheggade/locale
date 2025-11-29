
import React, { useState, useRef } from 'react';
import ModalShell from './ModalShell';
import { ModalFooter } from './ModalFooter';

interface EditPageModalProps {
  title: string;
  content: string;
  onSave: (newContent: string) => void;
  onClose: () => void;
  isSaving: boolean;
}

export const EditPageModal: React.FC<EditPageModalProps> = ({ title, content, onSave, onClose, isSaving }) => {
  const [newContent, setNewContent] = useState(content);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleSave = () => {
    onSave(newContent);
  };

  const renderFooter = () => (
    <ModalFooter
        onCancel={onClose}
        onSubmit={handleSave}
        submitText="Save Changes"
        isSubmitting={isSaving}
        submitClassName="w-32"
    />
  );

  return (
    <ModalShell
      panelRef={modalRef}
      onClose={onClose}
      title={title}
      footer={renderFooter()}
      panelClassName="w-full max-w-4xl h-[90vh]"
      titleId="edit-page-title"
    >
      <div className="p-6 h-full flex flex-col">
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          className="w-full h-full flex-grow p-3 border rounded-md font-mono text-sm bg-white text-gray-900 border-gray-200 focus:ring-1 focus:ring-red-500 focus:border-red-500"
          placeholder="Enter HTML content..."
        />
      </div>
    </ModalShell>
  );
};
