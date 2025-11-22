
import { useState, useEffect, useRef } from 'react';

export const useBadgeAnimation = (count: number) => {
  const [animateBadge, setAnimateBadge] = useState(false);
  const prevCount = useRef(count);

  useEffect(() => {
    if (count > prevCount.current) {
      setAnimateBadge(true);
      const timer = setTimeout(() => setAnimateBadge(false), 400); // match animation duration
      return () => clearTimeout(timer);
    }
    prevCount.current = count;
  }, [count]);

  return animateBadge;
};
