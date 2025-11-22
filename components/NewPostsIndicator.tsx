
import React from 'react';
import { ArrowUpIcon } from './Icons';

interface NewPostsIndicatorProps {
  onClick: () => void;
}

export const NewPostsIndicator: React.FC<NewPostsIndicatorProps> = ({ onClick }) => {
  return (
    <div className="sticky top-20 z-50 flex justify-center py-2 pointer-events-none animate-fade-in-up">
      <button
        onClick={onClick}
        className="pointer-events-auto flex items-center gap-2 px-4 py-2 glass-button-pill-red text-white font-semibold rounded-full shadow-lg transition-all active:scale-95"
        aria-label="Show new posts"
      >
        <ArrowUpIcon className="w-5 h-5" />
        <span>New Posts</span>
      </button>
    </div>
  );
};
