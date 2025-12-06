import React, { useState, useRef, useEffect } from 'react';
import { Account, DisplayablePost } from '../types';
import { EllipsisVerticalIcon, TrashIcon, PencilIcon, FlagIcon } from './Icons';
import { usePosts } from '../contexts/PostsContext';
import { Button } from './ui/Button';
import { useClickOutside } from '../hooks/useClickOutside';
import { useIsMounted } from '../hooks/useIsMounted';
import { useNavigation } from '../contexts/NavigationContext';

interface PostActionsDropdownProps {
  post: DisplayablePost;
  isArchived: boolean;
  currentAccount: Account | null;
  variant: 'card' | 'modal';
  wrapperClassName?: string;
  onReport?: () => void;
}

const DropdownMenuItem: React.FC<{
  onClick: (e: React.MouseEvent) => void;
  icon: React.ReactNode;
  label: string;
  className?: string;
}> = ({ onClick, icon, label, className = '' }) => (
  <li>
    <Button
      onClick={onClick}
      variant="ghost"
      className={`w-full text-left justify-start font-normal h-auto flex items-center gap-3 px-4 py-2.5 rounded-none ${className}`}
    >
      {icon}
      {label}
    </Button>
  </li>
);


export const PostActionsDropdown: React.FC<PostActionsDropdownProps> = ({
  post,
  isArchived,
  currentAccount,
  variant,
  wrapperClassName = '',
  onReport,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isMounted = useIsMounted();
  const { deletePostPermanently } = usePosts();
  const { navigateTo } = useNavigation();

  useClickOutside(menuRef, () => {
      if (isMounted()) setIsOpen(false);
  }, isOpen);

  const onEdit = (postId: string) => navigateTo('editPost', { postId });
  const isOwnPost = post.authorId === currentAccount?.id;

  const handleAction = (action: (id: string) => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    action(post.id);
    setIsOpen(false);
  };

  const menuItems: React.ReactNode[] = [];

  // Report item
  if (onReport && !isOwnPost) {
    menuItems.push(
      <DropdownMenuItem
        key="report"
        onClick={(e) => {
          e.stopPropagation();
          onReport();
          setIsOpen(false);
        }}
        icon={<FlagIcon className="w-5 h-5 text-gray-500" />}
        label="Report"
      />
    );
  }

  // Admin/Owner items
  const adminItems: React.ReactNode[] = [];
  if (isOwnPost || currentAccount?.role === 'admin') {
    // Show EDIT if NOT archived. 
    // Hide for Owner as they have an Edit button in the main footer.
    // Admins still need it here as they don't see the footer Edit button.
    if (!isArchived && !isOwnPost) {
      adminItems.push(
        <DropdownMenuItem
          key="edit"
          onClick={handleAction(onEdit)}
          icon={<PencilIcon className="w-5 h-5 text-gray-500" />}
          label="Edit"
        />
      );
    }

    // Show DELETE if IS archived
    if (isArchived) {
      adminItems.push(
        <DropdownMenuItem
          key="delete"
          onClick={handleAction(deletePostPermanently)}
          icon={<TrashIcon className="w-5 h-5" />}
          label="Delete"
          className="text-red-700"
        />
      );
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
        variant={variant === 'modal' ? 'ghost' : 'overlay-dark'}
        size="icon-sm"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="More options"
        title="More options"
        className={variant === 'modal' ? 'text-gray-500' : 'text-gray-400 hover:text-gray-600'}
      >
        <EllipsisVerticalIcon className="w-5 h-5" aria-hidden="true" />
      </Button>
      {isOpen && (
        <div
          className="absolute top-full right-0 mt-2 w-56 origin-top-right bg-white rounded-lg shadow-xl border z-10 animate-zoom-in"
          onClick={e => e.stopPropagation()}
          role="menu"
        >
          <ul className="py-1 text-sm text-gray-600">
            {menuItems}
          </ul>
        </div>
      )}
    </div>
  );
};