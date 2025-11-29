
import React, { useRef, useState } from 'react';
import { ConfirmationModalData } from '../types';
import ModalShell from './ModalShell';
import { ModalFooter } from './ModalFooter';

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
    } finally {
        onClose();
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
