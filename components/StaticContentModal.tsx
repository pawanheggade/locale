
import React, { useRef, useMemo } from 'react';
import ModalShell from './ModalShell';
import { sanitizeHtml } from '../utils/security';
import { ModalFooter } from './ModalFooter';

interface StaticContentModalProps {
  onClose: () => void;
  title: string;
  content: string;
}

export const StaticContentModal: React.FC<StaticContentModalProps> = ({ onClose, title, content }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const renderFooter = () => (
    <ModalFooter onCancel={onClose} cancelText="Close" />
  );

  const sanitizedContent = useMemo(() => sanitizeHtml(content), [content]);

  return (
    <ModalShell
      panelRef={modalRef}
      onClose={onClose}
      title={title}
      footer={renderFooter()}
      panelClassName="w-full max-w-2xl"
      titleId="static-content-modal-title"
    >
      <div className="p-6 prose max-w-none" dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
    </ModalShell>
  );
};
