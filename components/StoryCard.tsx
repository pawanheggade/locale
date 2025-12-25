
import React from 'react';
import { DisplayableStoryPost } from '../types';
import { Avatar } from './Avatar';

export const StoryCard: React.FC<{ story: DisplayableStoryPost; onClick: () => void; }> = ({ story, onClick }) => (
    <div
        className="relative aspect-[9/16] bg-gray-100 rounded-xl overflow-hidden cursor-pointer group"
        onClick={onClick}
    >
        {story.media.type === 'image' ? (
            <img src={story.media.url} alt={`Story by ${story.author?.name}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
        ) : (
             <video src={story.media.url} className="w-full h-full object-cover" muted playsInline />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {story.author && (
            <div className="absolute bottom-2 left-2 flex items-center gap-2">
                <Avatar src={story.author.avatarUrl} alt={story.author.name} size="xs" />
                <span className="text-white text-xs font-bold drop-shadow">{story.author.name}</span>
            </div>
        )}
    </div>
);
