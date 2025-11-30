
import React, { useRef, useState } from 'react';
import { ConfirmationModalData } from '../types';
import ModalShell from './ModalShell';
import { ModalFooter } from './ModalFooter';
import { AlertIcon } from './Icons';

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
        onClose(); // Only close on success
    } catch (error) {
        console.error("Confirmation action failed:", error);
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
  
  const isDestructive = confirmClassName?.includes('red') || confirmClassName?.includes('destructive') || confirmClassName?.includes('amber');

  return (
    <ModalShell
      panelRef={modalRef}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          {isDestructive && <AlertIcon className="w-6 h-6 text-amber-500" />}
          <span>{title}</span>
        </div>
      }
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