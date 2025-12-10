
import React, { useRef, useEffect, useMemo } from 'react';
import { Account, Post } from '../types';
import ModalShell from './ModalShell';
import { Avatar } from './Avatar';
import { Button } from './ui/Button';
import { useIsMounted } from '../hooks/useIsMounted';
import { generateContactMethods } from '../utils/account';
import { formatMonthYear } from '../utils/formatters';
import { CalendarIcon, DocumentIcon } from './Icons';
import { SubscriptionBadge } from './SubscriptionBadge';

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
        <div className="flex items-start gap-4 mb-6">
            <Avatar src={author.avatarUrl} alt={author.name} size="xl" tier={author.subscription.tier} className="shrink-0" />
            <div className="flex flex-col items-start min-w-0 flex-1">
                <div className="flex items-center gap-2 w-full">
                    <h3 className="text-xl font-bold text-gray-900 truncate">{author.businessName || author.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-600 font-medium">{author.businessName ? author.name : `@${author.username}`}</p>
                    <SubscriptionBadge tier={author.subscription.tier} />
                </div>
                
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-1.5">
                    <div className="flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3 text-gray-400" />
                        <span>Joined {formatMonthYear(author.joinDate)}</span>
                    </div>
                    {author.taxInfo && (
                        <div className="flex items-center gap-1">
                            <DocumentIcon className="w-3 h-3 text-gray-400" />
                            <span>Tax ID: {author.taxInfo}</span>
                        </div>
                    )}
                </div>
                
                {post && (
                    <p className="text-xs text-gray-500 mt-2 bg-gray-50 px-2 py-1 rounded w-full truncate">regarding: "{post.title}"</p>
                )}
            </div>
        </div>
        
        <div className="pt-4 border-t space-y-4">
          <p className="text-sm text-gray-600 text-center">
            {availableMethods.length > 0 ? 'Choose your preferred method to contact the store.' : 'This store has not provided any contact methods.'}
          </p>
          
          {availableMethods.map(method => {
                const Icon = method.icon;
                return (
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
                      <Icon className="w-8 h-8 text-red-600 flex-shrink-0" />
                      <p className="font-semibold text-gray-800">{method.label}</p>
                    </Button>
                );
          })}
        </div>
      </div>
    </ModalShell>
  );
};

export default ContactSellerModal;
