import React from 'react';
import { AuthProvider } from './AuthContext';
import { PostsProvider } from './PostsContext';
import { FiltersProvider } from './FiltersContext';
import { UIProvider } from './UIContext';
import { ForumProvider } from './ForumContext';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <UIProvider>
      <AuthProvider>
        <PostsProvider>
          <ForumProvider>
            <FiltersProvider>
              {children}
            </FiltersProvider>
          </ForumProvider>
        </PostsProvider>
      </AuthProvider>
    </UIProvider>
  );
};