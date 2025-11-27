
import React, { createContext, useContext } from 'react';
import { PostActions } from '../types';

export const PostActionsContext = createContext<PostActions | undefined>(undefined);

export const usePostActions = (): PostActions => {
    const context = useContext(PostActionsContext);
    if (context === undefined) {
        throw new Error('usePostActions must be used within a PostActionsProvider');
    }
    return context;
};
