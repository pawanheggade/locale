import React, { useState, useRef, useReducer } from 'react';
import ModalShell from './ModalShell';
import { FormField } from './FormField';
import { Input } from './ui/Input';
import { ModalFooter } from './ModalFooter';

interface SaveSearchModalProps {
  onSave: (name: string) => void;
  onClose: () => void;
}

const initialState = { name: '', error: '' };
type State = typeof initialState;
type Action =
  | { type: 'SET_NAME'; payload: string }
  | { type: 'SET_ERROR'; payload: string };

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SET_NAME':
            return { ...state, name: action.payload, error: '' };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        default:
            return state;
    }
}

const SaveSearchModal: React.FC<SaveSearchModalProps> = ({ onSave, onClose }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleSave = () => {
    const trimmedName = state.name.trim();
    if (!trimmedName) {
      dispatch({ type: 'SET_ERROR', payload: 'Please enter a name for your search.' });
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
          <FormField id="search-name" label="Search Name" error={state.error}>
              <Input
                type="text"
                value={state.name}
                onChange={(e) => dispatch({ type: 'SET_NAME', payload: e.target.value })}
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