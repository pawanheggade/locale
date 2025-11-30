
import React, { useState, useRef, useReducer } from 'react';
import ModalShell from './ModalShell';
import { Textarea } from './ui/Textarea';
import { FormField } from './FormField';
import { ModalFooter } from './ModalFooter';

interface FeedbackModalProps {
  onClose: () => void;
  onSubmit: (content: string) => void;
}

const initialState = { content: '' };
type Action = { type: 'SET_CONTENT'; payload: string };

function reducer(state: typeof initialState, action: Action) {
    switch (action.type) {
        case 'SET_CONTENT':
            return { content: action.payload };
        default:
            return state;
    }
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ onClose, onSubmit }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.content.trim()) return;
    
    setIsSubmitting(true);
    onSubmit(state.content.trim());
  };

  const renderFooter = () => (
    <ModalFooter
        onCancel={onClose}
        submitText="Send Feedback"
        isSubmitting={isSubmitting}
        isSubmitDisabled={!state.content.trim()}
        submitFormId="feedback-form"
    />
  );

  return (
    <ModalShell panelRef={modalRef} onClose={onClose} title="Send Feedback" footer={renderFooter()} panelClassName="w-full max-w-md" titleId="feedback-modal-title">
      <div className="p-6">
        <p className="text-sm text-gray-600 mb-4">
          We value your feedback! Let us know if you have any suggestions, found a bug, or just want to share your thoughts about Locale.
        </p>
        <form id="feedback-form" onSubmit={handleSubmit} className="space-y-4">
          <FormField id="feedback-content" label="Your Feedback">
            <Textarea
                value={state.content}
                onChange={(e) => dispatch({ type: 'SET_CONTENT', payload: e.target.value })}
                rows={6}
                placeholder="Type your message here..."
                required
                autoFocus
            />
          </FormField>
        </form>
      </div>
    </ModalShell>
  );
};
