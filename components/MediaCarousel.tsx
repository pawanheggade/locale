import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Media } from '../types';
import { useCarousel } from '../hooks/useCarousel';
import { ChevronLeftIcon, ChevronRightIcon, SpinnerIcon } from './Icons';
import { Button } from './ui/Button';
import { STORAGE_KEYS } from '../lib/constants';

interface MediaCarouselProps {
    id: string;
    media: Media[];
    className?: string;
    slideClassName?: string;
    aspectRatio?: string;
    maxHeight?: string;
    onMediaClick?: (startIndex: number) => void;
    isInView?: boolean;
    videoThumbnails?: Record<string, { url: string | null; error: boolean }>;
    defaultMuted?: boolean;
    loop?: boolean;
}

const ImageWithLoader: React.FC<{ src: string; alt: string; className: string }> = ({ src, alt, className }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        setHasError(false);
    }, [src]);

    return (
        <div className="w-full h-full flex items-center justify-center relative">
            {isLoading && <SpinnerIcon className="w-8 h-8 text-gray-400 absolute" />}
            {hasError && (
                <div className="absolute flex flex-col items-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-xs mt-1">Image Error</span>
                </div>
            )}
            <img
                src={src}
                alt={alt}
                className={`${className} transition-opacity ${isLoading || hasError ? 'opacity-0' : 'opacity-100'}`}
                loading="lazy"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                    setIsLoading(false);
                    setHasError(true);
                }}
            />
        </div>
    );
};

const VideoWithLoader: React.FC<{ 
    src: string; 
    poster?: string; 
    className: string; 
    videoRef: (el: HTMLVideoElement | null) => void;
    defaultMuted?: boolean;
    loop?: boolean; 
}> = ({ src, poster, className, videoRef, defaultMuted, loop }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const internalRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        setIsLoaded(false);
    }, [src]);

    const setRef = useCallback((el: HTMLVideoElement | null) => {
        internalRef.current = el;
        videoRef(el);
        
        if (el && el.readyState >= 2) {
            setIsLoaded(true);
        }
    }, [videoRef]);

    return (
        <div className="w-full h-full relative flex items-center justify-center bg-black">
            <video
                ref={setRef}
                src={src}
                poster={poster}
                className={className}
                muted={defaultMuted}
                loop={loop}
                playsInline
                preload="metadata"
                controls
                onLoadedData={() => setIsLoaded(true)}
                onCanPlay={() => setIsLoaded(true)}
            />
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <SpinnerIcon className="w-10 h-10 text-white/50 animate-spin" />
                </div>
            )}
        </div>
    );
};

export const MediaCarousel: React.FC<MediaCarouselProps> = ({
    id,
    media,
    className = 'bg-black',
    slideClassName = 'bg-black',
    aspectRatio = 'aspect-video',
    maxHeight,
    onMediaClick,
    isInView = true,
    videoThumbnails = {},
    defaultMuted = true,
    loop = true,
}) => {
    const getInitialIndex = () => {
        try {
            const savedState = localStorage.getItem(`${STORAGE_KEYS.MEDIA_CAROUSEL_PREFIX}${id}`);
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                if (typeof parsedState.currentIndex === 'number' && parsedState.currentIndex < media.length) {
                    return parsedState.currentIndex;
                }
            }
        } catch (error) {
            console.error('Error reading carousel state from localStorage:', error);
        }
        return 0;
    };
    
    const { currentIndex, goToNext, goToPrevious } = useCarousel({ itemCount: media.length, loop, initialIndex: getInitialIndex() });
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

    useEffect(() => {
        try {
            const stateToSave = JSON.stringify({ currentIndex });
            localStorage.setItem(`${STORAGE_KEYS.MEDIA_CAROUSEL_PREFIX}${id}`, stateToSave);
        } catch (error) {
            console.error('Error saving carousel state to localStorage:', error);
        }
    }, [currentIndex, id]);

    useEffect(() => {
        videoRefs.current = videoRefs.current.slice(0, media.length);
    }, [media]);

    useEffect(() => {
        videoRefs.current.forEach((videoEl, index) => {
            if (!videoEl) return;
            const isCurrentMedia = index === currentIndex;
            const shouldPlay = isInView && isCurrentMedia && defaultMuted && media[index]?.type === 'video';

            if (shouldPlay) {
                videoEl.play().catch(e => console.warn("Video autoplay failed:", e));
            } else {
                if (!videoEl.paused) {
                    videoEl.pause();
                }
            }
        });
    }, [isInView, currentIndex, media, defaultMuted]);

    const handleMediaItemClick = () => {
        if (onMediaClick) {
            onMediaClick(currentIndex);
        }
    };

    const handlePreviousClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        goToPrevious();
    };

    const handleNextClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        goToNext();
    };

    if (!media || media.length === 0) {
        return (
            <div className={`${aspectRatio} ${className} w-full flex items-center justify-center text-gray-500`}>
                No Media
            </div>
        );
    }

    return (
        <div className={`relative group ${className} ${aspectRatio} w-full overflow-hidden`}>
            <div
                className="flex h-full transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {media.map((item, index) => (
                    <div 
                        key={index} 
                        className={`w-full h-full flex-shrink-0 flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white ${slideClassName}`} 
                        onClick={handleMediaItemClick}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleMediaItemClick()}
                        tabIndex={onMediaClick ? 0 : -1}
                        role={onMediaClick ? "button" : undefined}
                        aria-label={onMediaClick ? `View media ${index + 1}` : undefined}
                    >
                        {item.type === 'image' ? (
                            <ImageWithLoader
                                src={item.url}
                                alt={`Media ${index + 1}`}
                                className={`w-auto h-auto max-w-full ${maxHeight || 'max-h-full'} object-contain`}
                            />
                        ) : (
                            <VideoWithLoader
                                src={item.url}
                                poster={videoThumbnails[item.url]?.url || ''}
                                className={`max-w-full max-h-full object-contain ${maxHeight || ''}`}
                                defaultMuted={defaultMuted}
                                loop={loop}
                                videoRef={(el) => { videoRefs.current[index] = el; }}
                            />
                        )}
                    </div>
                ))}
            </div>

            {media.length > 1 && (
                <>
                    <Button onClick={handlePreviousClick} variant="overlay" size="icon-sm" aria-label="Previous media" className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-white">
                        <ChevronLeftIcon className="w-6 h-6" />
                    </Button>
                    <Button onClick={handleNextClick} variant="overlay" size="icon-sm" aria-label="Next media" className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-white">
                        <ChevronRightIcon className="w-6 h-6" />
                    </Button>
                    <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/50 to-transparent pointer-events-none z-10 flex justify-center items-end pb-2">
                        <div className="flex space-x-2">
                            {media.map((_, index) => (
                                <div
                                    key={index}
                                    className={`w-2 h-2 rounded-full ${
                                        index === currentIndex ? 'bg-white scale-125' : 'bg-white/50'
                                    }`}
                                    aria-hidden="true"
                                />
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};