
import React from 'react';
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
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] animate-slide-in-up" style={{ animationDelay: '200ms' }}>
      <div className="bg-white/80 backdrop-blur-md border-t border-gray-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="py-3 flex items-center gap-3">
            <Button variant="overlay-dark" onClick={onCancel} className="mr-auto" disabled={isLoading}>{cancelText}</Button>
            <Button 
                type={submitFormId ? 'submit' : 'button'} 
                form={submitFormId} 
                onClick={onSubmit} 
                isLoading={isLoading} 
                size="lg" 
                variant="pill-red"
                disabled={submitDisabled}
            >
              {submitText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
