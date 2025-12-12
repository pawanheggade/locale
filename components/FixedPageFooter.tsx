import React from 'react';
import { createPortal } from 'react-dom';
import { Button } from './ui/Button';

interface FixedPageFooterProps {
  onCancel: () => void;
  cancelText?: string;
  onSubmit?: () => void;
  submitFormId?: string;
  isLoading?: boolean;
  submitText: string;
  submitDisabled?: boolean;
}

export const FixedPageFooter: React.FC<FixedPageFooterProps> = ({ 
    onCancel, 
    cancelText = 'Cancel', 
    onSubmit, 
    submitFormId, 
    isLoading, 
    submitText,
    submitDisabled = false
}) => {
  // Use a portal to render the footer at the document body level.
  // This breaks it out of any parent containers that might have CSS transforms 
  // (like the pull-to-refresh wrapper in App.tsx), ensuring 'position: fixed' 
  // correctly anchors it to the viewport.
  return createPortal(
    <div className="fixed bottom-0 left-0 right-0 z-[100] animate-slide-in-up" style={{ animationDelay: '200ms' }}>
      <div className="bg-white/90 backdrop-blur-xl border-t border-gray-200 shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="py-3 flex items-center gap-3">
            <Button variant="overlay-dark" onClick={onCancel} className="mr-auto font-medium" disabled={isLoading}>{cancelText}</Button>
            <Button 
                type={submitFormId ? 'submit' : 'button'} 
                form={submitFormId} 
                onClick={onSubmit} 
                isLoading={isLoading} 
                size="lg" 
                variant="pill-red"
                disabled={submitDisabled}
                className="shadow-sm"
            >
              {submitText}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};