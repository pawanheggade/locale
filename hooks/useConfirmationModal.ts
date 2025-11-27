import { useCallback } from 'react';
import { useUI } from '../contexts/UIContext';
import { ConfirmationModalData } from '../types';

/**
 * A hook to easily show a confirmation dialog.
 * @returns A function that takes confirmation modal data and opens the modal.
 */
export const useConfirmationModal = () => {
  const { openModal } = useUI();

  const showConfirmation = useCallback((data: ConfirmationModalData) => {
    openModal({
      type: 'confirmation',
      data,
    });
  }, [openModal]);

  return showConfirmation;
};
