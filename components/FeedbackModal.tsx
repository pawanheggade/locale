
import React, { useRef } from 'react';
import ModalShell from './ModalShell';
import { Textarea } from './ui/Textarea';
import { FormField } from './FormField';
import { ModalFooter } from './ModalFooter';
import { useFormState } from '../hooks/useFormState';

interface FeedbackModalProps {
  onClose: () => void;
  onSubmit: (content: string) => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ onClose, onSubmit }) => {
  const { state, setField, isSubmitting, handleSubmit } = useFormState({ content: '' });
  const modalRef = useRef<HTMLDivElement>(null);

  const handleFeedbackSubmit = handleSubmit(async (currentState) => {
    if (!currentState.content.trim()) return;
    onSubmit(currentState.content.trim());
  });

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
        <form id="feedback-form" onSubmit={handleFeedbackSubmit} className="space-y-4">
          <FormField id="feedback-content" label="Your Feedback">
            <Textarea
                value={state.content}
                onChange={(e) => setField('content', e.target.value)}
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
