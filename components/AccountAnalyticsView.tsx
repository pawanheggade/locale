import React, { useMemo } from 'react';
import { DisplayablePost, PostCategory, Account } from '../types';
import { DataVisualizationView } from './DataVisualizationView';
import { HeartIcon, ArchiveBoxIcon, UserIcon, DocumentIcon } from './Icons';
import { StatCard } from './StatCard';
import { PostPerformanceTable } from './PostPerformanceTable';
import { usePostLikeCounts } from '../hooks/usePostLikeCounts';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../contexts/PostsContext';

interface AccountAnalyticsViewProps {
  account: Account;
}

export const AccountAnalyticsView: React.FC<AccountAnalyticsViewProps> = ({ account }) => {
  const { accounts: allAccounts } = useAuth();
  const { posts: allPosts, categories: allCategories } = usePosts();
  
  const accountPosts = useMemo(() => {
    return allPosts.filter(post => post.authorId === account.id);
  }, [allPosts, account.id]);
  
  const likeCounts = usePostLikeCounts(allAccounts);

  // Calculate like stats once for both the stat card and the table
  const { postsWithStats, totalPostLikes } = useMemo(() => {
    // 1. Map stats to the account's posts
    const enrichedPosts = accountPosts.map(post => ({
        ...post,
        likeCount: likeCounts.get(post.id) || 0
    }));

    // 2. Sum total likes for this account
    const totalLikes = enrichedPosts.reduce((sum, post) => sum + post.likeCount, 0);

    return { postsWithStats: enrichedPosts, totalPostLikes: totalLikes };
  }, [accountPosts, likeCounts]);

  const { totalCatalogViews, totalCatalogDownloads } = useMemo(() => {
      let views = 0;
      let downloads = 0;
      if (account.catalog) {
          account.catalog.forEach(item => {
              views += item.views || 0;
              downloads += item.downloads || 0;
          });
      }
      return { totalCatalogViews: views, totalCatalogDownloads: downloads };
  }, [account.catalog]);

  return (
    <div className="animate-fade-in-down p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Profile Analytics</h1>
        <p className="text-md text-gray-500 mt-1">Insights into your posts and performance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Profile Views" value={account.profileViews || 0} icon={<UserIcon className="w-10 h-10 text-red-600" />} />
          <StatCard title="Profile Likes" value={account.likeCount || 0} icon={<HeartIcon className="w-10 h-10 text-red-600" />} />
          <StatCard title="Catalog Views" value={totalCatalogViews} icon={<DocumentIcon className="w-10 h-10 text-red-600" />} />
          <StatCard title="Catalog Downloads" value={totalCatalogDownloads} icon={<DocumentIcon className="w-10 h-10 text-red-600" />} />
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