import { useRef, useEffect, RefObject } from 'react';

interface UseSwipeToNavigateTabsProps {
  tabs: string[];
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  swipeRef: RefObject<HTMLElement>;
  disabled?: boolean;
}

const SWIPE_THRESHOLD = 50; // pixels
const MAX_VERTICAL_SWIPE = 40; // pixels to allow some vertical movement

export const useSwipeToNavigateTabs = ({
  tabs,
  activeTab,
  setActiveTab,
  swipeRef,
  disabled = false,
}: UseSwipeToNavigateTabsProps) => {
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const element = swipeRef.current;
    if (!element || disabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Don't interfere if there's more than one touch point or if the user is interacting with an input/textarea
      if (e.touches.length !== 1 || ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        touchStart.current = null;
        return;
      }
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStart.current || e.touches.length !== 1) {
        return;
      }
      const deltaX = e.touches[0].clientX - touchStart.current.x;
      const deltaY = e.touches[0].clientY - touchStart.current.y;

      // If horizontal movement is dominant, prevent default to stop browser back/forward gesture.
      if (Math.abs(deltaX) > Math.abs(deltaY) + 10) { // Add a buffer
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current) {
        return;
      }

      const deltaX = e.changedTouches[0].clientX - touchStart.current.x;
      const deltaY = e.changedTouches[0].clientY - touchStart.current.y;

      touchStart.current = null; // Reset for next touch

      // Ignore if it was a vertical swipe or just a tap
      if (
        Math.abs(deltaY) > MAX_VERTICAL_SWIPE || 
        Math.abs(deltaX) < SWIPE_THRESHOLD
      ) {
        return;
      }
      
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex === -1) return;

      if (deltaX < -SWIPE_THRESHOLD) { // Swipe Left
        const nextIndex = currentIndex + 1;
        if (nextIndex < tabs.length) {
          setActiveTab(tabs[nextIndex]);
        }
      } else if (deltaX > SWIPE_THRESHOLD) { // Swipe Right
        const prevIndex = currentIndex - 1;
        if (prevIndex >= 0) {
          setActiveTab(tabs[prevIndex]);
        }
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [swipeRef, tabs, activeTab, setActiveTab, disabled]);
};