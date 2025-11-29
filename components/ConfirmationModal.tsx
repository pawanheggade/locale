
import React, { useRef, useState } from 'react';
import { ConfirmationModalData } from '../types';
import ModalShell from './ModalShell';
import { ModalFooter } from './ModalFooter';
import { useUI } from '../contexts/UIContext';

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
  const { addToast } = useUI();

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
        await onConfirm();
        onClose(); // Only close on success
    } catch (error) {
        console.error("Confirmation action failed:", error);
        addToast(error instanceof Error ? error.message : "An unexpected error occurred.", 'error');
        setIsConfirming(false); // Reset loading state on failure
    }
  };

  const renderFooter = () => (
    <ModalFooter
        onCancel={onClose}
        cancelDisabled={isConfirming}
        onSubmit={handleConfirm}
        submitText={confirmText}
        isSubmitting={isConfirming}
        submitClassName={confirmClassName}
    />
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