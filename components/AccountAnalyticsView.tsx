
import React, { useMemo } from 'react';
import { DisplayablePost, PostCategory, Account } from '../types';
import { DataVisualizationView } from './DataVisualizationView';
import { HeartIcon, ArchiveBoxIcon, UserIcon } from './Icons';
import { StatCard } from './StatCard';
import { PostPerformanceTable } from './PostPerformanceTable';

interface AccountAnalyticsViewProps {
  account: Account;
  accountPosts: DisplayablePost[];
  allCategories: PostCategory[];
  allAccounts: Account[];
}

export const AccountAnalyticsView: React.FC<AccountAnalyticsViewProps> = ({ account, accountPosts, allCategories, allAccounts }) => {
  
  // Calculate like stats once for both the stat card and the table
  const { postsWithStats, totalPostLikes } = useMemo(() => {
    const likeCounts = new Map<string, number>();
    
    // 1. Build a map of all likes in the system
    if (allAccounts) {
        allAccounts.forEach(acc => {
            acc.likedPostIds?.forEach(postId => {
                likeCounts.set(postId, (likeCounts.get(postId) || 0) + 1);
            });
        });
    }

    // 2. Map stats to the account's posts
    const enrichedPosts = accountPosts.map(post => ({
        ...post,
        likeCount: likeCounts.get(post.id) || 0
    }));

    // 3. Sum total likes for this account
    const totalLikes = enrichedPosts.reduce((sum, post) => sum + post.likeCount, 0);

    return { postsWithStats: enrichedPosts, totalPostLikes: totalLikes };
  }, [accountPosts, allAccounts]);

  return (
    <div className="animate-fade-in-up p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Profile Analytics</h1>
        <p className="text-md text-gray-500 mt-1">Insights into your posts and performance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Profile Views" value={account.profileViews || 0} icon={<UserIcon className="w-10 h-10 text-red-600" />} />
          <StatCard title="Profile Likes" value={account.likeCount || 0} icon={<HeartIcon className="w-10 h-10 text-red-600" />} />
          <StatCard title="Post Likes" value={totalPostLikes} icon={<HeartIcon className="w-10 h-10 text-red-600" />} />
          <StatCard title="Posts" value={accountPosts.length} icon={<ArchiveBoxIcon className="w-10 h-10 text-red-600" />} />
      </div>

      <div className="mb-8">
        <DataVisualizationView allPosts={accountPosts} categories={allCategories} account={account} />
      </div>

      <PostPerformanceTable postsWithStats={postsWithStats} />
    </div>
  );
};
