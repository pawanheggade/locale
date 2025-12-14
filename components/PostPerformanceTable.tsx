
import React from 'react';
import { DisplayablePost } from '../types';
import { DataTable } from './admin/DataTable';
import { useSort } from '../../hooks/useSort';
import { formatCurrency, formatFullDate } from '../utils/formatters';

export interface PostWithStats extends DisplayablePost {
    likeCount: number;
}

interface PostPerformanceTableProps {
    postsWithStats: PostWithStats[];
}

export const PostPerformanceTable: React.FC<PostPerformanceTableProps> = ({ postsWithStats }) => {
    const { items: sortedPosts, requestSort, sortConfig } = useSort(postsWithStats, { key: 'likeCount', direction: 'desc' });

    const columns = [
        { header: 'Post', className: 'pl-6' },
        { header: 'Category', sortKey: 'category' as keyof PostWithStats },
        { header: 'Type', sortKey: 'type' as keyof PostWithStats },
        { header: 'Price', sortKey: 'price' as keyof PostWithStats },
        { header: 'Likes', sortKey: 'likeCount' as keyof PostWithStats },
        { header: 'Date', sortKey: 'lastUpdated' as keyof PostWithStats },
    ];

    const renderRow = (post: PostWithStats) => (
        <tr key={post.id} className="transition-colors">
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                        {post.media && post.media.length > 0 ? (
                            <img className="h-10 w-10 rounded-md object-cover bg-gray-100" src={post.media[0].url} alt="" />
                        ) : (
                            <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-medium">No Img</div>
                        )}
                    </div>
                    <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-[180px] sm:max-w-[240px]" title={post.title}>{post.title}</div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{post.category}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">{post.type.toLowerCase()}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">{formatCurrency(post.price)}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{post.likeCount}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatFullDate(post.lastUpdated)}</td>
        </tr>
    );

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                <h3 className="text-lg font-bold text-gray-800">Post Performance</h3>
            </div>
            <DataTable<PostWithStats> 
                columns={columns} 
                data={sortedPosts} 
                renderRow={renderRow} 
                sortConfig={sortConfig} 
                requestSort={requestSort} 
            />
        </div>
    );
};