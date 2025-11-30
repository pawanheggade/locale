


import React, { useState } from 'react';
import { DisplayableForumComment } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useForum } from '../contexts/ForumContext';
import { useUI } from '../contexts/UIContext';
import { VoteButtons } from './VoteButtons';
import { timeSince, renderWithMentions } from '../utils/formatters';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { FlagIcon, PencilIcon, TrashIcon, ChatBubbleEllipsisIcon } from './Icons';
import { CommentForm } from './CommentForm';
import { Avatar } from './Avatar';
import { useConfirmationModal } from '../hooks/useConfirmationModal';
import { useNavigation } from '../App';
import { useFilters } from '../contexts/FiltersContext';

interface CommentProps {
  comment: DisplayableForumComment;
  onSetReplyTarget: (commentId: string | null) => void;
  replyingToId: string | null;
}

export const Comment: React.FC<CommentProps> = ({ comment, onSetReplyTarget, replyingToId }) => {
  const { currentAccount, addForumReport } = useAuth();
  const { accounts: allAccounts } = useAuth();
  const { toggleVote, updateComment, deleteComment } = useForum();
  const { openModal } = useUI();
  const showConfirmation = useConfirmationModal();
  const { navigateTo } = useNavigation();
  const { dispatchFilterAction } = useFilters();
  
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

  const onViewAccount = (accountId: string) => {
    const account = allAccounts.find(a => a.id === accountId);
    if(account) navigateTo('account', { account });
  };

  const onFilterByTag = (tag: string) => {
    dispatchFilterAction({ type: 'SET_FILTER_TAGS', payload: [tag] });
  };
  
  const onReportItem = (item: any) => {
      if (!currentAccount) { openModal({ type: 'login' }); return; }
      openModal({ type: 'reportItem', data: { item } });
  }

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center mt-1">
        <Avatar src={comment.author?.avatarUrl} alt={comment.author?.name} size="sm" tier={comment.author?.subscription.tier} />
        <div className="w-px bg-gray-200 flex-grow my-2"></div>
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2 text-sm">
          <button onClick={() => onViewAccount(comment.authorId)} className="font-semibold text-gray-800 focus:outline-none focus-visible:ring-1 focus-visible:ring-red-500 rounded-sm">{comment.author?.name || 'Unknown User'}</button>
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
            <>
                <p>{renderWithMentions(comment.content, allAccounts, onViewAccount, onFilterByTag)}</p>
                <div className="not-prose flex items-center gap-2 mt-2">
                    <VoteButtons score={comment.score} userVote={userVote} onVote={(vote) => toggleVote('comment', comment.id, vote)} orientation="horizontal" />
                    <Button variant="ghost" size="sm" onClick={() => onSetReplyTarget(isReplying ? null : comment.id)} className="gap-1 text-gray-500">
                        <ChatBubbleEllipsisIcon className="w-4 h-4" /> Reply
                    </Button>
                    {canEditOrDelete && (
                         <>
                            <Button variant="ghost" size="icon-sm" onClick={() => setIsEditing(true)} className="text-gray-400" title="Edit"><PencilIcon className="w-4 h-4"/></Button>
                            <Button variant="ghost" size="icon-sm" onClick={handleDelete} className="text-gray-400" title="Delete"><TrashIcon className="w-4 h-4"/></Button>
                         </>
                    )}
                    {!canEditOrDelete && (
                        <Button variant="ghost" size="icon-sm" onClick={() => onReportItem(comment)} className="text-gray-400" title="Report"><FlagIcon className="w-4 h-4"/></Button>
                    )}
                </div>
            </>
          )}
        </div>
        {isReplying && (
          <div className="mt-4 animate-fade-in-up">
            <CommentForm
              postId={comment.postId}
              parentId={comment.id}
              onCommentAdded={() => onSetReplyTarget(null)}
              placeholder={`Replying to ${comment.author?.name || 'user'}...`}
              autoFocus={true}
              onCancel={() => onSetReplyTarget(null)}
            />
          </div>
        )}
        <div className="mt-6 space-y-6">
          {comment.replies.map(reply => (
            <Comment key={reply.id} comment={reply} onSetReplyTarget={onSetReplyTarget} replyingToId={replyingToId} />
          ))}
        </div>
      </div>
    </div>
  );
};