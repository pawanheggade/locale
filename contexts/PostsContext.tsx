import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { Post, PostCategory, DisplayablePost } from '../types';
import { usePersistentState } from '../hooks/usePersistentState';
import { useLargePersistentState } from '../hooks/useLargePersistentState';
import { useUI } from './UIContext';
import { initialPosts } from '../data/posts';
import { useCategoryManager } from '../hooks/useCategoryManager';
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
import { STORAGE_KEYS } from '../lib/constants';
import { useConfirmationModal } from '../hooks/useConfirmationModal';

const initialCategoriesData: PostCategory[] = ['Groceries', 'Furniture', 'Lighting', 'Decor', 'Textiles', 'Artwork', 'Design Services'].sort((a, b) => a.localeCompare(b));
const initialPriceUnits = ['Fixed', 'Hour', 'Day', 'Week', 'Month', 'Session', 'Visit', 'Project', 'Room', 'Sq. Ft.', 'Sq. M.', 'Cu. Ft.', 'Cu. M.', 'Meter', 'Ft.', 'Yard', 'Inch', 'Cm.', 'Kg', 'Gm', 'Lb', 'Oz'];

interface PostsContextType {
  posts: DisplayablePost[];
  archivedPosts: DisplayablePost[];
  categories: PostCategory[];
  allAvailableTags: string[];
  priceUnits: string[];

  findPostById: (postId: string) => DisplayablePost | undefined;
  refreshPosts: () => void;
  createPost: (postData: Omit<Post, 'id' | 'isLiked' | 'authorId'>, authorId: string) => Post;
  addPostSilently: (postData: Omit<Post, 'id' | 'isLiked' | 'authorId'>, authorId: string) => Post;
  updatePost: (updatedPost: Post) => Promise<Post>;
  archivePost: (postId: string) => void;
  unarchivePost: (postId: string) => void;
  deletePostPermanently: (postId: string) => void;
  togglePinPost: (postId: string) => void;
  
  addCategory: (name: string) => void;
  updateCategory: (oldName: string, newName: string) => void;
  deleteCategory: (name: string) => void;

  addPriceUnit: (name: string) => void;
  updatePriceUnit: (oldName: string, newName: string) => void;
  deletePriceUnit: (name: string) => void;
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export const PostsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { addToast } = useUI();
    const showConfirmation = useConfirmationModal();
    const { accountsById } = useAuth();
    const { checkAvailabilityAlerts, checkPriceAlerts } = useActivity();
    
    // Use LargePersistentState for posts (images/content)
    const [rawPosts, setRawPosts] = useLargePersistentState<Post[]>(STORAGE_KEYS.POSTS, initialPosts);
    const [rawArchivedPosts, setRawArchivedPosts] = useLargePersistentState<Post[]>(STORAGE_KEYS.ARCHIVED_POSTS, []);
    
    // Keep simple storage for small strings
    const [categories, setCategories] = usePersistentState<PostCategory[]>(STORAGE_KEYS.CATEGORIES, initialCategoriesData);
    const [priceUnits, setPriceUnits] = usePersistentState<string[]>(STORAGE_KEYS.PRICE_UNITS, initialPriceUnits);

    const posts = useMemo(() => {
        return rawPosts.map(p => ({ ...p, author: accountsById.get(p.authorId) }));
    }, [rawPosts, accountsById]);

    const archivedPosts = useMemo(() => {
        return rawArchivedPosts.map(p => ({ ...p, author: accountsById.get(p.authorId) }));
    }, [rawArchivedPosts, accountsById]);


    const { 
        addCategory, 
        updateCategory, 
        deleteCategory 
    } = useCategoryManager({
        items: rawPosts,
        archivedItems: rawArchivedPosts,
        categories,
        setCategories,
        setItems: setRawPosts,
        setArchivedItems: setRawArchivedPosts,
        addToast,
        itemTypeLabel: 'Category',
        field: 'category',
        shouldSort: true
    });

    const {
        addCategory: addPriceUnit,
        updateCategory: updatePriceUnit,
        deleteCategory: deletePriceUnit
    } = useCategoryManager({
        items: rawPosts,
        archivedItems: rawArchivedPosts,
        categories: priceUnits,
        setCategories: setPriceUnits,
        setItems: setRawPosts,
        setArchivedItems: setRawArchivedPosts,
        addToast,
        itemTypeLabel: 'Price unit',
        field: 'priceUnit',
        shouldSort: false // Preserve order for price units mostly, or let user append
    });

    const allAvailableTags = useMemo(() => {
        const allTags = new Set<string>();
        rawPosts.forEach(post => { post.tags.forEach(tag => allTags.add(tag)); });
        return Array.from(allTags).sort();
    }, [rawPosts]);
    
    const findPostById = useCallback((postId: string): DisplayablePost | undefined => {
        return posts.find(p => p.id === postId) || archivedPosts.find(p => p.id === postId);
    }, [posts, archivedPosts]);
      
    const refreshPosts = useCallback(() => {
        setRawPosts(prev => prev.map(p => ({ ...p, lastUpdated: Date.now() })));
    }, [setRawPosts]);
    
    const addPostSilently = useCallback((postData: Omit<Post, 'id' | 'isLiked' | 'authorId'>, authorId: string): Post => {
        const newPost: Post = { ...postData, id: Date.now().toString(), isLiked: false, authorId };
        setRawPosts(prev => [newPost, ...prev]);
        return newPost;
    }, [setRawPosts]);

    const createPost = useCallback((postData: Omit<Post, 'id' | 'isLiked' | 'authorId'>, authorId: string): Post => {
        const newPost = addPostSilently(postData, authorId);
        return newPost;
    }, [addPostSilently]);
      
    const updatePost = useCallback(async (updatedPost: Post): Promise<Post> => {
        let updated: Post | undefined;
        const isArchived = rawArchivedPosts.some(p => p.id === updatedPost.id);
        
        const originalPost = isArchived 
            ? rawArchivedPosts.find(p => p.id === updatedPost.id)
            : rawPosts.find(p => p.id === updatedPost.id);
            
        if (isArchived) {
            setRawArchivedPosts(prev => prev.map(p => {
                if (p.id === updatedPost.id) {
                    updated = { ...updatedPost, lastUpdated: Date.now() };
                    return updated;
                }
                return p;
            }));
        } else {
            setRawPosts(prev => prev.map(p => {
                if (p.id === updatedPost.id) {
                    updated = { ...updatedPost, lastUpdated: Date.now() };
                    return updated;
                }
                return p;
            }));
        }
        if (!updated) throw new Error("Post not found for update");

        const originalEffectivePrice = originalPost?.salePrice ?? originalPost?.price;
        const newEffectivePrice = updated.salePrice ?? updated.price;

        if (originalPost && originalEffectivePrice !== undefined && newEffectivePrice !== undefined && newEffectivePrice < originalEffectivePrice) {
            checkPriceAlerts(updated, originalPost);
        }

        checkAvailabilityAlerts(updated);

        return updated;
    }, [rawArchivedPosts, rawPosts, setRawArchivedPosts, setRawPosts, checkAvailabilityAlerts, checkPriceAlerts]);
    
    const archivePost = useCallback((postId: string) => {
        showConfirmation({
            title: 'Archive Post',
            message: 'Are you sure?',
            onConfirm: () => {
                const postToArchive = rawPosts.find(p => p.id === postId);
                if (postToArchive) {
                    setRawPosts(prev => prev.filter(p => p.id !== postId));
                    setRawArchivedPosts(prev => [{...postToArchive, isPinned: false}, ...prev]); // Unpin when archiving
                }
            },
            confirmText: 'Archive',
            confirmClassName: 'bg-amber-600 text-white',
        });
    }, [rawPosts, setRawPosts, setRawArchivedPosts, showConfirmation]);
      
    const unarchivePost = useCallback((postId: string) => {
        const postToUnarchive = rawArchivedPosts.find(p => p.id === postId);
        if (postToUnarchive) {
            setRawArchivedPosts(prev => prev.filter(p => p.id !== postId));
            setRawPosts(prev => [postToUnarchive, ...prev]);
            checkAvailabilityAlerts(postToUnarchive);
        }
    }, [rawArchivedPosts, setRawArchivedPosts, setRawPosts, checkAvailabilityAlerts]);
    
    const deletePostPermanently = useCallback((postId: string) => {
        showConfirmation({
            title: 'Delete Post Permanently',
            message: 'This action cannot be undone.',
            onConfirm: () => {
                setRawPosts(prev => prev.filter(p => p.id !== postId));
                setRawArchivedPosts(prev => prev.filter(p => p.id !== postId));
            },
            confirmText: 'Delete Permanently',
        });
    }, [setRawPosts, setRawArchivedPosts, showConfirmation]);

    const togglePinPost = useCallback((postId: string) => {
        const post = findPostById(postId);
        if (!post) {
            return;
        }

        setRawPosts(prev => prev.map(p =>
            p.id === postId ? { ...p, isPinned: !p.isPinned } : p
        ));
    }, [findPostById, setRawPosts]);
    
    const value = useMemo(() => ({
        posts, archivedPosts, categories, allAvailableTags, priceUnits,
        findPostById, refreshPosts, createPost, addPostSilently, updatePost, archivePost, unarchivePost, deletePostPermanently,
        togglePinPost,
        addCategory, updateCategory, deleteCategory,
        addPriceUnit, updatePriceUnit, deletePriceUnit,
    }), [
        posts, archivedPosts, categories, allAvailableTags, priceUnits,
        findPostById, refreshPosts, createPost, addPostSilently, updatePost, archivePost, unarchivePost, deletePostPermanently,
        togglePinPost,
        addCategory, updateCategory, deleteCategory,
        addPriceUnit, updatePriceUnit, deletePriceUnit,
    ]);

    return (
        <PostsContext.Provider value={value}>
            {children}
        </PostsContext.Provider>
    );
};

export const usePosts = () => {
    const context = useContext(PostsContext);
    if (context === undefined) {
        throw new Error('usePosts must be used within a PostsProvider');
    }
    return context;
};
