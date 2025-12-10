
import React, { useState } from 'react';
import { Button, ButtonProps } from './ui/Button';
import { HeartIcon } from './Icons';
import { cn } from '../lib/utils';

interface LikeButtonProps extends Omit<ButtonProps, 'onClick'> {
  isLiked: boolean;
  onToggle: () => void;
  includeLabel?: boolean;
  iconClassName?: string;
  icon?: React.FC<{ className?: string; isFilled?: boolean }>;
}

export const LikeButton: React.FC<LikeButtonProps> = ({ 
  isLiked, 
  onToggle, 
  className, 
  variant = 'ghost', 
  size = 'icon', 
  includeLabel = false,
  iconClassName = "w-5 h-5",
  icon: Icon = HeartIcon,
  children,
  ...props 
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLiked) {
      setIsAnimating(true);
    }
    onToggle();
  };

  return (
    <Button
      onClick={handleClick}
      onAnimationEnd={() => setIsAnimating(false)}
      variant={variant}
      size={size}
      className={cn(
        isAnimating && "animate-like-pop",
        className
      )}
      aria-label={isLiked ? 'Unlike' : 'Like'}
      title={isLiked ? 'Unlike' : 'Like'}
      aria-pressed={isLiked}
      {...props}
    >
      <Icon isFilled={isLiked} className={iconClassName} />
      {includeLabel && <span>{isLiked ? 'Liked' : 'Like'}</span>}
      {children}
    </Button>
  );
};
