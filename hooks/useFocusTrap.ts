import React, { useEffect, useRef } from 'react';

// This hook traps focus inside a given element (e.g., a modal) and handles the Escape key to close.
export const useFocusTrap = (
  modalRef: React.RefObject<HTMLElement>,
  onClose: () => void,
  // If a modal opens another modal (like the map picker), we can disable the trap on the underlying modal.
  isTrapActive: boolean = true 
) => {
  const triggerElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // If the trap is not active, don't do anything
    if (!isTrapActive) {
      return;
    }
    
    // Save the element that had focus before the modal opened
    triggerElementRef.current = document.activeElement as HTMLElement;

    // Focus the first focusable element in the modal
    const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements && focusableElements.length > 0) {
      // Defer focus slightly to ensure the modal is fully rendered
      setTimeout(() => focusableElements[0].focus(), 0);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el: HTMLElement) => el.offsetParent !== null); // only visible elements

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) { // Shift + Tab
          if (document.activeElement === firstElement) {
            (lastElement as HTMLElement).focus();
            e.preventDefault();
          }
        } else { // Tab
          if (document.activeElement === lastElement) {
            (firstElement as HTMLElement).focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus to the original element when the modal closes
      if (isTrapActive) {
          triggerElementRef.current?.focus();
      }
    };
  }, [modalRef, onClose, isTrapActive]);
};