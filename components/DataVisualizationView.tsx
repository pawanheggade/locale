import React, { useEffect, useRef, useMemo } from 'react';
import { Account, DisplayablePost, PostCategory, PostType } from '../types';
import { UserIcon, ArchiveBoxIcon, HeartIcon } from './Icons';
import { StatCard } from './StatCard';

// Let TypeScript know that Chart.js is available globally
declare var Chart: any;

interface DataVisualizationViewProps {
  allPosts: DisplayablePost[];
  categories: PostCategory[];
  accounts?: Account[];
  account?: Account;
}

// Custom hook to manage Chart.js instance lifecycle
const useChart = (
    canvasRef: React.RefObject<HTMLCanvasElement>, 
    chartConfig: { type: string; data: any; options: any }
) => {
    useEffect(() => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        const chartInstance = new Chart(ctx, chartConfig);

        return () => {
            chartInstance.destroy();
        };
    }, [canvasRef, chartConfig]); // Re-create chart if config changes
};

export const DataVisualizationView: React.FC<DataVisualizationViewProps> = ({ allPosts, categories, accounts = [], account }) => {
  const categoryChartRef = useRef<HTMLCanvasElement>(null);
  const typeChartRef = useRef<HTMLCanvasElement>(null);
  const activityChartRef = useRef<HTMLCanvasElement>(null);
  const postLikesChartRef = useRef<HTMLCanvasElement>(null);

  const commonOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
  }), []);

  // --- Data preparation with useMemo ---
  const totals = useMemo(() => {
    const totalAccounts = accounts.length;
    const totalPosts = allPosts.length;
    const totalProfileViews = accounts.reduce((sum, acc) => sum + (acc.profileViews || 0), 0);
    const totalLikes = accounts.reduce((sum, acc) => sum + (acc.likeCount || 0), 0);
    const totalPostLikes = accounts.reduce((sum, acc) => sum + (acc.likedPostIds?.length || 0), 0);
    return { totalAccounts, totalPosts, totalProfileViews, totalLikes, totalPostLikes };
  }, [accounts, allPosts]);

  const categoryChartConfig = useMemo(() => {
    const categoryCounts = categories.map(category => 
      allPosts.filter(post => post.category === category).length
    );
    return {
      type: 'bar',
      data: {
        labels: categories,
        datasets: [{
          label: '# of Posts',
          data: categoryCounts,
          backgroundColor: 'rgba(239, 68, 68, 0.6)',
          borderColor: 'rgba(220, 38, 38, 1)',
          borderWidth: 1
        }]
      },
      options: {
        ...commonOptions,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Posts per Category', font: { size: 16 } }
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    };
  }, [allPosts, categories, commonOptions]);

  const typeChartConfig = useMemo(() => {
    const typeCounts = {
      [PostType.PRODUCT]: allPosts.filter(p => p.type === PostType.PRODUCT).length,
      [PostType.SERVICE]: allPosts.filter(p => p.type === PostType.SERVICE).length,
      [PostType.EVENT]: allPosts.filter(p => p.type === PostType.EVENT).length,
    };
    return {
      type: 'doughnut',
      data: {
        labels: ['Products', 'Services', 'Events'],
        datasets: [{
          data: [typeCounts.PRODUCT, typeCounts.SERVICE, typeCounts.EVENT],
          backgroundColor: [
            'rgba(239, 68, 68, 0.7)',
            'rgba(245, 158, 11, 0.7)',
            'rgba(107, 114, 128, 0.7)',
          ],
          borderColor: [
            'rgba(220, 38, 38, 1)',
            'rgba(217, 119, 6, 1)',
            'rgba(75, 85, 99, 1)',
          ],
          borderWidth: 1
        }]
      },
      options: {
        ...commonOptions,
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: 'Post Type Distribution', font: { size: 16 } }
        }
      }
    };
  }, [allPosts, commonOptions]);

  const activityChartConfig = useMemo(() => {
    const last30DaysLabels: string[] = [];
    const activityData = new Array(30).fill(0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 29; i >= 0; i--) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        last30DaysLabels.push(date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
    }
    
    allPosts.forEach(post => {
      const postDate = new Date(parseInt(post.id, 10));
      postDate.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - postDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 0 && diffDays < 30) {
        activityData[29 - diffDays]++;
      }
    });

    return {
      type: 'line',
      data: {
        labels: last30DaysLabels,
        datasets: [{
          label: 'Posts Created',
          data: activityData,
          fill: true,
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          borderColor: 'rgba(220, 38, 38, 1)',
          tension: 0.1
        }]
      },
      options: {
        ...commonOptions,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Post Activity (Last 30 Days)', font: { size: 16 } }
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    };
  }, [allPosts, commonOptions]);

  const postLikesData = useMemo(() => {
    const postLikes: { [key: string]: number } = {};
    const accountPostIds = new Set(allPosts.map(p => p.id));

    // Tally likes from all users in the system
    if (accounts) {
      for (const acc of accounts) {
        if (acc.likedPostIds) {
          for (const likedPostId of acc.likedPostIds) {
            if (accountPostIds.has(likedPostId)) {
              postLikes[likedPostId] = (postLikes[likedPostId] || 0) + 1;
            }
          }
        }
      }
    }

    const sortedPosts = allPosts
      .map(post => ({ ...post, likes: postLikes[post.id] || 0 }))
      .filter(post => post.likes > 0)
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 10); // Top 10

    return {
      labels: sortedPosts.map(p => p.title),
      data: sortedPosts.map(p => p.likes),
      hasData: sortedPosts.length > 0,
    };
  }, [allPosts, accounts]);

  const postLikesChartConfig = useMemo(() => {
    return {
      type: 'bar',
      data: {
        labels: postLikesData.labels,
        datasets: [{
          label: '# of Likes',
          data: postLikesData.data,
          backgroundColor: 'rgba(239, 68, 68, 0.6)',
          borderColor: 'rgba(220, 38, 38, 1)',
          borderWidth: 1
        }]
      },
      options: {
        ...commonOptions,
        indexAxis: 'y', // Horizontal bar chart
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Most Liked Posts', font: { size: 16 } }
        },
        scales: {
          x: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    };
  }, [postLikesData, commonOptions]);

  // --- Initialize charts using the custom hook ---
  useChart(categoryChartRef, categoryChartConfig);
  useChart(typeChartRef, typeChartConfig);
  useChart(activityChartRef, activityChartConfig);
  useChart(postLikesChartRef, postLikesChartConfig);

  return (
    <div className="p-4 bg-gray-50 rounded-xl">
      {!account && accounts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-6 mb-6">
            <StatCard title="Accounts" value={totals.totalAccounts} icon={<UserIcon className="w-10 h-10 text-red-600" />} />
            <StatCard title="Posts" value={totals.totalPosts} icon={<ArchiveBoxIcon className="w-10 h-10 text-red-600" />} />
            <StatCard title="Post Likes" value={totals.totalPostLikes} icon={<HeartIcon className="w-10 h-10 text-red-600" />} />
            <StatCard title="Profile Likes" value={totals.totalLikes} icon={<HeartIcon className="w-10 h-10 text-red-600" />} />
            <StatCard title="Profile Views" value={totals.totalProfileViews} icon={<UserIcon className="w-10 h-10 text-red-600" />} />
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {!account && (
          <>
            <div className="bg-white p-6 rounded-xl col-span-1 lg:col-span-2">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Post Activity</h2>
              <div className="relative h-80">
                <canvas ref={activityChartRef}></canvas>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Post Types</h2>
              <div className="relative h-80">
                <canvas ref={typeChartRef}></canvas>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Top Categories</h2>
              <div className="relative h-80">
                <canvas ref={categoryChartRef}></canvas>
              </div>
            </div>
          </>
        )}
        <div className="bg-white p-6 rounded-xl col-span-1 lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Post Performance</h2>
            {postLikesData.hasData ? (
                <div className="relative h-96">
                    <canvas ref={postLikesChartRef}></canvas>
                </div>
            ) : (
                <div className="relative h-96 flex items-center justify-center text-gray-600">
                    <p>No posts have received likes yet.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};