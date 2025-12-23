
import React from 'react';
import { useStory } from '../contexts/StoryContext';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { Avatar } from './Avatar';
import { PlusIcon } from './Icons';
import { cn } from '../lib/utils';
import { useNavigation } from '../contexts/NavigationContext';

const StoryReelItem: React.FC<{
  userId: string;
  isAllViewed: boolean;
  onClick: () => void;
}> = ({ userId, isAllViewed, onClick }) => {
    const { accountsById } = useAuth();
    const author = accountsById.get(userId);

    if (!author) return null;

    const ringClass = isAllViewed
        ? 'ring-gray-300'
        : 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500';

    return (
        <div className="flex-shrink-0 cursor-pointer group" onClick={onClick}>
            <div className={cn("rounded-full p-0.5", ringClass)}>
                <div className="bg-white p-0.5 rounded-full">
                    <Avatar 
                        src={author.avatarUrl} 
                        alt={author.name}
                        size="md"
                        className="w-9 h-9 group-active:scale-95 transition-transform"
                    />
                </div>
            </div>
        </div>
    );
};

export const StoryReel: React.FC = () => {
    const { activeStoriesByUser } = useStory();
    const { currentAccount } = useAuth();
    const { openModal } = useUI();
    const { navigateTo } = useNavigation();

    if (!currentAccount || activeStoriesByUser.size === 0) {
        return null;
    }

    const usersWithStories = Array.from(activeStoriesByUser.keys())
      .map(userId => ({
          userId,
          stories: activeStoriesByUser.get(userId)!,
          author: currentAccount?.id === userId,
      }))
      .sort((a, b) => (b.author ? 1 : 0) - (a.author ? 1 : 0));

    const handleStoryClick = (userIndex: number) => {
        const users = usersWithStories.map(u => u.stories[0].author!).filter(Boolean);
        openModal({ type: 'storyViewer', data: { usersWithStories: users, initialUserIndex: userIndex }});
    };
    
    const handleCreateStory = () => {
        navigateTo('createStoryPost');
    };

    return (
        <div className="w-full bg-white border-b border-gray-200/80 px-4 pt-3 pb-4">
            <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar">
                {/* Create Story Button */}
                {(currentAccount.subscription.tier !== 'Personal') && (
                    <div className="flex-shrink-0 cursor-pointer group" onClick={handleCreateStory}>
                         <div className="relative w-11 h-11 flex items-center justify-center">
                            <Avatar src={currentAccount.avatarUrl} alt="Your Story" size="md" className="w-9 h-9 group-active:scale-95 transition-transform" />
                            <div className="absolute bottom-0 right-0 bg-red-600 rounded-full w-5 h-5 flex items-center justify-center text-white border-2 border-white">
                                <PlusIcon className="w-3 h-3" strokeWidth={3} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Other Users' Stories */}
                {usersWithStories.map(({ userId, stories }, index) => {
                    const isAllViewed = stories.every(s => s.viewedBy.includes(currentAccount.id));
                    return (
                        <StoryReelItem 
                            key={userId} 
                            userId={userId} 
                            isAllViewed={isAllViewed}
                            onClick={() => handleStoryClick(index)}
                        />
                    );
                })}
            </div>
        </div>
    );
};
