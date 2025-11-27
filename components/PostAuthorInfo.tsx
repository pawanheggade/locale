
import React from 'react';
import { Account, DisplayablePost } from '../types';
import { timeSince } from '../utils/formatters';
import { SubscriptionBadge } from './SubscriptionBadge';
import { Avatar } from './Avatar';

interface PostAuthorInfoProps {
  author: Account;
  post: DisplayablePost;
  onViewAccount: (accountId: string) => void;
  size?: 'small' | 'medium';
  showAvatar?: boolean;
  children?: React.ReactNode;
  subscriptionBadgeIconOnly?: boolean;
}

export const PostAuthorInfo: React.FC<PostAuthorInfoProps> = ({ author, post, onViewAccount, size = 'small', showAvatar = true, children, subscriptionBadgeIconOnly = false }) => {
  const nameClasses = size === 'small' ? 'text-sm' : 'text-base';
  const metaClasses = size === 'small' ? 'text-xs' : 'text-sm';
  const wrapperPadding = size === 'small' ? 'p-1 -ml-1' : 'p-2 -ml-2';
  
  const wasUpdated = post.lastUpdated && post.lastUpdated > parseInt(post.id, 10) + 60000;
  const displayName = author.businessName || author.name;
  
  const currentColors = {
      name: 'text-gray-800',
      meta: 'text-gray-600'
  };

  return (
    <div className="flex items-center justify-between gap-3">
        <button
          onClick={(e) => { e.stopPropagation(); onViewAccount(author.id); }}
          className={`flex items-center gap-3 min-w-0 text-left rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 flex-1 ${wrapperPadding}`}
          aria-label={`View profile of ${displayName}`}
        >
          {showAvatar && (
            <Avatar 
                src={author.avatarUrl} 
                alt={displayName} 
                size={size === 'small' ? 'sm' : 'md'} 
                tier={author.subscription.tier}
                // For 'sm' we want w-9 h-9 which isn't standard in Avatar, but 'sm' (w-8) is close.
                // 'md' is w-10 h-10 which matches.
                // We can override via className if strict pixel perfection is needed:
                className={size === 'small' ? 'w-9 h-9' : undefined} 
            />
          )}
          <div className="truncate flex-1">
            <p className={`${nameClasses} font-semibold ${currentColors.name} truncate flex items-center gap-2`}>
              <span className="truncate">{displayName}</span>
              <SubscriptionBadge tier={author.subscription?.tier} iconOnly={subscriptionBadgeIconOnly} />
            </p>
            <p className={`${metaClasses} ${currentColors.meta} truncate`}>
              <span>@{author.username}</span>
              {wasUpdated && (
                <>
                  <span className="mx-1">&bull;</span>
                  <span title={new Date(post.lastUpdated).toLocaleString()}>updated {timeSince(post.lastUpdated)}</span>
                </>
              )}
            </p>
          </div>
        </button>
        {children}
    </div>
  );
};
