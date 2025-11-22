
import React, { useRef, useEffect, useMemo } from 'react';
import { Account, Post } from '../types';
import ModalShell from './ModalShell';
import { PhoneIcon, EnvelopeIcon, ChatBubbleBottomCenterTextIcon } from './Icons';
import { useUI } from '../contexts/UIContext';
import { Avatar } from './Avatar';

interface ContactSellerModalProps {
  author: Account;
  post?: Post;
  currentAccount: Account;
  onClose: () => void;
  prefilledMessage?: string;
}

export const ContactSellerModal: React.FC<ContactSellerModalProps> = ({ author, post, currentAccount, onClose, prefilledMessage }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const { addToast } = useUI();

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const contactMethods = useMemo(() => {
    const subject = encodeURIComponent(post ? `Inquiry about your post: "${post.title}" on Locale` : `Inquiry from Locale`);
    const body = encodeURIComponent(prefilledMessage || (post ? `Hi ${author.name},\n\nI'm interested in your post "${post.title}" (ID: ${post.id}).\n\n[Your message here]\n\nThanks,\n${currentAccount.name}` : `Hi ${author.name},\n\nI'm interested in your profile on Locale.\n\n[Your message here]\n\nThanks,\n${currentAccount.name}`));

    return [
        {
            key: 'email' as const,
            label: 'Send Email',
            Icon: EnvelopeIcon,
            href: `mailto:${author.email}?subject=${subject}&body=${body}`,
            isVisible: author.contactOptions?.includes('email') && !!author.email,
            toast: 'Opening your email client...',
        },
        {
            key: 'mobile' as const,
            label: 'Call Mobile',
            Icon: PhoneIcon,
            href: `tel:${author.mobile}`,
            isVisible: author.contactOptions?.includes('mobile') && !!author.mobile,
            toast: 'Opening your phone app...',
        },
        {
            key: 'message' as const,
            label: 'Send Message',
            Icon: ChatBubbleBottomCenterTextIcon,
            href: `https://wa.me/${author.messageNumber?.replace(/\D/g, '')}`,
            isVisible: author.contactOptions?.includes('message') && !!author.messageNumber,
            toast: 'Opening messaging app...',
        }
    ];
  }, [author, post, currentAccount, prefilledMessage]);

  const availableMethods = contactMethods.filter(m => m.isVisible);

  return (
    <ModalShell
      panelRef={modalRef}
      onClose={onClose}
      title={`Contact ${author.name}`}
      panelClassName="w-full max-w-md"
      titleId="contact-seller-title"
    >
      <div className="p-4 sm:p-6">
        <div className="flex flex-col items-center text-center">
          <Avatar src={author.avatarUrl} alt={author.name} size="2xl" tier={author.subscription.tier} />
          <h3 className="mt-4 text-xl font-bold text-gray-800">{author.name}</h3>
          <p className="text-sm text-gray-500">@{author.username}</p>
          {post ? (
            <p className="text-sm text-gray-500 mt-1">Store for "{post.title}"</p>
          ) : (
            <p className="text-sm text-gray-500 mt-1">Seller on Locale</p>
          )}
        </div>
        
        <div className="mt-6 pt-6 border-t space-y-4">
          <p className="text-sm text-gray-600 text-center">
            {availableMethods.length > 0 ? 'Choose your preferred method to contact the store.' : 'This store has not provided any contact methods.'}
          </p>
          
          {availableMethods.map(method => {
              const commonClasses = "w-full flex items-center gap-4 p-3 sm:p-4 rounded-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 disabled:opacity-70 glass-button-pill";
              const content = (
                <>
                  <method.Icon className="w-8 h-8 text-red-600 flex-shrink-0" />
                  <p className="font-semibold text-gray-800">{method.label}</p>
                </>
              );

              return (
                <a
                  key={method.key}
                  href={method.href}
                  className={commonClasses}
                  target={method.key === 'message' ? '_blank' : undefined}
                  rel={method.key === 'message' ? 'noopener noreferrer' : undefined}
                  onClick={() => {
                    addToast(method.toast, 'success');
                    // close modal after a short delay to allow link to open
                    setTimeout(() => {
                        if (isMountedRef.current) {
                            onClose();
                        }
                    }, 500);
                  }}
                >
                  {content}
                </a>
              );
          })}
        </div>
      </div>
    </ModalShell>
  );
};

export default ContactSellerModal;
