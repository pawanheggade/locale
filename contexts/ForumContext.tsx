
import React, { createContext, useContext, useMemo, useCallback, useState } from 'react';
import { ForumPost, ForumComment, DisplayableForumPost, DisplayableForumComment } from '../types';
import { usePersistentState } from '../hooks/usePersistentState';
import { useLargePersistentState } from '../hooks/useLargePersistentState';
import { useAuth } from './AuthContext';
import { mockForumPosts, mockForumComments, mockForumCategories } from '../data/forum';
import { useUI } from './UIContext';
import { useCategoryManager } from '../hooks/useCategoryManager';
import { STORAGE_KEYS } from '../lib/constants';

interface ForumContextType {
  posts: DisplayableForumPost[];
  comments: ForumComment[];
  categories: string[];
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  getPostWithComments: (postId: string) => DisplayableForumPost | null;
  findForumPostById: (postId: string) => ForumPost | undefined;
  getPostComments: (postId: string) => DisplayableForumComment[];
  addPost: (postData: Omit<ForumPost, 'id' | 'authorId' | 'timestamp' | 'upvotes' | 'downvotes' | 'isPinned'>) => void;
  addComment: (commentData: Omit<ForumComment, 'id' | 'authorId' | 'timestamp' | 'upvotes' | 'downvotes'>) => void;
  toggleVote: (type: 'post' | 'comment', id: string, vote: 'up' | 'down') => void;
  updatePost: (postId: string, newContent: string) => void;
  updateComment: (commentId: string, newContent: string) => void;
  deletePost: (postId: string) => void;
  deleteComment: (commentId: string) => void;
  addCategory: (name: string) => void;
  updateCategory: (oldName: string, newName: string) => void;
  deleteCategory: (name: string) => void;
}

const ForumContext = createContext<ForumContextType | undefined>(undefined);

export const ForumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentAccount, accountsById, addNotification } = useAuth();
    const { addToast, openModal } = useUI();

    const [rawPosts, setRawPosts] = useLargePersistentState<ForumPost[]>(STORAGE_KEYS.FORUM_POSTS, mockForumPosts);
    const [comments, setComments] = useLargePersistentState<ForumComment[]>(STORAGE_KEYS.FORUM_COMMENTS, mockForumComments);
    const [categories, setCategories] = usePersistentState<string[]>(STORAGE_KEYS.FORUM_CATEGORIES, mockForumCategories);
    
    const [activeCategory, setActiveCategory] = useState<string>('All');

    const { addCategory, updateCategory, deleteCategory } = useCategoryManager({
        items: rawPosts,
        categories,
        setCategories,
        setItems: setRawPosts,
        addToast,
        itemTypeLabel: 'Category',
        field: 'category',
        shouldSort: true
    });

    const getPostComments = useCallback((postId: string): DisplayableForumComment[] => {
        const postComments = comments.filter(c => c.postId === postId);
        
        const buildCommentTree = (parentId: string | null): DisplayableForumComment[] => {
            return postComments
                .filter(c => c.parentId === parentId)
                .map(comment => {
                    const author = accountsById.get(comment.authorId);
                    const score = comment.upvotes.length - comment.downvotes.length;
                    return {
                        ...comment,
                        author,
                        score,
                        replies: buildCommentTree(comment.id),
                    };
                })
                .sort((a, b) => b.timestamp - a.timestamp);
        };

        return buildCommentTree(null);
    }, [comments, accountsById]);

    const findForumPostById = useCallback((postId: string): ForumPost | undefined => {
        return rawPosts.find(p => p.id === postId);
    }, [rawPosts]);

    const getPostWithComments = useCallback((postId: string): DisplayableForumPost | null => {
        const post = rawPosts.find(p => p.id === postId);
        if (!post) return null;

        const author = accountsById.get(post.authorId);
        const postComments = getPostComments(postId);
        const score = post.upvotes.length - post.downvotes.length;
        const commentCount = comments.filter(c => c.postId === postId).length;

        return {
            ...post,
            author,
            comments: postComments,
            score,
            commentCount
        };
    }, [rawPosts, comments, accountsById, getPostComments]);
    
    const posts = useMemo(() => {
        return rawPosts
            .map(p => getPostWithComments(p.id))
            .filter((p): p is DisplayableForumPost => p !== null);
    }, [rawPosts, getPostWithComments]);

    const addPost = useCallback((postData: Omit<ForumPost, 'id' | 'authorId' | 'timestamp' | 'upvotes' | 'downvotes' | 'isPinned'>) => {
        if (!currentAccount) {
            openModal({ type: 'login' });
            return;
        }
        const newPost: ForumPost = {
            ...postData,
            id: `fp-${Date.now()}`,
            authorId: currentAccount.id,
            timestamp: Date.now(),
            upvotes: [currentAccount.id], // Start with one upvote from the author
            downvotes: [],
            isPinned: false,
        };
        setRawPosts(prev => [newPost, ...prev]);
        addToast('Discussion started!', 'success');
    }, [currentAccount, setRawPosts, addToast, openModal]);

    const addComment = useCallback((commentData: Omit<ForumComment, 'id' | 'authorId' | 'timestamp' | 'upvotes' | 'downvotes'>) => {
        if (!currentAccount) {
            openModal({ type: 'login' });
            return;
        }
        const newComment: ForumComment = {
            ...commentData,
            id: `fc-${Date.now()}`,
            authorId: currentAccount.id,
            timestamp: Date.now(),
            upvotes: [currentAccount.id],
            downvotes: [],
        };
        setComments(prev => [...prev, newComment]);
        
        // --- Notification Logic ---
        const { postId, parentId } = commentData;
        const post = rawPosts.find(p => p.id === postId);
        if (!post) return;

        if (parentId) {
            // It's a reply to a comment
            const parentComment = comments.find(c => c.id === parentId);
            if (parentComment && parentComment.authorId !== currentAccount.id) {
                addNotification({
                    recipientId: parentComment.authorId,
                    message: `${currentAccount.name} replied to your comment on "${post.title}".`,
                    type: 'forum_reply',
                    forumPostId: postId,
                });
            }
        } else {
            // It's a direct reply to a post
            if (post.authorId !== currentAccount.id) {
                addNotification({
                    recipientId: post.authorId,
                    message: `${currentAccount.name} commented on your post "${post.title}".`,
                    type: 'forum_reply',
                    forumPostId: postId,
                });
            }
        }
    }, [currentAccount, setComments, openModal, addNotification, rawPosts, comments]);

    const updateVotes = <T extends ForumPost | ForumComment>(items: T[], id: string, vote: 'up' | 'down'): T[] => {
        if (!currentAccount) {
            openModal({ type: 'login' });
            return items;
        }

        return items.map(item => {
            if (item.id === id) {
                const newUpvotes = item.upvotes.filter(uid => uid !== currentAccount.id);
                const newDownvotes = item.downvotes.filter(uid => uid !== currentAccount.id);
                
                if (vote === 'up') {
                    if (!item.upvotes.includes(currentAccount.id)) {
                        newUpvotes.push(currentAccount.id);
                    }
                } else { // 'down'
                    if (!item.downvotes.includes(currentAccount.id)) {
                        newDownvotes.push(currentAccount.id);
                    }
                }
                return { ...item, upvotes: newUpvotes, downvotes: newDownvotes };
            }
            return item;
        });
    };

    const toggleVote = useCallback((type: 'post' | 'comment', id: string, vote: 'up' | 'down') => {
        if (type === 'post') {
            setRawPosts(prev => updateVotes(prev, id, vote));
        } else {
            setComments(prev => updateVotes(prev, id, vote));
        }
    }, [currentAccount, openModal, setRawPosts, setComments]);

    const updatePost = useCallback((postId: string, newContent: string) => {
        setRawPosts(prev => prev.map(p => p.id === postId ? { ...p, content: newContent, timestamp: Date.now() } : p));
        addToast('Post updated.', 'success');
    }, [setRawPosts, addToast]);
    
    const updateComment = useCallback((commentId: string, newContent: string) => {
        setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: newContent, timestamp: Date.now() } : c));
        addToast('Comment updated.', 'success');
    }, [setComments, addToast]);

    const deletePost = useCallback((postId: string) => {
        setRawPosts(prev => prev.filter(p => p.id !== postId));
        setComments(prev => prev.filter(c => c.postId !== postId));
        addToast('Discussion deleted.', 'success');
    }, [setRawPosts, setComments, addToast]);

    const deleteComment = useCallback((commentId: string) => {
        let commentsToDelete = new Set<string>([commentId]);
        let changed = true;
        while(changed) {
            changed = false;
            const sizeBefore = commentsToDelete.size;
            comments.forEach(c => {
                if (c.parentId && commentsToDelete.has(c.parentId) && !commentsToDelete.has(c.id)) {
                    commentsToDelete.add(c.id);
                    changed = true;
                }
            });
            if (commentsToDelete.size === sizeBefore) changed = false;
        }
        setComments(prev => prev.filter(c => !commentsToDelete.has(c.id)));
        addToast('Comment deleted.', 'success');
    }, [comments, setComments, addToast]);

    const value = useMemo(() => ({
        posts, comments, categories,
        activeCategory, setActiveCategory,
        getPostWithComments,
        findForumPostById,
        getPostComments,
        addPost,
        addComment,
        toggleVote,
        updatePost,
        updateComment,
        deletePost,
        deleteComment,
        addCategory,
        updateCategory,
        deleteCategory,
    }), [
        posts, comments, categories, activeCategory,
        getPostWithComments, findForumPostById, getPostComments, addPost, addComment,
        toggleVote, updatePost, updateComment, deletePost, deleteComment,
        addCategory, updateCategory, deleteCategory,
    ]);

    return (
        <ForumContext.Provider value={value}>
            {children}
        </ForumContext.Provider>
    );
};

export const useForum = () => {
    const context = useContext(ForumContext);
    if (context === undefined) {
        throw new Error('useForum must be used within a ForumProvider');
    }
    return context;
};
