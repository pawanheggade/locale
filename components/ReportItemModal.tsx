
import React, { useState, useRef, useMemo } from 'react';
import { Post, ForumPost, ForumComment } from '../types';
import ModalShell from './ModalShell';
import { Textarea } from './ui/Textarea';
import { FormField } from './FormField';
import { ModalFooter } from './ModalFooter';

interface ReportItemModalProps {
  item: Post | ForumPost | ForumComment;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

const ReportItemModal: React.FC<ReportItemModalProps> = ({ item, onClose, onSubmit }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setError('Please provide a reason for your report.');
      return;
    }
    setIsSubmitting(true);
    onSubmit(trimmedReason);
  };
  
  const { title, contentPreview } = useMemo(() => {
    if ('title' in item) { // Post or ForumPost
      return { title: `Report Content`, contentPreview: item.title };
    }
    // ForumComment
    return { title: `Report Comment`, contentPreview: item.content };
  }, [item]);

  const renderFooter = () => (
    <ModalFooter
        onCancel={onClose}
        submitText="Submit Report"
        isSubmitting={isSubmitting}
        isSubmitDisabled={!reason.trim()}
        submitFormId="report-item-form"
    />
  );

  return (
    <ModalShell panelRef={modalRef} onClose={onClose} title={title} footer={renderFooter()} panelClassName="w-full max-w-lg" titleId="report-item-title">
      <div className="p-6">
        <p className="text-sm text-gray-800 mb-4">You are reporting the following content:</p>
        <blockquote className="p-3 bg-gray-100 border-l-4 border-gray-300 rounded-r-md text-sm text-gray-600 italic truncate">
          "{contentPreview}"
        </blockquote>
        <form id="report-item-form" onSubmit={handleSubmit} className="space-y-4 mt-4">
          <FormField id="report-reason" label="Reason for reporting" error={error}>
             <Textarea
                rows={4}
                value={reason}
                onChange={(e) => { setReason(e.target.value); if (error) setError(''); }}
                placeholder="Please provide details about why you are reporting this content (e.g., it's a scam, inappropriate content, etc.)."
                required
                autoFocus
            />
          </FormField>
        </form>
      </div>
    </ModalShell>
  );
};

export default ReportItemModal;
