
import React, { useState, useRef } from 'react';
import ModalShell from './ModalShell';
import { FormField } from './FormField';
import { Input } from './ui/Input';
import { ModalFooter } from './ModalFooter';

interface SaveSearchModalProps {
  onSave: (name: string) => void;
  onClose: () => void;
}

const SaveSearchModal: React.FC<SaveSearchModalProps> = ({ onSave, onClose }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter a name for your search.');
      return;
    }
    
    setIsSubmitting(true);
    onSave(trimmedName);
    onClose();
  };

  const renderFooter = () => (
    <ModalFooter
        onCancel={onClose}
        onSubmit={handleSave}
        submitText="Save Search"
        isSubmitting={isSubmitting}
    />
  );

  return (
    <ModalShell
      panelRef={modalRef}
      onClose={onClose}
      title="Save Current Search"
      footer={renderFooter()}
      panelClassName="w-full max-w-md"
      titleId="save-search-title"
    >
      <div className="p-6">
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-1">
          <FormField id="search-name" label="Search Name" error={error}>
              <Input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError('');
                }}
                className="bg-gray-50 hover:bg-gray-100"
                placeholder="e.g., 'Vintage furniture in SF'"
                required
                autoFocus
              />
          </FormField>
        </form>
      </div>
    </ModalShell>
  );
};

export default SaveSearchModal;
