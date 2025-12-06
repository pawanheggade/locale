import React, { useState, createContext, useContext, useRef, ReactNode } from 'react';
import { ChevronDownIcon } from '../Icons';
import { cn } from '../../lib/utils';

interface AccordionContextType {
  openItems: string[];
  toggleItem: (value: string) => void;
  type: 'single' | 'multiple';
}

const AccordionContext = createContext<AccordionContextType | undefined>(undefined);

const useAccordion = () => {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('useAccordion must be used within an Accordion component');
  }
  return context;
};

interface AccordionProps {
  type: 'single' | 'multiple';
  defaultValue?: string | string[];
  children: ReactNode;
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({ type, defaultValue, children, className }) => {
  const [openItems, setOpenItems] = useState<string[]>(
    defaultValue ? (Array.isArray(defaultValue) ? defaultValue : [defaultValue]) : []
  );

  const toggleItem = (value: string) => {
    setOpenItems(prev => {
      if (type === 'single') {
        return prev.includes(value) ? [] : [value];
      }
      // multiple
      return prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value];
    });
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem, type }}>
      <div className={cn('w-full', className)}>{children}</div>
    </AccordionContext.Provider>
  );
};

interface AccordionItemProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({ value, children, className }) => {
  const { openItems } = useAccordion();
  const isOpen = openItems.includes(value);

  return (
    <div data-state={isOpen ? 'open' : 'closed'} className={cn('border-b', className)}>
      {React.Children.map(children, child =>
        React.isValidElement(child) ? React.cloneElement(child, { value } as any) : child
      )}
    </div>
  );
};

export const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  React.HTMLAttributes<HTMLButtonElement> & { value?: string }
>(({ className, children, value, ...props }, ref) => {
  const { toggleItem, openItems } = useAccordion();
  const isOpen = value ? openItems.includes(value) : false;

  return (
    <button
      ref={ref}
      onClick={() => value && toggleItem(value)}
      aria-expanded={isOpen}
      data-state={isOpen ? 'open' : 'closed'}
      className={cn('flex flex-1 items-center justify-between py-4 font-medium w-full [&[data-state=open]>svg]:rotate-180', className)}
      {...props}
    >
      {children}
      <ChevronDownIcon className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </button>
  );
});

export const AccordionContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value?: string }
>(({ className, children, value, ...props }, ref) => {
    const { openItems } = useAccordion();
    const isOpen = value ? openItems.includes(value) : false;
    const contentRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(0);

    React.useLayoutEffect(() => {
        if (contentRef.current) {
            setHeight(isOpen ? contentRef.current.scrollHeight : 0);
        }
    }, [isOpen, children]);

  return (
    <div
      style={{ height, overflow: 'hidden', transition: 'height 0.2s ease-out' }}
      data-state={isOpen ? 'open' : 'closed'}
      aria-hidden={!isOpen}
    >
      <div ref={contentRef} className={cn('pb-4 pt-0', className)} {...props}>
        {children}
      </div>
    </div>
  );
});