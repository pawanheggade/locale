import React from 'react';
import { Account } from '../types';
import { Avatar } from './Avatar';

interface AccountCardProps {
    account: Account;
    onClick: (account: Account) => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({ account, onClick }) => (
    <div
      onClick={() => onClick(account)}
      onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onClick(account);
          }
      }}
      role="button"
      tabIndex={0}
      aria-label={`View profile of ${account.name}`}
      className="bg-white rounded-xl border border-gray-200/80 p-4 flex flex-col items-center gap-3 cursor-pointer hover:border-red-200 transition-all active:scale-95"
    >
      <Avatar src={account.avatarUrl} alt={account.name} size="xl" tier={account.subscription.tier} />
      <div className="text-center w-full">
        <h3 className="font-bold text-gray-900 text-sm truncate">{account.name}</h3>
        <p className="text-xs text-gray-500 truncate">@{account.username}</p>
      </div>
    </div>
);