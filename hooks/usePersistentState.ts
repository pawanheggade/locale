
import React, { useState, useEffect } from 'react';

export const usePersistentState = <T,>(key: string, initialValue: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = useState<T>(() => {
    try {
      const storedValue = window.localStorage.getItem(key);
      if (storedValue) {
        return JSON.parse(storedValue) as T;
      }
    } catch (error) {
      console.error(`Error reading ${key} from local storage:`, error);
    }
    return initialValue instanceof Function ? initialValue() : initialValue;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error: any) {
      if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
          console.error(`Storage limit exceeded when saving ${key}. Data may not persist.`);
          // Optionally trigger a global event or toast here if we had access to context
      } else {
          console.error(`Error saving ${key} to local storage:`, error);
      }
    }
  }, [key, state]);

  return [state, setState];
};
