import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Media } from '../types';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, ZoomInIcon, ZoomOutIcon, ArrowUturnLeftIcon } from './Icons';
import { useCarousel } from '../hooks/useCarousel';
import { useImageViewerGestures } from '../hooks/useImageViewerGestures';
import { Button } from './ui/Button';
import { Dialog, DialogContent } from './ui/Dialog';

interface MediaViewerModalProps {
  media: Media[];
  startIndex?: number;
  onClose: () => void;
}

export const MediaViewerModal: React.FC<MediaViewerModalProps> = ({ media, startIndex = 0, onClose }) => {
  const { currentIndex, goToNext, goToPrevious } = useCarousel({ itemCount: media.length, initialIndex: startIndex });
  const imageRef = useRef<HTMLImageElement>(null);
  const currentMedia = media[currentIndex];

  const {
    transform,
    touchDeltaX,
    isDragging,
    isPinching,
    reset: resetGestures,
    zoomHandlers,
    gestureHandlers,
  } = useImageViewerGestures({
    imageRef,
    isImage: currentMedia?.type === 'image',
    itemCount: media.length,
    goToNext,
    goToPrevious,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      else if (e.key === 'ArrowRight') goToNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [goToPrevious, goToNext]);

  useEffect(() => {
    // Reset gestures when media changes
    resetGestures();
  }, [currentIndex, resetGestures]);

  if (!currentMedia) return null;

  const isImage = currentMedia.type === 'image';

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="w-full h-full max-w-full max-h-full bg-black/95 p-4 border-0 rounded-none"
        trapFocus={true}
        aria-label="Media viewer"
      >
        <div
          className="relative w-full h-full flex justify-center items-center overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          {...gestureHandlers}
          style={{
              cursor: isImage && transform.scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
              touchAction: 'none',
          }}
        >
          {isImage ? (
            <img
              ref={imageRef}
              src={currentMedia.url}
              alt="Enlarged view"
              className="w-auto h-auto max-w-full max-h-[90vh] object-contain"
              style={{
                transform: `translate(calc(${transform.positionX}px + ${touchDeltaX}px), ${transform.positionY}px) scale(${transform.scale})`,
                transition: isDragging || touchDeltaX !== 0 || isPinching ? 'none' : 'transform 0.2s ease-out',
              }}
              draggable="false"
              onDoubleClick={gestureHandlers.onDoubleClick}
            />
          ) : (
            <video
              src={currentMedia.url}
              className="w-full max-h-[90vh] object-contain rounded-lg"
              controls
              autoPlay
              style={{
                  transform: `translateX(${touchDeltaX}px)`,
                  transition: touchDeltaX !== 0 ? 'none' : 'transform 0.2s ease-out',
              }}
            />
          )}
        </div>

        {media.length > 1 && (
          <>
              <Button variant="overlay" size="icon-lg" onClick={(e) => { e.stopPropagation(); goToPrevious(); }} className="absolute left-4 top-1/2 -translate-y-1/2 z-10" aria-label="Previous media" title="Previous"><ChevronLeftIcon className="w-8 h-8"/></Button>
              <Button variant="overlay" size="icon-lg" onClick={(e) => { e.stopPropagation(); goToNext(); }} className="absolute right-4 top-1/2 -translate-y-1/2 z-10" aria-label="Next media" title="Next"><ChevronRightIcon className="w-8 h-8"/></Button>
          </>
        )}

        {isImage && (
          <div className="absolute bottom-6 right-6 flex items-center space-x-2 p-1 rounded-full z-10 bg-black/50">
            <Button variant="overlay" size="icon" onClick={(e) => { e.stopPropagation(); zoomHandlers.handleZoomOut(); }} aria-label="Zoom out" title="Zoom out" disabled={transform.scale <= 1}><ZoomOutIcon className="w-6 h-6"/></Button>
            <Button variant="overlay" size="icon" onClick={(e) => { e.stopPropagation(); zoomHandlers.handleZoomReset(); }} aria-label="Reset zoom" title="Reset zoom" disabled={transform.scale === 1}><ArrowUturnLeftIcon className="w-6 h-6"/></Button>
            <Button variant="overlay" size="icon" onClick={(e) => { e.stopPropagation(); zoomHandlers.handleZoomIn(); }} aria-label="Zoom in" title="Zoom in" disabled={transform.scale >= 5}><ZoomInIcon className="w-6 h-6"/></Button>
          </div>
        )}

        <Button variant="overlay" size="icon" onClick={(e) => { e.stopPropagation(); onClose(); }} className="absolute top-4 right-4 z-10" aria-label="Close" title="Close">
          <XMarkIcon className="w-6 h-6"/>
        </Button>
      </DialogContent>
    </Dialog>
  );
};