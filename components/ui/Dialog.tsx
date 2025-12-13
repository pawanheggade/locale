import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { XMarkIcon, ChevronLeftIcon } from '../Icons';
import { Button } from './Button';
import { useIsMounted } from '../../hooks/useIsMounted';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  position?: 'center' | 'right';
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children, position = 'center' }) => {
  const [isClosing, setIsClosing] = useState(false);
  const isMounted = useIsMounted();

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      if (isMounted()) {
        onOpenChange(false);
        setIsClosing(false);
      }
    }, 300); // Animation duration must match CSS
  }, [onOpenChange, isMounted]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, handleClose]);
  
  if (!open && !isClosing) {
    return null;
  }

  const backdropAnimation = isClosing ? 'animate-fade-out' : 'animate-fade-in';
  
  const positionContainerClasses = {
    center: 'justify-center items-center p-4',
    right: 'justify-end',
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-[3000] bg-black/70',
        backdropAnimation
      )}
      onClick={handleClose}
      role="presentation"
    >
      <div className={cn('fixed inset-0 flex z-[3010]', positionContainerClasses[position])}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, { isClosing, position } as any);
          }
          return child;
        })}
      </div>
    </div>
  );
};

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { isClosing?: boolean, position?: 'center' | 'right', className?: string, trapFocus?: boolean }
>(({ className, children, isClosing, position = 'center', trapFocus = true, ...props }, ref) => {
  const internalRef = useRef<HTMLDivElement>(null);
  const dialogRef = (ref || internalRef) as React.RefObject<HTMLDivElement>;

  const panelPositionAnims = {
      center: { open: 'animate-fade-in-down', close: 'animate-fade-out-up' },
      right: { open: 'animate-slide-in-right', close: 'animate-slide-out-right' }
  };
  const panelPositionClasses = {
    center: 'rounded-xl max-h-[90vh]',
    right: 'h-full'
  };

  const panelAnimation = isClosing ? panelPositionAnims[position].close : panelPositionAnims[position].open;

  // We pass onClose as a no-op because the parent Dialog handles it.
  useFocusTrap(dialogRef, () => {}, trapFocus && !isClosing);

  return (
    <div
      ref={dialogRef}
      className={cn(
        'bg-white border border-gray-200/60 flex flex-col m-0 overflow-hidden',
        panelPositionClasses[position],
        panelAnimation,
        className
      )}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      {...props}
    >
      {children}
    </div>
  );
});

const DialogHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("relative flex items-center justify-center p-4 py-4 border-b border-gray-200/50 min-h-16 h-auto", className)} {...props} />
));

const DialogFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-4 bg-transparent border-t border-gray-200/50 flex justify-end items-center gap-2 flex-shrink-0", className)} {...props} />
));

const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
    <h2 ref={ref} className={cn("text-lg font-bold text-gray-800 leading-none tracking-tight", className)} {...props} />
));

const DialogClose: React.FC<{ onClick?: () => void }> = ({ onClick }) => (
    <Button onClick={onClick} variant="overlay-dark" size="icon-sm" className="absolute left-4 top-4 text-gray-800" aria-label="Back">
        <ChevronLeftIcon className="w-6 h-6" />
    </Button>
);


export { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogClose };