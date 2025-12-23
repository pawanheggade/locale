



import React from 'react';
import { AuthProvider } from './AuthContext';
import { PostsProvider } from './PostsContext';
import { FiltersProvider } from './FiltersContext';
import { UIProvider } from './UIContext';
import { ForumProvider } from './ForumContext';
import { ActivityProvider } from './ActivityContext';
import { UserDataProvider } from './UserDataContext';
import { LoadingProvider } from './LoadingContext';
import { StoryProvider } from './StoryContext';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <UIProvider>
      <LoadingProvider>
        <AuthProvider>
          <UserDataProvider>
            <ActivityProvider>
              <PostsProvider>
                <StoryProvider>
                  <ForumProvider>
                    <FiltersProvider>
                      {children}
                    </FiltersProvider>
                  </ForumProvider>
                </StoryProvider>
              </PostsProvider>
            </ActivityProvider>
          </UserDataProvider>
        </AuthProvider>
      </LoadingProvider>
    </UIProvider>
  );
};