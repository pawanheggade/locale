import { useState, useCallback } from 'react';

interface UseCarouselOptions {
  itemCount: number;
  initialIndex?: number;
  loop?: boolean;
}

export const useCarousel = ({ itemCount, initialIndex = 0, loop = true }: UseCarouselOptions) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goToPrevious = useCallback(() => {
    if (itemCount === 0) return;
    setCurrentIndex(prevIndex => {
      if (loop) {
        return prevIndex === 0 ? itemCount - 1 : prevIndex - 1;
      }
      return Math.max(0, prevIndex - 1);
    });
  }, [itemCount, loop]);

  const goToNext = useCallback(() => {
    if (itemCount === 0) return;
    setCurrentIndex(prevIndex => {
      if (loop) {
        return prevIndex === itemCount - 1 ? 0 : prevIndex + 1;
      }
      return Math.min(itemCount - 1, prevIndex + 1);
    });
  }, [itemCount, loop]);

  return {
    currentIndex,
    goToNext,
    goToPrevious,
    setCurrentIndex,
  };
};
