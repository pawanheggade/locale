import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from './Icons';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';

interface VoteButtonsProps {
  score: number;
  userVote: 'up' | 'down' | null;
  onVote: (vote: 'up' | 'down') => void;
  orientation?: 'vertical' | 'horizontal';
}

export const VoteButtons: React.FC<VoteButtonsProps> = ({ score, userVote, onVote, orientation = 'vertical' }) => {
  const containerClasses = orientation === 'vertical' ? 'flex flex-col items-center gap-0.5' : 'flex items-center gap-2';
  const scoreClasses = orientation === 'vertical' ? 'text-sm my-0.5' : 'min-w-[1.5rem] text-center text-sm';

  return (
    <div className={cn(containerClasses, 'flex-shrink-0')}>
      <Button
        onClick={(e) => { e.stopPropagation(); onVote('up'); }}
        variant="ghost"
        size="icon-sm"
        className={cn(
          "rounded transition-colors",
          userVote === 'up'
            ? 'text-red-600 bg-red-50'
            : 'text-gray-400'
        )}
        aria-pressed={userVote === 'up'}
        aria-label="Upvote"
      >
        <ArrowUpIcon className="w-5 h-5" />
      </Button>
      <span className={cn('font-bold text-gray-700', scoreClasses)}>{score}</span>
      <Button
        onClick={(e) => { e.stopPropagation(); onVote('down'); }}
        variant="ghost"
        size="icon-sm"
        className={cn(
          "rounded transition-colors",
          userVote === 'down'
            ? 'text-red-600 bg-red-50'
            : 'text-gray-400'
        )}
        aria-pressed={userVote === 'down'}
        aria-label="Downvote"
      >
        <ArrowDownIcon className="w-5 h-5" />
      </Button>
    </div>
  );
};