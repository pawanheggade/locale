
import React, { useMemo } from 'react';
import { DisplayablePost, PostCategory, Account } from '../types';
import { DataVisualizationView } from './DataVisualizationView';
import { HeartIcon, ArchiveBoxIcon, UserIcon } from './Icons';
import { StatCard } from './StatCard';

interface AccountAnalyticsViewProps {
  account: Account;
  accountPosts: DisplayablePost[];
  allCategories: PostCategory[];
  allAccounts: Account[];
}

export const AccountAnalyticsView: React.FC<AccountAnalyticsViewProps> = ({ account, accountPosts, allCategories, allAccounts }) => {
  const totalPostLikes = useMemo(() => {
    const postIds = new Set(accountPosts.map(p => p.id));
    let totalLikes = 0;
    if (allAccounts) {
      for (const acc of allAccounts) {
        if (acc.likedPostIds) {
          for (const likedPostId of acc.likedPostIds) {
            if (postIds.has(likedPostId)) {
              totalLikes++;
            }
          }
        }
      }
    }
    return totalLikes;
  }, [accountPosts, allAccounts]);

  return (
    <div className="animate-fade-in-up p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Profile Analytics</h1>
        <p className="text-md text-gray-500 mt-1">Insights into your posts and performance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard title="Profile Views" value={account.profileViews || 0} icon={<UserIcon className="w-10 h-10 text-red-600" />} />
          <StatCard title="Profile Likes" value={account.likeCount || 0} icon={<HeartIcon className="w-10 h-10 text-red-600" />} />
          <StatCard title="Post Likes" value={totalPostLikes} icon={<HeartIcon className="w-10 h-10 text-red-600" />} />
          <StatCard title="Posts" value={accountPosts.length} icon={<ArchiveBoxIcon className="w-10 h-10 text-red-600" />} />
      </div>

      <DataVisualizationView allPosts={accountPosts} categories={allCategories} accounts={allAccounts} account={account} />
    </div>
  );
};
