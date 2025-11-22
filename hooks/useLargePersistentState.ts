
import React, { useState, useEffect, useRef } from 'react';
import { get, set } from '../utils/storage';
import { useDebounce } from './useDebounce';

export const useLargePersistentState = <T>(key: string, initialValue: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);
  const isMounted = useRef(true);
  
  // Debounce updates to storage to prevent "connection closing" errors from rapid firing transactions
  const debouncedState = useDebounce(state, 1000);

  useEffect(() => {
    isMounted.current = true;
    const load = async () => {
        try {
            const stored = await get(key);
            if (isMounted.current && stored !== undefined) {
                setState(stored as T);
            }
        } catch (e) {
            console.error(`Failed to load large state for ${key}`, e);
        } finally {
            if (isMounted.current) setIsLoaded(true);
        }
    };
    load();
    return () => { isMounted.current = false; };
  }, [key]);

  useEffect(() => {
      if (isLoaded) {
          set(key, debouncedState).catch(err => console.error(`Error saving ${key} to IDB`, err));
      }
  }, [key, debouncedState, isLoaded]);

  return [state, setState];
};
