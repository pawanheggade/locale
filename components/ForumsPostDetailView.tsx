import React, { useState, useEffect } from 'react';
import { useForum } from '../contexts/ForumContext';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { DisplayableForumComment } from '../types';
import { timeSince, renderWithMentions } from '../utils/formatters';
import { VoteButtons } from './VoteButtons';
import { SpinnerIcon, ChatBubbleEllipsisIcon, FlagIcon, PaperAirplaneIcon, PencilIcon, TrashIcon } from './Icons';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { Comment as CommentComponent } from './Comment';
import { CommentForm } from './CommentForm';
import { CategoryBadge } from './Badges';
import { useConfirmationModal } from '../hooks/useConfirmationModal';
import { useNavigation } from '../App';
import { useFilters } from '../contexts/FiltersContext';

interface ForumPostDetailViewProps {
  postId: string;
  onBack: () => void;
}

export const ForumsPostDetailView: React.FC<ForumPostDetailViewProps> = ({ postId, onBack }) => {
    const { getPostWithComments, toggleVote, updatePost, deletePost, setActiveCategory } = useForum();
    const { addToast, openModal } = useUI();
    const showConfirmation = useConfirmationModal();
    const { currentAccount, accounts: allAccounts } = useAuth();
    const { navigateTo } = useNavigation();
    const { dispatchFilterAction } = useFilters();
    
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [isEditingPost, setIsEditingPost] = useState(false);
    const [editedPostContent, setEditedPostContent] = useState('');
    
    const post = getPostWithComments(postId);

    useEffect(() => {
        if (post) {
            setEditedPostContent(post.content);
            setIsEditingPost(false);
        }
    }, [postId, post]);

    const onViewAccount = (accountId: string) => {
        const account = allAccounts.find(a => a.id === accountId);
        if (account) navigateTo('account', { account });
    };

    const onReportItem = (item: any) => {
        if (!currentAccount) { openModal({ type: 'login' }); return; }
        openModal({ type: 'reportItem', data: { item } });
    };
    
    const onFilterByTag = (tag: string) => {
        dispatchFilterAction({ type: 'SET_FILTER_TAGS', payload: [tag] });
    };


    if (!post) {
        return <div className="text-center py-20"><SpinnerIcon className="w-8 h-8 mx-auto" /></div>;
    }

    const userVote = currentAccount ? (post.upvotes.includes(currentAccount.id) ? 'up' : post.downvotes.includes(currentAccount.id) ? 'down' : null) : null;
    const canEditPost = currentAccount && (currentAccount.id === post.authorId || currentAccount.role === 'admin');

    const handlePostSave = () => {
        if (editedPostContent.trim()) {
            updatePost(post.id, editedPostContent.trim());
            setIsEditingPost(false);
        }
    };
    
    const handlePostCancel = () => {
        setEditedPostContent(post.content);
        setIsEditingPost(false);
    };

    const handleDeletePost = () => {
        showConfirmation({
            title: 'Delete Discussion',
            message: 'Are you sure you want to delete this discussion? This will also remove all comments and cannot be undone.',
            onConfirm: () => {
                deletePost(post.id);
                onBack();
            },
            confirmText: 'Delete',
        });
    };

    const handleShare = async () => {
        const shareUrl = `${window.location.origin}?forumPost=${post.id}`;
        const shareData = {
            title: post.title,
            text: `Check out this discussion on Locale: "${post.title}"`,
            url: shareUrl,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err: any) {
                const isAbort =
                    err.name === 'AbortError' ||
                    err.code === 20 ||
                    (typeof err.message === 'string' &&
                        (err.message.toLowerCase().includes('abort') ||
                            err.message.toLowerCase().includes('cancel') ||
                            err.message.toLowerCase().includes('canceled')));

                if (!isAbort) {
                    console.error('Error sharing:', err);
                }
            }
        } else {
            navigator.clipboard.writeText(shareUrl);
            addToast('Link copied to clipboard', 'success');
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200/80 p-4 sm:p-6 lg:p-8 animate-fade-in-up">
            <div className="flex gap-4">
                <VoteButtons score={post.score} userVote={userVote} onVote={(vote) => toggleVote('post', post.id, vote)} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                        <CategoryBadge 
                            category={post.category} 
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveCategory(post.category);
                                onBack();
                            }}
                            className="text-[10px] h-auto min-h-0"
                        />
                        <span>&bull;</span>
                        <span>Posted by <button onClick={() => onViewAccount(post.authorId)} className="font-semibold text-gray-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-red-500 rounded-sm">{post.author?.name || 'Unknown'}</button></span>
                        <span>{timeSince(post.timestamp)}</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{post.title}</h1>
                    {isEditingPost ? (
                        <div className="mt-4">
                            <Textarea
                                value={editedPostContent}
                                onChange={(e) => setEditedPostContent(e.target.value)}
                                rows={6}
                                autoFocus
                                className="w-full"
                            />
                            <div className="flex justify-end gap-2 mt-2">
                                <Button variant="overlay-dark" onClick={handlePostCancel}>Cancel</Button>
                                <Button variant="pill-red" onClick={handlePostSave} disabled={!editedPostContent.trim()}>Save Changes</Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="mt-4 prose max-w-none text-gray-800 break-words">
                                <p>{renderWithMentions(post.content, allAccounts, onViewAccount, onFilterByTag)}</p>
                            </div>
                             <div className="mt-3 flex items-center gap-2">
                                <Button 
                                    onClick={handleShare} 
                                    variant="ghost"
                                    size="icon-sm"
                                    className="text-gray-500"
                                    title="Share"
                                >
                                    <PaperAirplaneIcon className="w-5 h-5" />
                                </Button>
                                {canEditPost && (
                                    <>
                                        <Button 
                                            onClick={() => setIsEditingPost(true)} 
                                            variant="ghost"
                                            size="icon-sm"
                                            className="text-gray-500"
                                            title="Edit"
                                        >
                                            <PencilIcon className="w-5 h-5" />
                                        </Button>
                                        <Button 
                                            onClick={handleDeletePost} 
                                            variant="ghost"
                                            size="icon-sm"
                                            className="text-red-600"
                                            title="Delete"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </Button>
                                    </>
                                )}
                                {!canEditPost && (
                                    <Button 
                                        onClick={() => onReportItem(post)} 
                                        variant="ghost"
                                        size="icon-sm"
                                        className="text-gray-400"
                                        title="Report"
                                    >
                                        <FlagIcon className="w-5 h-5" />
                                    </Button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="mt-8 pt-6 border-t">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <ChatBubbleEllipsisIcon className="w-6 h-6" />
                    {post.commentCount} Comments
                </h2>

                <div className="mb-6">
                    <CommentForm postId={post.id} parentId={null} onCommentAdded={() => {}} />
                </div>
                
                <div className="space-y-6">
                    {post.comments.map(comment => (
                        <CommentComponent
                            key={comment.id}
                            comment={comment}
                            onSetReplyTarget={setReplyingTo}
                            replyingToId={replyingTo}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};