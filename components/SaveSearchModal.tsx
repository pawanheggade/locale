import React, { useState, useRef } from 'react';
import ModalShell from './ModalShell';
import { Button } from './ui/Button';

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
    <>
      <Button
        type="button"
        onClick={onClose}
        disabled={isSubmitting}
        variant="glass"
        className="mr-auto"
      >
        Cancel
      </Button>
      <Button
        type="button"
        onClick={handleSave}
        isLoading={isSubmitting}
        className="w-32"
        variant="glass-red"
      >
        Save Search
      </Button>
    </>
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
          <div>
            <label htmlFor="search-name" className="block text-sm font-medium text-gray-800">
              Search Name
            </label>
            <input
              type="text"
              id="search-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              className={`mt-1 block w-full bg-gray-50 border-gray-200 rounded-md shadow-sm text-gray-900 hover:bg-gray-100 focus:bg-white focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors duration-150 ${error ? 'border-red-500' : 'border-gray-200'}`}
              placeholder="e.g., 'Vintage furniture in SF'"
              required
              autoFocus
              aria-invalid={!!error}
              aria-describedby="search-name-error"
            />
             {error && <p id="search-name-error" className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
        </form>
      </div>
    </ModalShell>
  );
};

export default SaveSearchModal;