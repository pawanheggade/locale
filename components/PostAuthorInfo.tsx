
import React from 'react';
import { Account } from '../types';
import { SubscriptionBadge } from './SubscriptionBadge';
import { Avatar } from './Avatar';
import { useNavigation } from '../contexts/NavigationContext';
import { cn } from '../lib/utils';

interface PostAuthorInfoProps {
  author: Account;
  size?: 'small' | 'medium';
  showAvatar?: boolean;
  children?: React.ReactNode;
  subscriptionBadgeIconOnly?: boolean;
  location?: React.ReactNode;
  variant?: 'default' | 'overlay';
  hideName?: boolean;
}

export const PostAuthorInfo: React.FC<PostAuthorInfoProps> = ({ author, size = 'small', showAvatar = true, children, subscriptionBadgeIconOnly = false, location, variant = 'default', hideName = false }) => {
  const { navigateTo } = useNavigation();
  const wrapperPadding = size === 'small' ? 'p-1 -ml-1' : 'p-2 -ml-2';
  
  const displayName = hideName ? `@${author.username}` : (author.businessName || author.name);
  
  const handleProfileClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      navigateTo('account', { account: author });
  };
  
  const textColor = variant === 'overlay' ? 'text-white' : 'text-gray-900';
  const subTextColor = variant === 'overlay' ? 'text-gray-200' : 'text-gray-600';

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
                <div className="flex items-center gap-1.5 leading-tight">
                    <span className={cn(
                        `font-bold ${textColor} truncate`,
                        size === 'small' ? 'text-sm' : 'text-base'
                    )}>
                        {displayName}
                    </span>
                    <SubscriptionBadge tier={author.subscription?.tier} iconOnly={subscriptionBadgeIconOnly} className="w-3.5 h-3.5" />
                </div>
                {!hideName && (
                    <p className={`text-xs ${subTextColor} truncate mt-0.5 font-medium`}>
                        @{author.username}
                    </p>
                )}
            </div>
            {location && (
                <div className="mt-1 animate-fade-in">
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
