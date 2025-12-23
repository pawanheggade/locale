
import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { StoryPost, DisplayableStoryPost, Media } from '../types';
import { useLargePersistentState } from '../hooks/useLargePersistentState';
import { useAuth } from './AuthContext';
import { usePosts } from './PostsContext';
import { useUI } from './UIContext';
import { mockStoryPosts } from '../data/stories';
import { STORAGE_KEYS } from '../lib/constants';

interface StoryContextType {
  stories: DisplayableStoryPost[];
  activeStories: DisplayableStoryPost[];
  activeStoriesByUser: Map<string, DisplayableStoryPost[]>;
  addStory: (media: Media, linkPostId?: string | null, description?: string) => StoryPost | null;
  markStoryAsViewed: (storyId: string) => void;
  toggleLikeStory: (storyId: string) => void;
  findStoryById: (storyId: string) => DisplayableStoryPost | undefined;
  updateStory: (storyId: string, updates: Partial<Pick<StoryPost, 'media' | 'description' | 'linkPostId'>>) => void;
}

const StoryContext = createContext<StoryContextType | undefined>(undefined);

export const StoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentAccount, accountsById } = useAuth();
    const { findPostById } = usePosts();
    const { openModal } = useUI();
    const [rawStories, setRawStories] = useLargePersistentState<StoryPost[]>(STORAGE_KEYS.STORY_POSTS, mockStoryPosts);

    const stories = useMemo(() => {
        return rawStories.map(story => ({
            ...story,
            author: accountsById.get(story.authorId),
            linkPost: story.linkPostId ? findPostById(story.linkPostId) : undefined,
        }));
    }, [rawStories, accountsById, findPostById]);

    const activeStories = useMemo(() => {
        const now = Date.now();
        return stories.filter(story => story.expiryTimestamp > now);
    }, [stories]);

    const activeStoriesByUser = useMemo(() => {
        const map = new Map<string, DisplayableStoryPost[]>();
        activeStories.forEach(story => {
            if (story.authorId) {
                const userStories = map.get(story.authorId) || [];
                map.set(story.authorId, [...userStories, story]);
            }
        });
        // Sort stories within each user group by timestamp
        map.forEach((userStories, userId) => {
            map.set(userId, userStories.sort((a, b) => a.timestamp - b.timestamp));
        });
        return map;
    }, [activeStories]);

    const addStory = useCallback((media: Media, linkPostId?: string | null, description?: string): StoryPost | null => {
        if (!currentAccount) {
            openModal({ type: 'login' });
            return null;
        }

        const newStory: StoryPost = {
            id: `story-${Date.now()}`,
            authorId: currentAccount.id,
            media,
            timestamp: Date.now(),
            expiryTimestamp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
            description,
            linkPostId,
            viewedBy: [currentAccount.id], // The creator has "viewed" it
            likedBy: [],
        };

        setRawStories(prev => [newStory, ...prev]);
        return newStory;
    }, [currentAccount, setRawStories, openModal]);
    
    const markStoryAsViewed = useCallback((storyId: string) => {
        if (!currentAccount) return;
        
        setRawStories(prev => prev.map(story => {
            if (story.id === storyId && !story.viewedBy.includes(currentAccount.id)) {
                return { ...story, viewedBy: [...story.viewedBy, currentAccount.id] };
            }
            return story;
        }));
    }, [currentAccount, setRawStories]);

    const toggleLikeStory = useCallback((storyId: string) => {
        if (!currentAccount) {
            openModal({ type: 'login' });
            return;
        }

        setRawStories(prev => prev.map(story => {
            if (story.id === storyId) {
                const likedBy = story.likedBy || [];
                const isLiked = likedBy.includes(currentAccount.id);
                return {
                    ...story,
                    likedBy: isLiked
                        ? likedBy.filter(id => id !== currentAccount.id)
                        : [...likedBy, currentAccount.id],
                };
            }
            return story;
        }));
    }, [currentAccount, setRawStories, openModal]);

    const findStoryById = useCallback((storyId: string): DisplayableStoryPost | undefined => {
        return stories.find(s => s.id === storyId);
    }, [stories]);

    const updateStory = useCallback((storyId: string, updates: Partial<Pick<StoryPost, 'media' | 'description' | 'linkPostId'>>) => {
        setRawStories(prev => prev.map(story => {
            if (story.id === storyId) {
                return { ...story, ...updates };
            }
            return story;
        }));
    }, [setRawStories]);

    const value = useMemo(() => ({
        stories,
        activeStories,
        activeStoriesByUser,
        addStory,
        markStoryAsViewed,
        toggleLikeStory,
        findStoryById,
        updateStory,
    }), [stories, activeStories, activeStoriesByUser, addStory, markStoryAsViewed, toggleLikeStory, findStoryById, updateStory]);

    return (
        <StoryContext.Provider value={value}>
            {children}
        </StoryContext.Provider>
    );
};

export const useStory = () => {
    const context = useContext(StoryContext);
    if (context === undefined) {
        throw new Error('useStory must be used within a StoryProvider');
    }
    return context;
};