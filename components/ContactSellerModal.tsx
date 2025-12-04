


import React, { useRef, useEffect, useMemo } from 'react';
import { Account, Post } from '../types';
import ModalShell from './ModalShell';
import { Avatar } from './Avatar';
import { Button } from './ui/Button';
import { useIsMounted } from '../hooks/useIsMounted';
import { generateContactMethods } from '../utils/account';

interface ContactSellerModalProps {
  author: Account;
  post?: Post;
  currentAccount: Account;
  onClose: () => void;
  prefilledMessage?: string;
}

export const ContactSellerModal: React.FC<ContactSellerModalProps> = ({ author, post, currentAccount, onClose, prefilledMessage }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const isMounted = useIsMounted();

  const availableMethods = useMemo(() => 
    generateContactMethods(author, currentAccount, post, prefilledMessage), 
    [author, currentAccount, post, prefilledMessage]
  );

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
          <p className="text-sm text-gray-600">@{author.username}</p>
          {post ? (
            <p className="text-sm text-gray-600 mt-1">Store for "{post.title}"</p>
          ) : (
            <p className="text-sm text-gray-600 mt-1">Seller on Locale</p>
          )}
        </div>
        
        <div className="mt-6 pt-6 border-t space-y-4">
          <p className="text-sm text-gray-600 text-center">
            {availableMethods.length > 0 ? 'Choose your preferred method to contact the store.' : 'This store has not provided any contact methods.'}
          </p>
          
          {availableMethods.map(method => (
                <Button
                  as="a"
                  key={method.key}
                  href={method.href}
                  target={method.key === 'message' ? '_blank' : undefined}
                  rel={method.key === 'message' ? 'noopener noreferrer' : undefined}
                  onClick={() => {
                    setTimeout(() => { if (isMounted()) onClose(); }, 500);
                  }}
                  variant="overlay-dark"
                  className="w-full justify-start gap-4 h-auto p-3 sm:p-4 text-left rounded-lg"
                  aria-label={method.label}
                >
                  {/* FIX: The property for the icon component is 'icon' (lowercase), not 'Icon'. */}
                  <method.icon className="w-8 h-8 text-red-600 flex-shrink-0" />
                  <p className="font-semibold text-gray-800">{method.label}</p>
                </Button>
          ))}
        </div>
      </div>
    </ModalShell>
  );
};

export default ContactSellerModal;