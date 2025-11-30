
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from './ui/Dialog';

interface ModalShellProps {
  panelRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
  title: React.ReactNode;
  titleId: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  panelClassName?: string;
  position?: 'center' | 'right' | 'left';
  trapFocus?: boolean;
}

const ModalShell: React.FC<ModalShellProps> = ({
  panelRef,
  onClose,
  title,
  titleId,
  children,
  footer,
  panelClassName,
  position = 'center',
  trapFocus = true,
}) => {
  const onOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={true} onOpenChange={onOpenChange} position={position}>
      <DialogContent ref={panelRef} className={panelClassName} trapFocus={trapFocus} position={position}> 
        <DialogHeader>
          <DialogTitle id={titleId}>{title}</DialogTitle>
          <DialogClose onClick={onClose} />
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
            {children}
        </div>
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
};

export default ModalShell;