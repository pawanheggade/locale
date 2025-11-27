
import React, { useState, useMemo } from 'react';
import { Account, DisplayablePost } from '../types';
import { PostList } from './PostList';
import { TabButton } from './ui/Button';
import { HeartIcon } from './Icons';
import { Avatar } from './Avatar';
import { EmptyState } from './EmptyState';

interface LikesViewProps {
  likedPosts: DisplayablePost[];
  onViewAccount: (accountId: string) => void;
  currentAccount: Account;
  allAccounts: Account[];
}

type LikedTab = 'posts' | 'profiles';

const LikesView: React.FC<LikesViewProps> = ({ likedPosts, onViewAccount, currentAccount, allAccounts }) => {
  const [activeTab, setActiveTab] = useState<LikedTab>('posts');

  const likedAccounts = useMemo(() => {
      const likedIds = new Set(currentAccount?.likedAccountIds || []);
      return allAccounts.filter(acc => likedIds.has(acc.id));
  }, [currentAccount, allAccounts]);

  return (
    <div className="animate-fade-in-up p-4 sm:p-6 lg:p-8">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {likedAccounts.map((account) => {
                  return (
                    <div
                      key={account.id}
                      onClick={() => onViewAccount(account.id)}
                      onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onViewAccount(account.id);
                          }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`View profile of ${account.name}`}
                      className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center text-center transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500"
                    >
                      <Avatar src={account.avatarUrl} alt={account.name} size="2xl" tier={account.subscription.tier} className="ring-offset-2 ring-offset-white" />
                      <h2 className="mt-4 text-xl font-bold text-gray-800">{account.name}</h2>
                      <p className="text-md text-gray-500">@{account.username}</p>
                      <p className="mt-2 text-sm text-gray-600 flex-grow min-h-[40px] line-clamp-2">{account.description}</p>
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

export default LikesView;
