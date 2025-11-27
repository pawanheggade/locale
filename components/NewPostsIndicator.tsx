import React from 'react';
import { ArrowUpIcon } from './Icons';
import { Button } from './ui/Button';

interface NewPostsIndicatorProps {
  onClick: () => void;
}

export const NewPostsIndicator: React.FC<NewPostsIndicatorProps> = ({ onClick }) => {
  return (
    <div className="sticky top-20 z-50 flex justify-center py-2 pointer-events-none animate-fade-in-up">
      <Button
        onClick={onClick}
        variant="pill-red"
        className="pointer-events-auto flex items-center gap-2 font-semibold"
        aria-label="Show new posts"
      >
        <ArrowUpIcon className="w-5 h-5" />
        <span>New Posts</span>
      </Button>
    </div>
  );
};