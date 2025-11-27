
import React from 'react';
import { AuthProvider } from './AuthContext';
import { PostsProvider } from './PostsContext';
import { FiltersProvider } from './FiltersContext';
import { UIProvider } from './UIContext';
import { ForumProvider } from './ForumContext';
import { ActivityProvider } from './ActivityContext';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <UIProvider>
      <AuthProvider>
        <PostsProvider>
          <ActivityProvider>
            <ForumProvider>
              <FiltersProvider>
                {children}
              </FiltersProvider>
            </ForumProvider>
          </ActivityProvider>
        </PostsProvider>
      </AuthProvider>
    </UIProvider>
  );
};
