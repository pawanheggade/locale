import React, { useState, useMemo } from 'react';
import { Account, DisplayablePost } from '../types';
import { PostList } from './PostList';
import { TabButton } from './ui/Button';
import { HeartIcon } from './Icons';
import { Avatar } from './Avatar';
import { EmptyState } from './EmptyState';
import { useNavigation } from '../contexts/NavigationContext';

interface LikesViewProps {
  likedPosts: DisplayablePost[];
  currentAccount: Account;
  allAccounts: Account[];
}

type LikedTab = 'posts' | 'profiles';

export const LikesView: React.FC<LikesViewProps> = ({ likedPosts, currentAccount, allAccounts }) => {
  const [activeTab, setActiveTab] = useState<LikedTab>('posts');
  const { navigateTo } = useNavigation();

  const likedAccounts = useMemo(() => {
      const likedIds = new Set(currentAccount?.likedAccountIds || []);
      return allAccounts.filter(acc => likedIds.has(acc.id));
  }, [currentAccount, allAccounts]);

  const onViewAccount = (account: Account) => {
      navigateTo('account', { account });
  };

  return (
    <div className="animate-fade-in-down p-4 sm:p-6 lg:p-8">
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-6 px-2 overflow-x-auto hide-scrollbar" role="tablist" aria-label="Likes content">
          <TabButton onClick={() => setActiveTab('posts')} isActive={activeTab === 'posts'}>
            Posts <span className={activeTab === 'posts' ? "text-red-600 font-normal" : "text-gray-400 font-normal"}>({likedPosts.length})</span>
          </TabButton>
          <TabButton onClick={() => setActiveTab('profiles')} isActive={activeTab === 'profiles'}>
            Profiles <span className={activeTab === 'profiles' ? "text-red-600 font-normal" : "text-gray-400 font-normal"}>({likedAccounts.length})</span>
          </TabButton>
        </nav>
      </div>

      <div>
        {activeTab === 'posts' && (
          <div>
            {likedPosts.length === 0 ? (
              <EmptyState
                icon={<HeartIcon />}
                title="No Liked Posts Yet"
                description="Tap the heart on posts you love to save them here."
                className="py-20"
              />
            ) : (
              <PostList
                posts={likedPosts}
                currentAccount={currentAccount}
                variant="compact"
              />
            )}
          </div>
        )}

        {activeTab === 'profiles' && (
          <div>
            {likedAccounts.length === 0 ? (
              <EmptyState
                icon={<HeartIcon />}
                title="No Liked Profiles Yet"
                description="Show your support for local sellers by liking their profiles."
                className="py-20"
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {likedAccounts.map((account) => {
                  return (
                    <div
                      key={account.id}
                      onClick={() => onViewAccount(account)}
                      onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onViewAccount(account);
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
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};