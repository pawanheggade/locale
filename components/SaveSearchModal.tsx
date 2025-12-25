
import React, { useRef } from 'react';
import ModalShell from './ModalShell';
import { FormField } from './FormField';
import { Input } from './ui/Input';
import { ModalFooter } from './ModalFooter';
import { useFormState } from '../hooks/useFormState';

interface SaveSearchModalProps {
  onSave: (name: string) => void;
  onClose: () => void;
}

const SaveSearchModal: React.FC<SaveSearchModalProps> = ({ onSave, onClose }) => {
  const { state, setField, errors, isSubmitting, handleSubmit } = useFormState({ name: '' });
  const modalRef = useRef<HTMLDivElement>(null);
  
  const validate = (currentState: { name: string }) => {
    if (!currentState.name.trim()) {
      return { name: 'Please enter a name for your search.' };
    }
    return {};
  };

  const handleSaveSearch = handleSubmit(async (currentState) => {
    onSave(currentState.name.trim());
    onClose();
  }, validate);

  const renderFooter = () => (
    <ModalFooter
        onCancel={onClose}
        // FIX: Pass form ID to trigger form submission instead of passing an incompatible event handler.
        submitFormId="save-search-form"
        submitText="Save Search"
        isSubmitting={isSubmitting}
        isSubmitDisabled={!state.name.trim()}
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
        <form id="save-search-form" onSubmit={handleSaveSearch} className="space-y-1">
          <FormField id="search-name" label="Search Name" error={errors.name}>
              <Input
                type="text"
                value={state.name}
                onChange={(e) => setField('name', e.target.value)}
                className="bg-gray-50"
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
