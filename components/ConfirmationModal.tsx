
import React, { useRef } from 'react';
import { Button } from './ui/Button';
import { ConfirmationModalData } from '../types';
import { cn } from '../lib/utils';
import ModalShell from './ModalShell';

interface ConfirmationModalProps extends ConfirmationModalData {
  onClose: () => void;
  isConfirming: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
  onClose,
  title, 
  message, 
  onConfirm, 
  confirmText = 'Delete',
  confirmClassName,
  isConfirming,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const renderFooter = () => (
    <>
      <Button variant="glass" onClick={onClose} disabled={isConfirming}>
        Cancel
      </Button>
      <Button 
        onClick={onConfirm} 
        isLoading={isConfirming}
        variant="glass-red"
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
