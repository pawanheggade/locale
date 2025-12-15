
import React, { useState, useEffect, useMemo } from 'react';
import { useForum } from '../contexts/ForumContext';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { timeSince, renderWithMentions } from '../utils/formatters';
import { VoteButtons } from './VoteButtons';
import { SpinnerIcon, ChatBubbleEllipsisIcon, FlagIcon, PaperAirplaneIcon, PencilIcon, TrashIcon } from './Icons';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { Comment as CommentComponent } from './Comment';
import { CommentForm } from './CommentForm';
import { CategoryBadge } from './Badges';
import { useConfirmationModal } from '../hooks/useConfirmationModal';
import { useNavigation } from '../contexts/NavigationContext';
import { useFilters } from '../contexts/FiltersContext';
import { isShareAbortError } from '../lib/utils';
import { SEO } from './SEO';
import { Select } from './ui/Select';

interface ForumPostDetailViewProps {}

export const ForumsPostDetailView: React.FC<ForumPostDetailViewProps> = () => {
    const { getPostWithComments, toggleVote, updatePost, deletePost, setActiveCategory } = useForum();
    const { addToast } = useUI();
    const showConfirmation = useConfirmationModal();
    const { currentAccount, accounts: allAccounts, reportItem } = useAuth();
    const { navigateTo, handleBack, navigateToAccount, viewingForumPostId: postId } = useNavigation();
    const { dispatchFilterAction } = useFilters();
    
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [isEditingPost, setIsEditingPost] = useState(false);
    const [editedPostContent, setEditedPostContent] = useState('');
    const [commentSort, setCommentSort] = useState<'top' | 'newest' | 'oldest'>('top');
    
    const post = getPostWithComments(postId!);

    useEffect(() => {
        if (post) {
            setEditedPostContent(post.content);
            setIsEditingPost(false);
        }
    }, [postId, post]);
    
    const onFilterByTag = (tag: string) => {
        dispatchFilterAction({ type: 'SET_FILTER_TAGS', payload: [tag] });
        navigateTo('all');
    };

    const sortedComments = useMemo(() => {
        if (!post) return [];
        const comments = [...post.comments]; 
        
        return comments.sort((a, b) => {
             switch (commentSort) {
                case 'newest': return b.timestamp - a.timestamp;
                case 'oldest': return a.timestamp - b.timestamp;
                case 'top': return b.score - a.score;
                default: return 0;
            }
        });
    }, [post, commentSort]);

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
                handleBack();
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
                if (!isShareAbortError(err)) {
                    console.error('Error sharing:', err);
                }
            }
        } else {
            navigator.clipboard.writeText(shareUrl);
            addToast('Link copied to clipboard', 'success');
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200/80 p-4 sm:p-6 lg:p-8 animate-fade-in-down">
            <SEO title={post.title} description={post.content.slice(0, 160)} type="article" />
            <div className="flex gap-4">
                <VoteButtons score={post.score} userVote={userVote} onVote={(vote) => toggleVote('post', post.id, vote)} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-gray-600 flex-wrap">
                        <CategoryBadge 
                            category={post.category} 
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveCategory(post.category);
                                navigateTo('forums');
                            }}
                            className="text-[10px] h-auto min-h-0"
                        />
                        <span>&bull;</span>
                        <span>Posted by <button onClick={() => navigateToAccount(post.authorId)} className="font-semibold text-gray-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#123456] rounded-sm">@{post.author?.username || 'unknown'}</button></span>
                         <span className="hidden sm:inline">&bull;</span>
                        <span className="hidden sm:inline">{timeSince(post.timestamp)}</span>
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
                                <p>{renderWithMentions(post.content, allAccounts, navigateToAccount, onFilterByTag)}</p>
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
                                            variant="overlay-red"
                                            size="icon-sm"
                                            title="Delete"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </Button>
                                    </>
                                )}
                                {!canEditPost && (
                                    <Button 
                                        onClick={() => reportItem(post)} 
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

            <div className="mt-8 pt-8 border-t border-gray-200/80">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <ChatBubbleEllipsisIcon className="w-6 h-6" />
                        {post.commentCount} Comments
                    </h2>
                    <Select
                        value={commentSort}
                        onChange={(e) => setCommentSort(e.target.value as any)}
                        className="w-auto text-sm"
                        variant="overlay"
                    >
                        <option value="top">Top</option>
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                    </Select>
                </div>

                <div className="mb-6">
                    <CommentForm postId={post.id} parentId={null} onCommentAdded={() => {}} />
                </div>
                
                <div className="space-y-6">
                    {sortedComments.map(comment => (
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
