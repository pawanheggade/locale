import React, { useState, useCallback, useRef, RefObject, useEffect } from 'react';

const PULL_THRESHOLD = 80;
const PREVENT_DEFAULT_THRESHOLD = 10; // A small pixel threshold to distinguish a pull from an accidental tap movement

interface UsePullToRefreshOptions {
  onRefresh: () => void;
  mainContentRef: RefObject<HTMLElement>;
  isRefreshing: boolean;
  disabled?: boolean;
}

/**
 * A custom hook to manage the pull-to-refresh UI interaction.
 * @param onRefresh - The function to call when a refresh is triggered.
 * @param mainContentRef - A ref to the main scrollable content element.
 * @param isRefreshing - The state indicating if a refresh is currently in progress.
 * @returns An object with state and event handlers to apply to the component.
 */
export const usePullToRefresh = ({ onRefresh, mainContentRef, isRefreshing, disabled = false }: UsePullToRefreshOptions) => {
  const [pullPosition, setPullPosition] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  const hapticTriggeredRef = useRef(false);
  const touchStartY = useRef(0);

  useEffect(() => {
    // When the refresh action is complete (isRefreshing becomes false),
    // reset the pull position to hide the indicator.
    if (!isRefreshing) {
      setPullPosition(0);
    }
  }, [isRefreshing]);
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || !mainContentRef.current || mainContentRef.current.scrollTop !== 0 || isRefreshing) {
        setIsPulling(false);
        return;
    }
    touchStartY.current = e.touches[0].clientY;
    setIsPulling(true);
    hapticTriggeredRef.current = false;
  }, [isRefreshing, mainContentRef, disabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || touchStartY.current === 0) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;

    // Only prevent default browser actions (like scrolling or click suppression)
    // if the user has pulled down past a small threshold. This distinguishes a
    // real pull gesture from an accidental movement during a tap.
    if (deltaY > PREVENT_DEFAULT_THRESHOLD) {
      e.preventDefault();
    }

    // Apply a damping effect for a more natural feel.
    // By using Math.max(0, deltaY), we ensure that moving the finger up
    // smoothly brings the indicator back to zero without causing errors,
    // and we don't prematurely cancel the gesture.
    const newPullPosition = Math.pow(Math.max(0, deltaY), 0.85);
    setPullPosition(newPullPosition);

    if (newPullPosition >= PULL_THRESHOLD && !hapticTriggeredRef.current) {
        if (navigator.vibrate) navigator.vibrate(5);
        hapticTriggeredRef.current = true;
    }
  }, [isPulling]);

  const handleTouchEnd = useCallback(() => {
    if (!isPulling) return;
    
    const releasedPullPosition = pullPosition;

    setIsPulling(false);
    touchStartY.current = 0;
    
    if (releasedPullPosition >= PULL_THRESHOLD) {
        onRefresh();
    } else {
        // If a refresh wasn't triggered, reset the position.
        setPullPosition(0);
    }
  }, [isPulling, pullPosition, onRefresh]);

  return {
    pullPosition,
    isPulling,
    pullThreshold: PULL_THRESHOLD,
    touchHandlers: {
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
    },
  };
};