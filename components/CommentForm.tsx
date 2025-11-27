
import React, { useState } from 'react';
import { useForum } from '../contexts/ForumContext';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';

interface CommentFormProps {
    postId: string;
    parentId: string | null;
    onCommentAdded: () => void;
    placeholder?: string;
    autoFocus?: boolean;
    onCancel?: () => void;
}

const COMMENT_MAX_LENGTH = 500;

export const CommentForm: React.FC<CommentFormProps> = ({ postId, parentId, onCommentAdded, placeholder = "Add a comment...", autoFocus = false, onCancel }) => {
    const { addComment } = useForum();
    const { currentAccount } = useAuth();
    const { openModal } = useUI();
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || content.length > COMMENT_MAX_LENGTH) return;

        if (!currentAccount) {
            openModal({ type: 'login' });
            return;
        }

        setIsSubmitting(true);
        addComment({ postId, parentId, content: content.trim() });
        setContent('');
        onCommentAdded();
        setIsSubmitting(false);
    };
    
    const isOverLimit = content.length > COMMENT_MAX_LENGTH;

    return (
        <form onSubmit={handleSubmit} className="flex flex-col items-end gap-2">
            <div className="w-full">
                <Textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder={placeholder}
                    rows={3}
                    required
                    autoFocus={autoFocus}
                    className="w-full"
                />
                <div className="flex justify-end mt-1">
                    <span className={`text-xs ${isOverLimit ? 'text-red-600' : 'text-gray-500'}`}>
                        {content.length} / {COMMENT_MAX_LENGTH}
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {onCancel && (
                    <Button variant="overlay-dark" onClick={onCancel} disabled={isSubmitting}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" isLoading={isSubmitting} disabled={!content.trim() || isOverLimit} variant="pill-red">
                    Post Comment
                </Button>
            </div>
        </form>
    );
};