
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Account, DisplayableStoryPost } from '../types';
import { useStory } from '../contexts/StoryContext';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { Avatar } from './Avatar';
import { XMarkIcon, PaperAirplaneIcon, HeartIcon, PencilIcon, TrashIcon } from './Icons';
import { Button } from './ui/Button';
import { timeSince } from '../utils/formatters';
import { useIsMounted } from '../hooks/useIsMounted';
import { cn, isShareAbortError } from '../lib/utils';
import { useNavigation } from '../contexts/NavigationContext';
import { LikeButton } from './LikeButton';
import { useConfirmationModal } from '../hooks/useConfirmationModal';

const STORY_DURATION = 5000; // 5 seconds per story

interface StoryViewerModalProps {
  usersWithStories: Account[];
  initialUserIndex: number;
  initialStoryId?: string;
  onClose: () => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({ usersWithStories, initialUserIndex, initialStoryId, onClose }) => {
  const { activeStoriesByUser, markStoryAsViewed, toggleLikeStory, deleteStory } = useStory();
  const { currentAccount } = useAuth();
  const { openModal } = useUI();
  const { navigateTo } = useNavigation();
  const isMounted = useIsMounted();
  const showConfirmation = useConfirmationModal();

  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentUser = usersWithStories[currentUserIndex];
  const userStories = currentUser ? activeStoriesByUser.get(currentUser.id) : [];
  const activeStory = userStories ? userStories[currentStoryIndex] : null;

  const goToNextStory = useCallback(() => {
    if (!userStories || currentStoryIndex >= userStories.length - 1) {
      // Go to next user
      if (currentUserIndex < usersWithStories.length - 1) {
        setCurrentUserIndex(prev => prev + 1);
        setCurrentStoryIndex(0);
      } else {
        onClose(); // End of all stories
      }
    } else {
      // Go to next story for the same user
      setCurrentStoryIndex(prev => prev + 1);
    }
  }, [currentStoryIndex, currentUserIndex, usersWithStories, userStories, onClose]);
  
  const goToPrevStory = useCallback(() => {
    if (currentStoryIndex <= 0) {
        // Go to prev user
        if (currentUserIndex > 0) {
            setCurrentUserIndex(prev => prev - 1);
            // Go to the last story of the previous user
            const prevUserStories = activeStoriesByUser.get(usersWithStories[currentUserIndex - 1].id) || [];
            setCurrentStoryIndex(prevUserStories.length - 1);
        }
    } else {
        // Go to prev story for same user
        setCurrentStoryIndex(prev => prev - 1);
    }
  }, [currentStoryIndex, currentUserIndex, activeStoriesByUser, usersWithStories]);

  useEffect(() => {
    if (activeStory && !isPaused) {
      timerRef.current = setTimeout(goToNextStory, STORY_DURATION);
      
      if (currentAccount && !activeStory.viewedBy.includes(currentAccount.id)) {
        markStoryAsViewed(activeStory.id);
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeStory, isPaused, goToNextStory, markStoryAsViewed, currentAccount]);
  
  useEffect(() => {
      const initialUserStories = activeStoriesByUser.get(usersWithStories[initialUserIndex]?.id) || [];
      let startIndex = 0;
      if (initialStoryId) { // Prioritize starting at a specific story
          const specificIndex = initialUserStories.findIndex(s => s.id === initialStoryId);
          if (specificIndex !== -1) {
              startIndex = specificIndex;
          }
      } else { // Fallback to first unread
          const firstUnreadIndex = initialUserStories.findIndex(s => !s.viewedBy.includes(currentAccount?.id || ''));
          if (firstUnreadIndex !== -1) {
              startIndex = firstUnreadIndex;
          }
      }
      setCurrentStoryIndex(startIndex);
  }, [initialUserIndex, initialStoryId, usersWithStories, activeStoriesByUser, currentAccount]);

  const handlePointerDown = () => setIsPaused(true);
  const handlePointerUp = () => setIsPaused(false);
  
  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, currentTarget } = e;
    const { left, width } = currentTarget.getBoundingClientRect();
    const tapPosition = (clientX - left) / width;
    
    if (tapPosition < 0.3) { // Left 30%
        goToPrevStory();
    } else { // Right 70%
        goToNextStory();
    }
  };

  const handleShare = async () => {
    if (!activeStory) return;
    const shareUrl = `${window.location.origin}/?story=${activeStory.id}`; // This URL won't work but is a placeholder
    const shareData = {
        title: `Story from ${currentUser.name}`,
        text: `Check out this story from ${currentUser.name} on Locale!`,
        url: shareUrl,
    };
    try {
        await navigator.share(shareData);
    } catch(err) {
        if(!isShareAbortError(err)) console.error("Share failed", err);
    }
  };
  
  const handleViewPost = () => {
    if (activeStory?.linkPost) {
        onClose(); // Close story modal first
        setTimeout(() => openModal({ type: 'viewPost', data: activeStory.linkPost! }), 300);
    }
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop story tap navigation
    if (currentUser) {
      onClose();
      navigateTo('account', { account: currentUser });
    }
  };

  if (!currentUser || !activeStory) {
    return null; // Or a loading state
  }
  
  const isVideo = activeStory.media.type === 'video';
  const isLiked = currentAccount && activeStory.likedBy.includes(currentAccount.id);
  const isOwnStory = currentAccount?.id === activeStory.authorId;
  const footerContent = activeStory.description || activeStory.linkPost;
  
  const handleEdit = () => {
    if (!isOwnStory || !activeStory) return;
    onClose();
    navigateTo('editStory', { storyId: activeStory.id });
  };
  
  const handleDelete = () => {
    if (!isOwnStory || !activeStory) return;
    showConfirmation({
        title: 'Delete Story',
        message: 'Are you sure you want to permanently delete this story?',
        onConfirm: () => {
            deleteStory(activeStory.id);
            goToNextStory();
        },
        confirmText: 'Delete',
        confirmClassName: 'bg-red-600 text-white',
    });
  };
  
  return (
    <div className="fixed inset-0 z-[4000] bg-black/90 flex items-center justify-center animate-zoom-in" onClick={handleTap}>
        <div className="absolute top-0 left-0 right-0 p-4 z-20" onPointerDown={e => e.stopPropagation()} onPointerUp={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2">
                {userStories.map((story, index) => (
                    <div key={story.id} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                        <div className={cn("h-full bg-white transition-all duration-200", index < currentStoryIndex && "w-full", index > currentStoryIndex && "w-0")}
                             style={{
                                 animation: (index === currentStoryIndex && !isPaused) ? `fill-progress ${STORY_DURATION}ms linear` : 'none',
                                 animationPlayState: isPaused ? 'paused' : 'running',
                                 width: index === currentStoryIndex ? undefined : (index < currentStoryIndex ? '100%' : '0%')
                             }}
                        />
                    </div>
                ))}
            </div>
             <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-3 cursor-pointer" onClick={handleProfileClick}>
                    <Avatar src={currentUser.avatarUrl} alt={currentUser.name} size="md" />
                    <div>
                        <p className="font-bold text-white text-sm">{currentUser.name}</p>
                        <p className="text-xs text-gray-300">{timeSince(activeStory.timestamp)}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    {isOwnStory && <Button variant="overlay" size="icon-sm" onClick={(e) => { e.stopPropagation(); handleEdit(); }}><PencilIcon className="w-5 h-5"/></Button>}
                    {isOwnStory && <Button variant="overlay" size="icon-sm" onClick={(e) => { e.stopPropagation(); handleDelete(); }}><TrashIcon className="w-5 h-5"/></Button>}
                    {navigator.share && <Button variant="overlay" size="icon-sm" onClick={handleShare}><PaperAirplaneIcon className="w-5 h-5"/></Button>}
                    <LikeButton isLiked={!!isLiked} onToggle={() => toggleLikeStory(activeStory.id)} variant="overlay" size="icon-sm" />
                    <Button variant="overlay" size="icon-sm" onClick={onClose}><XMarkIcon className="w-6 h-6"/></Button>
                 </div>
            </div>
        </div>
      
        <div className="relative w-full h-full max-w-lg aspect-[9/16] max-h-screen" onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
            {isVideo ? (
                 <video
                    key={activeStory.id}
                    src={activeStory.media.url}
                    className="w-full h-full object-contain rounded-lg"
                    autoPlay
                    playsInline
                    muted
                    onEnded={goToNextStory}
                 />
            ) : (
                 <img src={activeStory.media.url} alt="Story" className="w-full h-full object-contain rounded-lg" />
            )}
        </div>
      
        {footerContent && (
             <div 
                className="absolute bottom-0 left-0 right-0 z-20 bg-black/50 backdrop-blur-lg animate-slide-in-up" 
                onPointerDown={e => e.stopPropagation()} 
                onPointerUp={e => e.stopPropagation()} 
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 flex flex-col items-center gap-3">
                    {activeStory.description && (
                        <p className="text-white font-medium text-sm text-center max-w-xl mx-auto">
                            {activeStory.description}
                        </p>
                    )}
                    {activeStory.linkPost && (
                        <Button variant="overlay" onClick={handleViewPost} className="bg-white/20 text-white backdrop-blur-md rounded-full px-6 py-3 font-semibold">
                            View Post
                        </Button>
                    )}
                </div>
            </div>
        )}
      
      <style>{`
        @keyframes fill-progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};