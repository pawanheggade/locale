

import React from 'react';
import { AuthProvider } from './AuthContext';
import { PostsProvider } from './PostsContext';
import { FiltersProvider } from './FiltersContext';
import { UIProvider } from './UIContext';
import { ForumProvider } from './ForumContext';
import { ActivityProvider } from './ActivityContext';
import { UserDataProvider } from './UserDataContext';
import { LoadingProvider } from './LoadingContext';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <UIProvider>
      <LoadingProvider>
        <AuthProvider>
          <UserDataProvider>
            <ActivityProvider>
              <PostsProvider>
                <ForumProvider>
                  <FiltersProvider>
                    {children}
                  </FiltersProvider>
                </ForumProvider>
              </PostsProvider>
            </ActivityProvider>
          </UserDataProvider>
        </AuthProvider>
      </LoadingProvider>
    </UIProvider>
  );
};