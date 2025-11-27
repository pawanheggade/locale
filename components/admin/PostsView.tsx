
import React, { useMemo } from 'react';
import { DisplayablePost } from '../../types';
import { timeSince, formatCurrency } from '../../utils/formatters';
import { getPostStatus } from '../../utils/posts';
import { useSort } from '../../hooks/useSort';
import { DataTable } from './DataTable';
import { Button } from '../ui/Button';

interface PostsViewProps {
    allPosts: DisplayablePost[];
    onEditPost: (postId: string) => void;
    onDeletePost: (postId: string) => void;
    onViewPost: (post: DisplayablePost) => void;
}

export const PostsView: React.FC<PostsViewProps> = ({ allPosts, onEditPost, onDeletePost, onViewPost }) => {
    const customSorters = useMemo(() => ({
        author: (a: DisplayablePost, b: DisplayablePost) => (a.author?.name || '').localeCompare(b.author?.name || '')
    }), []);
    const { items: sortedPosts, requestSort, sortConfig } = useSort(allPosts, { key: 'lastUpdated', direction: 'desc' }, customSorters);
    
    const columns = [
        { header: 'Title', sortKey: 'title' as keyof DisplayablePost },
        { header: 'Author', sortKey: 'author' as keyof DisplayablePost },
        { header: 'Category', sortKey: 'category' as keyof DisplayablePost },
        { header: 'Price', sortKey: 'price' as keyof DisplayablePost },
        { header: 'Status' },
        { header: 'Last Updated', sortKey: 'lastUpdated' as keyof DisplayablePost },
        { header: 'Actions', className: 'relative px-6 py-3' },
    ];
    
    const renderRow = (post: DisplayablePost) => {
        const { isExpired } = getPostStatus(post.expiryDate);
        return (
            <tr key={post.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{post.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{post.author?.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{post.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatCurrency(post.price)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isExpired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {isExpired ? 'Expired' : 'Active'}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{timeSince(post.lastUpdated)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                        <Button variant="overlay-dark" size="xs" onClick={() => onViewPost(post)}>View</Button>
                        <Button variant="overlay-dark" size="xs" onClick={() => onEditPost(post.id)}>Edit</Button>
                        <Button variant="overlay-red" size="xs" onClick={() => onDeletePost(post.id)} className="text-red-600">Delete</Button>
                    </div>
                </td>
            </tr>
        );
    };

    return <DataTable columns={columns} data={sortedPosts} renderRow={renderRow} sortConfig={sortConfig} requestSort={requestSort as any} />;
};
