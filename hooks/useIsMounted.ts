
import { useEffect, useRef, useCallback } from 'react';

/**
 * A hook that returns a function which returns true if the component is currently mounted.
 * Useful for preventing state updates on unmounted components during async operations.
 */
export const useIsMounted = () => {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return useCallback(() => isMounted.current, []);
};
