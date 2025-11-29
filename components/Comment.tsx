
import React, { useState } from 'react';
import { DisplayableForumComment } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useForum } from '../contexts/ForumContext';
import { useUI } from '../contexts/UIContext';
import { VoteButtons } from './VoteButtons';
import { timeSince, renderWithMentions } from '../utils/formatters';
import { usePostActions } from '../contexts/PostActionsContext';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { FlagIcon, PencilIcon, TrashIcon, ChatBubbleEllipsisIcon } from './Icons';
import { CommentForm } from './CommentForm';
import { Avatar } from './Avatar';
import { useConfirmationModal } from '../hooks/useConfirmationModal';

interface CommentProps {
  comment: DisplayableForumComment;
  onSetReplyTarget: (commentId: string | null) => void;
  replyingToId: string | null;
}

export const Comment: React.FC<CommentProps> = ({ comment, onSetReplyTarget, replyingToId }) => {
  const { currentAccount } = useAuth();
  const { accounts: allAccounts } = useAuth();
  const { toggleVote, updateComment, deleteComment } = useForum();
  const { openModal } = useUI();
  const showConfirmation = useConfirmationModal();
  const { onViewAccount, onReportItem, onFilterByTag } = usePostActions();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  
  const userVote = currentAccount ? (comment.upvotes.includes(currentAccount.id) ? 'up' : comment.downvotes.includes(currentAccount.id) ? 'down' : null) : null;
  const canEditOrDelete = currentAccount && (currentAccount.id === comment.authorId || currentAccount.role === 'admin');
  const isReplying = replyingToId === comment.id;

  const handleSave = () => {
      if (editedContent.trim()) {
          updateComment(comment.id, editedContent.trim());
          setIsEditing(false);
      }
  };
  
  const handleCancel = () => {
      setEditedContent(comment.content);
      setIsEditing(false);
  };

  const handleDelete = () => {
    showConfirmation({
      title: 'Delete Comment',
      message: 'Are you sure you want to delete this comment? This will also remove all replies and cannot be undone.',
      onConfirm: () => deleteComment(comment.id),
      confirmText: 'Delete',
    });
  };

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center mt-1">
        <Avatar src={comment.author?.avatarUrl} alt={comment.author?.name} size="sm" tier={comment.author?.subscription.tier} />
        <div className="w-px bg-gray-200 flex-grow my-2"></div>
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2 text-sm">
          <button onClick={() => onViewAccount(comment.authorId)} className="font-semibold text-gray-800 hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-red-500 rounded-sm">{comment.author?.name || 'Unknown User'}</button>
          <span className="text-gray-500 text-xs">{timeSince(comment.timestamp)}</span>
        </div>
        <div className="mt-1 prose prose-sm max-w-none text-gray-600">
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={3}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button variant="overlay-dark" size="sm" onClick={handleCancel}>Cancel</Button>
                <Button variant="pill-red" size="sm" onClick={handleSave} disabled={!editedContent.trim()}>Save</Button>
              </div>
            </div>
          ) : (
            <p>{renderWithMentions(comment.content, allAccounts, onViewAccount, onFilterByTag)}</p>
          )}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <VoteButtons score={comment.score} userVote={userVote} onVote={(vote) => toggleVote('comment', comment.id, vote)} orientation="horizontal" />
          <Button 
            onClick={() => onSetReplyTarget(isReplying ? null : comment.id)} 
            variant="ghost"
            size="icon-sm"
            className={`h-8 w-8 ${isReplying ? "text-red-600" : "text-gray-500"}`}
            title="Reply"
          >
            <ChatBubbleEllipsisIcon className="w-4 h-4" />
          </Button>
          {canEditOrDelete && !isEditing && (
            <>
              <Button 
                onClick={() => setIsEditing(true)} 
                variant="ghost"
                size="icon-sm"
                className="text-gray-500 h-8 w-8"
                title="Edit"
              >
                <PencilIcon className="w-4 h-4" />
              </Button>
              <Button 
                onClick={handleDelete} 
                variant="ghost"
                size="icon-sm"
                className="text-red-600 h-8 w-8"
                title="Delete"
              >
                <TrashIcon className="w-4 h-4" />
              </Button>
            </>
          )}
          {!canEditOrDelete && (
            <Button 
                onClick={() => onReportItem(comment)} 
                variant="ghost"
                size="icon-sm"
                className="text-gray-400 h-8 w-8"
                title="Report"
            >
                <FlagIcon className="w-4 h-4" />
            </Button>
          )}
        </div>

        {isReplying && (
            <div className="mt-4">
                <CommentForm
                    postId={comment.postId}
                    parentId={comment.id}
                    onCommentAdded={() => onSetReplyTarget(null)}
                    onCancel={() => onSetReplyTarget(null)}
                    placeholder={`Replying to ${comment.author?.name}...`}
                    autoFocus
                />
            </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {comment.replies.map(reply => <Comment key={reply.id} comment={reply} onSetReplyTarget={onSetReplyTarget} replyingToId={replyingToId} />)}
          </div>
        )}
      </div>
    </div>
  );
};
