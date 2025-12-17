import React, { createContext, useState, useCallback, useMemo, useContext } from 'react';

interface LoadingContextType {
  isLoading: boolean;
  isLoadingTask: (key: string) => boolean;
  startLoading: (key: string) => void;
  stopLoading: (key: string) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loadingTasks, setLoadingTasks] = useState<Set<string>>(new Set());

  const startLoading = useCallback((key: string) => {
    setLoadingTasks(prev => {
      const newSet = new Set(prev);
      newSet.add(key);
      return newSet;
    });
  }, []);

  const stopLoading = useCallback((key: string) => {
    setLoadingTasks(prev => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
  }, []);
  
  const isLoading = loadingTasks.size > 0;
  const isLoadingTask = useCallback((key: string) => loadingTasks.has(key), [loadingTasks]);

  const value = useMemo(() => ({
    isLoading,
    isLoadingTask,
    startLoading,
    stopLoading,
  }), [isLoading, isLoadingTask, startLoading, stopLoading]);

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
