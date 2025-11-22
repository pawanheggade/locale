import React, { useState, useRef, useMemo } from 'react';
import { Post, ForumPost, ForumComment } from '../types';
import ModalShell from './ModalShell';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { Label } from './ui/Label';

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
    <>
      <Button variant="glass" onClick={onClose} disabled={isSubmitting} className="mr-auto">Cancel</Button>
      <Button type="submit" form="report-item-form" isLoading={isSubmitting} disabled={!reason.trim()} variant="glass-red">Submit Report</Button>
    </>
  );

  return (
    <ModalShell panelRef={modalRef} onClose={onClose} title={title} footer={renderFooter()} panelClassName="w-full max-w-lg" titleId="report-item-title">
      <div className="p-6">
        <p className="text-sm text-gray-800 mb-4">You are reporting the following content:</p>
        <blockquote className="p-3 bg-gray-100 border-l-4 border-gray-300 rounded-r-md text-sm text-gray-700 italic truncate">
          "{contentPreview}"
        </blockquote>
        <form id="report-item-form" onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="report-reason">Reason for reporting</Label>
            <Textarea id="report-reason" rows={4} value={reason} onChange={(e) => { setReason(e.target.value); if (error) setError(''); }}
              className={`mt-1 ${error ? 'border-red-500' : ''}`}
              placeholder="Please provide details about why you are reporting this content (e.g., it's a scam, inappropriate content, etc.)."
              required autoFocus aria-invalid={!!error} aria-describedby="report-reason-error"
            />
            {error && <p id="report-reason-error" className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
        </form>
      </div>
    </ModalShell>
  );
};

export default ReportItemModal;