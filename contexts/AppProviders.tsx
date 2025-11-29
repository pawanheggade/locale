import React from 'react';
import { AuthProvider } from './AuthContext';
import { PostsProvider } from './PostsContext';
import { FiltersProvider } from './FiltersContext';
import { UIProvider } from './UIContext';
import { ForumProvider } from './ForumContext';
import { ActivityProvider } from './ActivityContext';
import { NavigationProvider } from './NavigationContext';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <UIProvider>
      <AuthProvider>
        <ActivityProvider>
          <PostsProvider>
            <ForumProvider>
              <FiltersProvider>
                <NavigationProvider>
                  {children}
                </NavigationProvider>
              </FiltersProvider>
            </ForumProvider>
          </PostsProvider>
        </ActivityProvider>
      </AuthProvider>
    </UIProvider>
  );
};