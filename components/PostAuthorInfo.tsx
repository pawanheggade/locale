

import React from 'react';
import { Account } from '../types';
import { SubscriptionBadge } from './SubscriptionBadge';
import { Avatar } from './Avatar';
import { useNavigation } from '../contexts/NavigationContext';

interface PostAuthorInfoProps {
  author: Account;
  size?: 'small' | 'medium';
  showAvatar?: boolean;
  children?: React.ReactNode;
  subscriptionBadgeIconOnly?: boolean;
  location?: React.ReactNode;
  variant?: 'default' | 'overlay';
}

export const PostAuthorInfo: React.FC<PostAuthorInfoProps> = ({ author, size = 'small', showAvatar = true, children, subscriptionBadgeIconOnly = false, location, variant = 'default' }) => {
  const { navigateTo } = useNavigation();
  const nameClasses = size === 'small' ? 'text-sm' : 'text-base';
  const wrapperPadding = size === 'small' ? 'p-1 -ml-1' : 'p-2 -ml-2';
  
  const displayName = author.businessName || author.name;
  
  const handleProfileClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      navigateTo('account', { account: author });
  };
  
  const usernameColor = variant === 'overlay' ? 'text-white' : 'text-gray-800';


  return (
    <div className="flex items-center justify-between gap-3">
        <div className={`flex items-center gap-3 min-w-0 flex-1 ${wrapperPadding}`}>
          {showAvatar && (
            <div onClick={handleProfileClick} className="cursor-pointer flex-shrink-0 self-start mt-0.5">
                <Avatar 
                    src={author.avatarUrl} 
                    alt={displayName} 
                    size={size === 'small' ? 'sm' : 'md'} 
                    tier={author.subscription.tier}
                    className={size === 'small' ? 'w-9 h-9' : undefined} 
                />
            </div>
          )}
          <div className="truncate flex-1 flex flex-col">
            <div 
                onClick={handleProfileClick} 
                className="cursor-pointer group focus:outline-none"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleProfileClick(e as any)}
            >
                <p className={`${nameClasses} font-semibold ${usernameColor} leading-tight flex items-center gap-1.5`}>
                    <span className="truncate">@{author.username}</span>
                    <SubscriptionBadge tier={author.subscription?.tier} iconOnly={subscriptionBadgeIconOnly} />
                </p>
            </div>
            {location && (
                <div className="mt-0.5 animate-fade-in">
                    {location}
                </div>
            )}
          </div>
        </div>
        {children && (
            <div className="flex-shrink-0 self-center flex items-center gap-1">
                {children}
            </div>
        )}
    </div>
  );
};
