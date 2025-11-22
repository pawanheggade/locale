
import React, { useState, useRef, useEffect } from 'react';
import { Account, DisplayablePost, PostType } from '../types';
import { EllipsisVerticalIcon, TrashIcon, PencilIcon } from './Icons';
import { usePostActions } from '../contexts/PostActionsContext';
import { Button } from './ui/Button';

interface PostActionsDropdownProps {
  post: DisplayablePost;
  isArchived: boolean;
  currentAccount: Account | null;
  variant: 'card' | 'modal';
  wrapperClassName?: string;
}

const DropdownMenuItem: React.FC<{
  onClick: (e: React.MouseEvent) => void;
  icon: React.ReactNode;
  label: string;
  className?: string;
}> = ({ onClick, icon, label, className = '' }) => (
  <li>
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center gap-3 px-4 py-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-500 ${className}`}
    >
      {icon}
      {label}
    </button>
  </li>
);


export const PostActionsDropdown: React.FC<PostActionsDropdownProps> = ({
  post,
  isArchived,
  currentAccount,
  variant,
  wrapperClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isMountedRef = useRef(true);
  const postActions = usePostActions();

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const { onDeletePermanently, onEdit } = postActions;
  const isOwnPost = post.authorId === currentAccount?.id;

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        if (isMountedRef.current) {
          setIsOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleAction = (action: (id: string) => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    action(post.id);
    setIsOpen(false);
  };

  const menuItems: React.ReactNode[] = [];

  // Admin/Owner items
  const adminItems: React.ReactNode[] = [];
  if (isOwnPost || currentAccount?.role === 'admin') {
    // Show EDIT if NOT archived
    if (!isArchived) {
      adminItems.push(
        <DropdownMenuItem
          key="edit"
          onClick={handleAction(onEdit)}
          icon={<PencilIcon className="w-5 h-5 text-amber-500" />}
          label="Edit"
        />
      );
    }

    // Show DELETE if IS archived
    if (isArchived) {
      if (onDeletePermanently) {
        adminItems.push(
          <DropdownMenuItem
            key="delete"
            onClick={handleAction(onDeletePermanently)}
            icon={<TrashIcon className="w-5 h-5" />}
            label="Delete"
            className="text-red-700"
          />
        );
      }
    }
  }

  if (adminItems.length > 0) {
    if (menuItems.length > 0) {
      menuItems.push(<div key="divider" className="my-1 h-px bg-gray-100" />);
    }
    menuItems.push(...adminItems);
  }

  if (menuItems.length === 0) {
    return null;
  }

  return (
    <div className={`relative ${wrapperClassName}`} ref={menuRef}>
      <Button
        ref={buttonRef}
        onClick={(e) => { e.stopPropagation(); setIsOpen(prev => !prev); }}
        variant={variant === 'modal' ? 'glass' : 'glass-dark'}
        size="icon-sm"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="More options"
        title="More options"
        className={variant === 'modal' ? 'text-gray-700' : 'text-white'}
      >
        <EllipsisVerticalIcon className="w-5 h-5" aria-hidden="true" />
      </Button>
      {isOpen && (
        <div
          className="absolute top-full right-0 mt-2 w-56 origin-top-right bg-white rounded-lg shadow-xl border z-10 animate-zoom-in"
          onClick={e => e.stopPropagation()}
          role="menu"
        >
          <ul className="py-1 text-sm text-gray-700">
            {menuItems}
          </ul>
        </div>
      )}
    </div>
  );
};
