import React, { useState, useRef } from 'react';
import ModalShell from './ModalShell';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { FormField } from './FormField';

interface FeedbackModalProps {
  onClose: () => void;
  onSubmit: (content: string) => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ onClose, onSubmit }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    onSubmit(content.trim());
  };

  const renderFooter = () => (
    <>
      <Button variant="overlay-dark" onClick={onClose} className="mr-auto">Cancel</Button>
      <Button type="submit" form="feedback-form" isLoading={isSubmitting} disabled={!content.trim()} variant="pill-red">Send Feedback</Button>
    </>
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
                value={content}
                onChange={(e) => setContent(e.target.value)}
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
