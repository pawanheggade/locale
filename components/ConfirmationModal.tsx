

import React, { useRef, useState } from 'react';
import { Button } from './ui/Button';
import { ConfirmationModalData } from '../types';
import { cn } from '../lib/utils';
import ModalShell from './ModalShell';

interface ConfirmationModalProps extends ConfirmationModalData {
  onClose: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
  onClose,
  title, 
  message, 
  onConfirm, 
  confirmText = 'Delete',
  confirmClassName,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
        await onConfirm();
    } catch (error) {
        console.error("Confirmation action failed:", error);
        // Optionally show a toast here if context was available
    } finally {
        onClose(); // Close the modal regardless of outcome
    }
  };

  const renderFooter = () => (
    <>
      <Button variant="overlay-dark" onClick={onClose} disabled={isConfirming}>
        Cancel
      </Button>
      <Button 
        onClick={handleConfirm} 
        isLoading={isConfirming}
        variant="pill-red"
        className={confirmClassName}
      >
        {confirmText}
      </Button>
    </>
  );

  return (
    <ModalShell
      panelRef={modalRef}
      onClose={onClose}
      title={title}
      footer={renderFooter()}
      panelClassName="w-full max-w-md"
      titleId="confirmation-modal-title"
    >
      <div className="p-6">
        <p className="text-sm text-gray-800">{message}</p>
      </div>
    </ModalShell>
  );
};