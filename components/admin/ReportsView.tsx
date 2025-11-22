
import React, { useMemo } from 'react';
import { Report, DisplayablePost, ForumPost, ForumComment, DisplayableForumPost, DisplayableForumComment } from '../../types';
import { timeSince } from '../../utils/formatters';
import { useSort } from '../../hooks/useSort';
import { Button } from '../ui/Button';
import { DataTable } from './DataTable';

interface ReportWithData extends Report {
    type: 'Marketplace Post' | 'Forum Post' | 'Forum Comment';
    content: string; // Title or comment content
    onView: () => void;
}

interface ReportsViewProps {
    reports: Report[];
    allPosts: DisplayablePost[];
    forumPosts: ForumPost[];
    getPostWithComments: (postId: string) => DisplayableForumPost | null;
    onReportAction: (report: Report, action: 'dismiss' | 'delete') => void;
    onViewPost: (post: DisplayablePost) => void;
    onViewForumPost: (postId: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ reports, allPosts, forumPosts, getPostWithComments, onReportAction, onViewPost, onViewForumPost }) => {
    
    const reportsWithData = useMemo<ReportWithData[]>(() => {
        return reports.map(report => {
            if (report.postId) {
                const post = allPosts.find(p => p.id === report.postId);
                return {
                    ...report,
                    type: 'Marketplace Post',
                    content: post?.title || 'Deleted Post',
                    onView: () => post && onViewPost(post),
                };
            }
            if (report.forumPostId) {
                if (report.forumCommentId) {
                    const postWithComments = getPostWithComments(report.forumPostId);
                    const findComment = (comments: DisplayableForumComment[]): DisplayableForumComment | undefined => {
                        for (const c of comments) {
                            if (c.id === report.forumCommentId) return c;
                            const foundInReplies = findComment(c.replies);
                            if (foundInReplies) return foundInReplies;
                        }
                        return undefined;
                    };
                    const comment = postWithComments ? findComment(postWithComments.comments) : undefined;
                    return {
                        ...report,
                        type: 'Forum Comment',
                        content: comment?.content || 'Deleted Comment',
                        onView: () => onViewForumPost(report.forumPostId),
                    };
                } else {
                    const forumPost = forumPosts.find(p => p.id === report.forumPostId);
                    return {
                        ...report,
                        type: 'Forum Post',
                        content: forumPost?.title || 'Deleted Forum Post',
                        onView: () => onViewForumPost(report.forumPostId),
                    };
                }
            }
            return {
                ...report,
                type: 'Marketplace Post', // fallback
                content: 'Unknown Content',
                onView: () => {},
            };
        });
    }, [reports, allPosts, forumPosts, getPostWithComments, onViewPost, onViewForumPost]);

    const { items: sortedReports, requestSort, sortConfig } = useSort(reportsWithData, { key: 'timestamp', direction: 'desc' });
    
    if (reports.length === 0) {
        return <p className="text-gray-500">No active reports.</p>;
    }

    const columns = [
        { header: 'Content', sortKey: 'content' as keyof ReportWithData },
        { header: 'Type', sortKey: 'type' as keyof ReportWithData },
        { header: 'Reason', sortKey: 'reason' as keyof ReportWithData },
        { header: 'Reported', sortKey: 'timestamp' as keyof ReportWithData },
        { header: 'Actions', className: 'relative px-6 py-3' },
    ];
    
    const renderRow = (report: ReportWithData) => (
        <tr key={report.id}>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 truncate max-w-xs">{report.content}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.type}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-sm">{report.reason}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{timeSince(report.timestamp)}</td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={report.onView}>View</Button>
                    <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => onReportAction(report, 'dismiss')}>Dismiss</Button>
                    <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => onReportAction(report, 'delete')}>Delete Content</Button>
                </div>
            </td>
        </tr>
    );

    return <DataTable columns={columns} data={sortedReports} renderRow={renderRow} sortConfig={sortConfig} requestSort={requestSort as any} />;
};
