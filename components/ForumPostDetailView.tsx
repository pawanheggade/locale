
import React, { useState, useEffect } from 'react';
import { useForum } from '../contexts/ForumContext';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { DisplayableForumComment } from '../types';
import { usePostActions } from '../contexts/PostActionsContext';
import { timeSince, renderWithMentions } from '../utils/formatters';
import { VoteButtons } from './VoteButtons';
import { SpinnerIcon, ChatBubbleBottomCenterTextIcon, FlagIcon } from './Icons';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { Comment as CommentComponent } from './Comment';
import { CommentForm } from './CommentForm';

interface ForumPostDetailViewProps {
  postId: string;
  onBack: () => void;
}

export const ForumPostDetailView: React.FC<ForumPostDetailViewProps> = ({ postId, onBack }) => {
    const { getPostWithComments, toggleVote, updatePost, deletePost } = useForum();
    const { openModal } = useUI();
    const { currentAccount, accounts: allAccounts } = useAuth();
    const { onViewAccount, onReportItem } = usePostActions();
    
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
        openModal({
            type: 'confirmation',
            data: {
                title: 'Delete Discussion',
                message: 'Are you sure you want to delete this discussion? This will also remove all comments and cannot be undone.',
                onConfirm: () => {
                    deletePost(post.id);
                    onBack();
                },
                confirmText: 'Delete',
            }
        });
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8">
            <div className="flex gap-4">
                <VoteButtons score={post.score} userVote={userVote} onVote={(vote) => toggleVote('post', post.id, vote)} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full font-medium">{post.category}</span>
                        <span>&bull;</span>
                        <span>Posted by <button onClick={() => onViewAccount(post.authorId)} className="font-semibold text-gray-700">{post.author?.name || 'Unknown'}</button></span>
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
                                <Button variant="glass" onClick={handlePostCancel}>Cancel</Button>
                                <Button variant="glass-red" onClick={handlePostSave} disabled={!editedPostContent.trim()}>Save Changes</Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="mt-4 prose max-w-none text-gray-800 break-words">
                                <p>{renderWithMentions(post.content, allAccounts, onViewAccount)}</p>
                            </div>
                             <div className="mt-2 flex items-center gap-2">
                                {canEditPost && (
                                    <>
                                        <Button variant="glass" size="xs" onClick={() => setIsEditingPost(true)}>Edit</Button>
                                        <Button variant="glass-red-light" size="xs" onClick={handleDeletePost}>Delete</Button>
                                    </>
                                )}
                                {!canEditPost && (
                                    <Button variant="glass" size="xs" onClick={() => onReportItem(post)} className="gap-1">
                                        <FlagIcon className="w-3 h-3" /> Report
                                    </Button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="mt-8 pt-6 border-t">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <ChatBubbleBottomCenterTextIcon className="w-6 h-6" />
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
