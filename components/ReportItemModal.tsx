
import React, { useState, useRef, useMemo, useReducer } from 'react';
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

const initialState = { reason: '', error: '' };
type State = typeof initialState;
type Action =
    | { type: 'SET_REASON'; payload: string }
    | { type: 'SET_ERROR'; payload: string };

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SET_REASON':
            return { ...state, reason: action.payload, error: '' };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        default:
            return state;
    }
}

const ReportItemModal: React.FC<ReportItemModalProps> = ({ item, onClose, onSubmit }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedReason = state.reason.trim();
    if (!trimmedReason) {
      dispatch({ type: 'SET_ERROR', payload: 'Please provide a reason for your report.' });
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
        <form id="report-item-form" onSubmit={handleSubmit} className="space-y-4 mt-4">
          <FormField id="report-reason" label="Reason for reporting" error={state.error}>
             <Textarea
                rows={4}
                value={state.reason}
                onChange={(e) => dispatch({ type: 'SET_REASON', payload: e.target.value })}
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