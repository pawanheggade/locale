
import React, { useMemo, useRef } from 'react';
import { Post, ForumPost, ForumComment } from '../types';
import ModalShell from './ModalShell';
import { Textarea } from './ui/Textarea';
import { FormField } from './FormField';
import { ModalFooter } from './ModalFooter';
import { useFormState } from '../hooks/useFormState';

interface ReportItemModalProps {
  item: Post | ForumPost | ForumComment;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

const ReportItemModal: React.FC<ReportItemModalProps> = ({ item, onClose, onSubmit }) => {
  const { state, setField, errors, isSubmitting, handleSubmit } = useFormState({ reason: '' });
  const modalRef = useRef<HTMLDivElement>(null);

  const validate = (currentState: { reason: string }) => {
    if (!currentState.reason.trim()) {
      return { reason: 'Please provide a reason for your report.' };
    }
    return {};
  };

  const handleReportSubmit = handleSubmit(async (currentState) => {
    onSubmit(currentState.reason.trim());
  }, validate);
  
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
        isSubmitDisabled={!state.reason.trim()}
        submitFormId="report-item-form"
    />
  );

  return (
    <ModalShell panelRef={modalRef} onClose={onClose} title={title} footer={renderFooter()} panelClassName="w-full max-w-lg" titleId="report-item-title">
      <div className="p-6">
        <p className="text-sm text-gray-900 mb-4">You are reporting the following content:</p>
        <blockquote className="p-3 bg-gray-50 border-l-4 border-gray-300 rounded-r-md text-sm text-gray-600 italic truncate">
          "{contentPreview}"
        </blockquote>
        <form id="report-item-form" onSubmit={handleReportSubmit} className="space-y-4 mt-4">
          <FormField id="report-reason" label="Reason for reporting" error={errors.reason}>
             <Textarea
                rows={4}
                value={state.reason}
                onChange={(e) => setField('reason', e.target.value)}
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
