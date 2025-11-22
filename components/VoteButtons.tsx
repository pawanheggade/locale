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
  const containerClasses = orientation === 'vertical' ? 'flex flex-col items-center gap-1' : 'flex items-center gap-1';
  const scoreClasses = orientation === 'vertical' ? '' : 'min-w-[2.5rem] text-center';

  return (
    <div className={cn(containerClasses, 'flex-shrink-0')}>
      <Button
        variant="glass"
        size="icon-sm"
        onClick={(e) => { e.stopPropagation(); onVote('up'); }}
        className={cn(
          userVote === 'up'
            ? 'bg-red-100 text-red-600'
            : 'text-gray-500'
        )}
        aria-pressed={userVote === 'up'}
        aria-label="Upvote"
      >
        <ArrowUpIcon className="w-5 h-5" />
      </Button>
      <span className={cn('font-bold text-gray-800 text-sm', scoreClasses)}>{score}</span>
      <Button
        variant="glass"
        size="icon-sm"
        onClick={(e) => { e.stopPropagation(); onVote('down'); }}
        className={cn(
          userVote === 'down'
            ? 'bg-red-100 text-red-600'
            : 'text-gray-500'
        )}
        aria-pressed={userVote === 'down'}
        aria-label="Downvote"
      >
        <ArrowDownIcon className="w-5 h-5" />
      </Button>
    </div>
  );
};