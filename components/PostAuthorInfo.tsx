
import React from 'react';
import { Account, DisplayablePost } from '../types';
import { timeSince } from '../utils/formatters';
import { wasPostEdited } from '../utils/posts';
import { SubscriptionBadge } from './SubscriptionBadge';
import { Avatar } from './Avatar';
import { useNavigation } from '../App';

interface PostAuthorInfoProps {
  author: Account;
  post: DisplayablePost;
  size?: 'small' | 'medium';
  showAvatar?: boolean;
  children?: React.ReactNode;
  subscriptionBadgeIconOnly?: boolean;
  location?: React.ReactNode;
}

export const PostAuthorInfo: React.FC<PostAuthorInfoProps> = ({ author, post, size = 'small', showAvatar = true, children, subscriptionBadgeIconOnly = false, location }) => {
  const { navigateTo } = useNavigation();
  const nameClasses = size === 'small' ? 'text-sm' : 'text-base';
  const metaClasses = size === 'small' ? 'text-xs' : 'text-sm';
  const wrapperPadding = size === 'small' ? 'p-1 -ml-1' : 'p-2 -ml-2';
  
  const wasUpdated = wasPostEdited(post);
  const displayName = author.businessName || author.name;
  
  const handleProfileClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      navigateTo('account', { account: author });
  };

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
                <p className={`${nameClasses} font-semibold text-gray-800 truncate flex items-center gap-2 group-hover:text-gray-600 transition-colors leading-tight`}>
                    <span className="truncate">{displayName}</span>
                    <SubscriptionBadge tier={author.subscription?.tier} iconOnly={subscriptionBadgeIconOnly} />
                </p>
                <p className={`${metaClasses} text-gray-600 truncate leading-tight`}>
                    <span>@{author.username}</span>
                    {wasUpdated && (
                        <>
                        <span className="mx-1">&bull;</span>
                        <span title={new Date(post.lastUpdated).toLocaleString()}>updated {timeSince(post.lastUpdated)}</span>
                        </>
                    )}
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
            <div className="flex-shrink-0 self-center">
                {children}
            </div>
        )}
    </div>
  );
};
