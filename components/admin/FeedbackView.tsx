
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Feedback, Account } from '../../types';
import { timeSince, formatFullDateTime } from '../../utils/formatters';
import { useSort } from '../../hooks/useSort';
import { Button, TabButton } from '../ui/Button';
import { DataTable } from './DataTable';
import { TrashIcon, ArchiveBoxIcon, ArrowUturnLeftIcon, CheckIcon, ChatBubbleBottomCenterTextIcon } from '../Icons';
import ModalShell from '../ModalShell';
import { cn } from '../../lib/utils';
import { EmptyState } from '../EmptyState';

interface FeedbackViewProps {
    feedbackList: Feedback[];
    accounts: Account[];
    onDeleteFeedback: (id: string) => void;
    onToggleFeedbackArchive: (id: string) => void;
    onMarkFeedbackAsRead: (id: string) => void;
    onBulkAction: (ids: string[], action: 'markRead' | 'archive' | 'unarchive' | 'delete') => void;
}

interface FeedbackWithUser extends Feedback {
    userName: string;
    userEmail: string;
}

export const FeedbackView: React.FC<FeedbackViewProps> = ({ feedbackList, accounts, onDeleteFeedback, onToggleFeedbackArchive, onMarkFeedbackAsRead, onBulkAction }) => {
    const [activeTab, setActiveTab] = useState<'inbox' | 'archived'>('inbox');
    const [selectedFeedback, setSelectedFeedback] = useState<FeedbackWithUser | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const modalRef = useRef<HTMLDivElement>(null);
    
    const accountsById = useMemo(() => new Map(accounts.map(a => [a.id, a])), [accounts]);

    useEffect(() => {
        // Clear selection when tab changes
        setSelectedIds(new Set());
    }, [activeTab]);

    const feedbackWithUser = useMemo<FeedbackWithUser[]>(() => {
        return feedbackList.map(f => {
            const user = accountsById.get(f.userId);
            return {
                ...f,
                userName: user?.name || 'Unknown User',
                userEmail: user?.email || 'N/A',
            };
        });
    }, [feedbackList, accountsById]);

    const filteredFeedback = useMemo(() => {
        return feedbackWithUser.filter(f => activeTab === 'archived' ? f.isArchived : !f.isArchived);
    }, [feedbackWithUser, activeTab]);

    const customSorters = useMemo(() => ({
        userName: (a: FeedbackWithUser, b: FeedbackWithUser) => a.userName.localeCompare(b.userName),
        userEmail: (a: FeedbackWithUser, b: FeedbackWithUser) => a.userEmail.localeCompare(b.userEmail),
        content: (a: FeedbackWithUser, b: FeedbackWithUser) => a.content.localeCompare(b.content),
    }), []);

    const { items: sortedFeedback, requestSort, sortConfig } = useSort(filteredFeedback, { key: 'timestamp', direction: 'desc' }, customSorters);

    const handleFeedbackClick = (item: FeedbackWithUser) => {
        setSelectedFeedback(item);
        if (!item.isRead) {
            onMarkFeedbackAsRead(item.id);
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(sortedFeedback.map(f => f.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectRow = (id: string, checked: boolean) => {
        const newSelected = new Set(selectedIds);
        if (checked) {
            newSelected.add(id);
        } else {
            newSelected.delete(id);
        }
        setSelectedIds(newSelected);
    };

    const handleBulk = (action: 'markRead' | 'archive' | 'unarchive' | 'delete') => {
        onBulkAction(Array.from(selectedIds), action);
        setSelectedIds(new Set());
    };

    const isAllSelected = sortedFeedback.length > 0 && selectedIds.size === sortedFeedback.length;

    const columns = [
        {
            header: (
                <input 
                    type="checkbox" 
                    checked={isAllSelected} 
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    aria-label="Select all rows"
                />
            ),
            className: 'w-10 px-6 py-3'
        },
        { header: 'User', sortKey: 'userName' as keyof FeedbackWithUser },
        { header: 'Email', sortKey: 'userEmail' as keyof FeedbackWithUser },
        { header: 'Feedback', sortKey: 'content' as keyof FeedbackWithUser },
        { header: 'Date', sortKey: 'timestamp' as keyof FeedbackWithUser },
        { header: 'Actions', className: 'relative px-6 py-3 text-right' },
    ];

    const renderRow = (item: FeedbackWithUser) => (
        <tr key={item.id} className={cn(item.isRead ? 'bg-white' : 'bg-red-50/30')}>
             <td className="px-6 py-4 whitespace-nowrap">
                <input 
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={(e) => handleSelectRow(item.id, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    aria-label={`Select feedback from ${item.userName}`}
                />
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.userName}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.userEmail}</td>
            <td className="px-6 py-4 whitespace-nowrap">
                <Button
                    variant="ghost"
                    className={cn(
                        "text-sm max-w-md truncate !p-0 !h-auto !justify-start !text-left",
                        item.isRead ? "text-gray-600 !font-normal" : "font-bold text-gray-900"
                    )}
                    title="Click to view full feedback"
                    onClick={() => handleFeedbackClick(item)}
                >
                    {item.content}
                </Button>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{timeSince(item.timestamp)}</td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {activeTab === 'inbox' ? (
                    <Button variant="overlay-dark" size="icon-sm" onClick={() => onToggleFeedbackArchive(item.id)} className="text-amber-600" title="Archive">
                        <ArchiveBoxIcon className="w-4 h-4" />
                    </Button>
                ) : (
                    <div className="flex justify-end gap-2">
                        <Button variant="overlay-dark" size="icon-sm" onClick={() => onToggleFeedbackArchive(item.id)} className="text-gray-600" title="Unarchive">
                            <ArrowUturnLeftIcon className="w-4 h-4" />
                        </Button>
                        <Button variant="overlay-red" size="icon-sm" onClick={() => onDeleteFeedback(item.id)} className="text-red-600" title="Delete">
                            <TrashIcon className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </td>
        </tr>
    );

    return (
        <div>
            <div className="mb-4 border-b border-gray-200">
                <nav className="flex space-x-6 px-2 overflow-x-auto hide-scrollbar" role="tablist">
                    <TabButton onClick={() => setActiveTab('inbox')} isActive={activeTab === 'inbox'}>Inbox</TabButton>
                    <TabButton onClick={() => setActiveTab('archived')} isActive={activeTab === 'archived'}>Archived</TabButton>
                </nav>
            </div>

            {selectedIds.size > 0 && (
                <div className="bg-red-50 p-2 mb-4 rounded-md flex items-center justify-between animate-fade-in">
                    <span className="text-sm font-medium text-red-800 ml-2">{selectedIds.size} selected</span>
                    <div className="flex gap-2">
                        {activeTab === 'inbox' && (
                             <>
                                <Button size="xs" variant="overlay-dark" onClick={() => handleBulk('markRead')} className="gap-1 text-red-600">
                                    <CheckIcon className="w-3 h-3" /> Mark Read
                                </Button>
                                <Button size="xs" variant="overlay-dark" onClick={() => handleBulk('archive')} className="gap-1 text-amber-700">
                                    <ArchiveBoxIcon className="w-3 h-3" /> Archive
                                </Button>
                             </>
                        )}
                        {activeTab === 'archived' && (
                             <>
                                <Button size="xs" variant="overlay-dark" onClick={() => handleBulk('unarchive')} className="gap-1">
                                    <ArrowUturnLeftIcon className="w-3 h-3" /> Unarchive
                                </Button>
                                <Button size="xs" variant="overlay-red" onClick={() => handleBulk('delete')} className="gap-1 text-red-600">
                                    <TrashIcon className="w-3 h-3" /> Delete
                                </Button>
                             </>
                        )}
                    </div>
                </div>
            )}

            {filteredFeedback.length === 0 ? (
                <EmptyState
                    icon={<ChatBubbleBottomCenterTextIcon />}
                    title=""
                    description={`No ${activeTab} feedback.`}
                    className="py-12"
                />
            ) : (
                <DataTable<FeedbackWithUser> columns={columns} data={sortedFeedback} renderRow={renderRow} sortConfig={sortConfig} requestSort={requestSort} />
            )}
            
            {selectedFeedback && (
                <ModalShell
                    panelRef={modalRef}
                    onClose={() => setSelectedFeedback(null)}
                    title="Feedback Details"
                    titleId="feedback-details-title"
                    panelClassName="w-full max-w-lg"
                    footer={<Button variant="ghost" onClick={() => setSelectedFeedback(null)}>Close</Button>}
                >
                    <div className="p-6 space-y-4">
                        <div>
                            <h4 className="text-sm font-semibold text-gray-600">User</h4>
                            <p className="text-gray-900">{selectedFeedback.userName} <span className="text-gray-500 text-xs">({selectedFeedback.userEmail})</span></p>
                        </div>
                        <div>
                             <h4 className="text-sm font-semibold text-gray-600">Date</h4>
                             <p className="text-gray-900">{formatFullDateTime(selectedFeedback.timestamp)}</p>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-gray-600">Content</h4>
                            <p className="text-gray-900 whitespace-pre-wrap">{selectedFeedback.content}</p>
                        </div>
                    </div>
                </ModalShell>
             )}
        </div>
    );
};