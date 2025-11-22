import React, { useState, useRef, useCallback, RefObject } from 'react';

interface UseImageViewerGesturesProps {
  imageRef: RefObject<HTMLImageElement>;
  isImage: boolean;
  itemCount: number;
  goToNext: () => void;
  goToPrevious: () => void;
}

// Helper Functions
const getDistance = (t1: React.Touch, t2: React.Touch) => Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
const getMidpoint = (t1: React.Touch, t2: React.Touch) => ({ x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 });

const DOUBLE_TAP_DELAY = 300; // ms
const DOUBLE_TAP_ZOOM_SCALE = 3;

export const useImageViewerGestures = ({
  imageRef,
  isImage,
  itemCount,
  goToNext,
  goToPrevious,
}: UseImageViewerGesturesProps) => {
  const [transform, setTransform] = useState({ scale: 1, positionX: 0, positionY: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isPinching, setIsPinching] = useState(false);
  const dragStartPoint = useRef({ x: 0, y: 0 });
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState(0);
  const initialPinchRef = useRef<{ distance: number; midpoint: {x: number; y: number}; initialTransform: typeof transform } | null>(null);
  const lastTapTimeRef = useRef(0);

  const reset = useCallback(() => {
    setTransform({ scale: 1, positionX: 0, positionY: 0 });
    setTouchStartX(null);
    setTouchDeltaX(0);
    setIsDragging(false);
    setIsPinching(false);
    initialPinchRef.current = null;
  }, []);

  const getClampedPosition = useCallback((positionX: number, positionY: number, scale: number) => {
    if (!imageRef.current || !imageRef.current.parentElement) return { positionX, positionY };
    
    // Use rendered client dimensions of the image, not its natural dimensions.
    const { clientWidth, clientHeight } = imageRef.current;
    const container = imageRef.current.parentElement;

    // Effective image dimensions based on its rendered size and current scale
    const imageWidth = clientWidth * scale;
    const imageHeight = clientHeight * scale;

    // Calculate how much the scaled image overflows the container on each side
    const overflowX = Math.max(0, (imageWidth - container.clientWidth) / 2);
    const overflowY = Math.max(0, (imageHeight - container.clientHeight) / 2);

    return {
        positionX: Math.max(-overflowX, Math.min(overflowX, positionX)),
        positionY: Math.max(-overflowY, Math.min(overflowY, positionY)),
    };
  }, [imageRef]);

  const zoomToPoint = useCallback((newScale: number, clientX: number, clientY: number) => {
    if (!imageRef.current) return;
    
    const clampedScale = Math.max(1, Math.min(newScale, 5));
    if (clampedScale === transform.scale) return;
    
    if (clampedScale === 1) {
      reset();
      return;
    }
    
    const rect = imageRef.current.getBoundingClientRect();
    const p_screen_x = clientX - rect.left;
    const p_screen_y = clientY - rect.top;

    const scaleRatio = clampedScale / transform.scale;
    
    const newPositionX = p_screen_x - (p_screen_x - transform.positionX) * scaleRatio;
    const newPositionY = p_screen_y - (p_screen_y - transform.positionY) * scaleRatio;

    const clampedPosition = getClampedPosition(newPositionX, newPositionY, clampedScale);
    setTransform({ scale: clampedScale, ...clampedPosition });

  }, [transform, imageRef, getClampedPosition, reset]);

  const handleZoom = useCallback((direction: 'in' | 'out' | 'reset') => {
      if (!imageRef.current || !imageRef.current.parentElement) return;
      if (direction === 'reset') {
          reset();
          return;
      }
      
      const zoomFactor = 0.5;
      const newScale = direction === 'in' ? transform.scale + zoomFactor : transform.scale - zoomFactor;

      const containerRect = imageRef.current.parentElement.getBoundingClientRect();
      const centerX = containerRect.left + containerRect.width / 2;
      const centerY = containerRect.top + containerRect.height / 2;
      
      zoomToPoint(newScale, centerX, centerY);

  }, [transform.scale, reset, imageRef, zoomToPoint]);
  
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
      if (!isImage) return;
      e.preventDefault();

      const zoomFactor = -0.001;
      const newScale = transform.scale + e.deltaY * zoomFactor;
      
      zoomToPoint(newScale, e.clientX, e.clientY);
  }, [isImage, transform.scale, zoomToPoint]);

  const handleDoubleClick = useCallback((e: React.MouseEvent | { clientX: number, clientY: number }) => {
    if (!isImage) return;
    const newScale = transform.scale > 1 ? 1 : DOUBLE_TAP_ZOOM_SCALE;
    zoomToPoint(newScale, e.clientX, e.clientY);
  }, [isImage, transform.scale, zoomToPoint]);

  const startDrag = (clientX: number, clientY: number) => {
      if (!isImage || transform.scale <= 1) return;
      setIsDragging(true);
      dragStartPoint.current = {
          x: clientX - transform.positionX,
          y: clientY - transform.positionY,
      };
  };
  
  const onDrag = (clientX: number, clientY: number) => {
      if (!isDragging || !isImage || transform.scale <= 1) return;
      const newPositionX = clientX - dragStartPoint.current.x;
      const newPositionY = clientY - dragStartPoint.current.y;
      
      setTransform(t => ({ 
        ...t, 
        ...getClampedPosition(newPositionX, newPositionY, t.scale) 
      }));
  };
  
  const endDrag = () => setIsDragging(false);

  const handleMouseDown = (e: React.MouseEvent) => startDrag(e.clientX, e.clientY);
  const handleMouseMove = (e: React.MouseEvent) => onDrag(e.clientX, e.clientY);

  const handleTouchStart = (e: React.TouchEvent) => {
      if (e.touches.length === 2 && isImage) {
          e.preventDefault();
          setIsPinching(true);
          setIsDragging(false);
          setTouchStartX(null);
          setTouchDeltaX(0);
          
          const [t1, t2] = [e.touches[0], e.touches[1]];
          initialPinchRef.current = {
              distance: getDistance(t1, t2),
              midpoint: getMidpoint(t1, t2),
              initialTransform: { ...transform }
          };
          return;
      }
  
      if (e.touches.length === 1) {
          const touch = e.touches[0];
          if (isImage && transform.scale > 1) {
              startDrag(touch.clientX, touch.clientY);
          } else if (itemCount > 1) {
              setTouchStartX(touch.clientX);
              setTouchDeltaX(0);
          }
      }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      if (isPinching && e.touches.length === 2 && isImage && initialPinchRef.current) {
          e.preventDefault();
          const [t1, t2] = [e.touches[0], e.touches[1]];
          const newDistance = getDistance(t1, t2);
          const newMidpoint = getMidpoint(t1, t2);
          
          const { 
            distance: initialDistance, 
            midpoint: initialMidpoint, 
            initialTransform 
          } = initialPinchRef.current;
          
          const scaleRatio = newDistance / initialDistance;
          const newScale = Math.max(1, Math.min(initialTransform.scale * scaleRatio, 5));

          if (newScale === 1) {
            reset();
            return;
          }

          const newPositionX = newMidpoint.x + (initialTransform.positionX - initialMidpoint.x) * scaleRatio;
          const newPositionY = newMidpoint.y + (initialTransform.positionY - initialMidpoint.y) * scaleRatio;
          
          const clampedPosition = getClampedPosition(newPositionX, newPositionY, newScale);
          setTransform({ scale: newScale, ...clampedPosition });
          return;
      }
  
      if (e.touches.length === 1) {
          const touch = e.touches[0];
          if (isDragging) {
              onDrag(touch.clientX, touch.clientY);
          } else if (touchStartX !== null) {
              const delta = touch.clientX - touchStartX;
              setTouchDeltaX(delta);
          }
      }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;

    // We only process the double tap if it wasn't a drag or pinch
    if (timeSinceLastTap < DOUBLE_TAP_DELAY && e.changedTouches.length === 1 && !isDragging && !isPinching && touchDeltaX === 0) {
        const touch = e.changedTouches[0];
        handleDoubleClick({ clientX: touch.clientX, clientY: touch.clientY });
        lastTapTimeRef.current = 0; // Reset tap time to prevent triple tap issues
        return;
    }
    lastTapTimeRef.current = now;

    if (isPinching && e.touches.length < 2) {
        setIsPinching(false);
        initialPinchRef.current = null;
    }
  
    if (!isPinching && e.touches.length === 0) {
        if (isDragging) {
            endDrag();
        } else if (touchStartX !== null) {
            const swipeThreshold = 50;
            if (touchDeltaX < -swipeThreshold) {
                goToNext();
            } else if (touchDeltaX > swipeThreshold) {
                goToPrevious();
            }
            setTouchStartX(null);
            setTouchDeltaX(0);
        }
    }
  };

  return {
    transform,
    touchDeltaX,
    isDragging,
    isPinching,
    reset,
    zoomHandlers: {
      handleZoomIn: () => handleZoom('in'),
      handleZoomOut: () => handleZoom('out'),
      handleZoomReset: () => handleZoom('reset'),
    },
    gestureHandlers: {
      onWheel: isImage ? handleWheel : undefined,
      onDoubleClick: isImage ? handleDoubleClick : undefined,
      onMouseDown: isImage ? handleMouseDown : undefined,
      onMouseMove: isImage ? handleMouseMove : undefined,
      onMouseUp: endDrag,
      onMouseLeave: endDrag,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
};