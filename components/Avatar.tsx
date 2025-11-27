
import React, { useState, useEffect } from 'react';
import { Subscription } from '../types';
import { UserCircleIconSolid } from './Icons';
import { cn, TIER_STYLES } from '../lib/utils';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  tier?: Subscription['tier'];
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

const sizeClasses = {
  xs: 'w-5 h-5',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
  '2xl': 'w-24 h-24',
  '3xl': 'w-32 h-32',
};

export const Avatar: React.FC<AvatarProps> = ({ src, alt = 'Avatar', size = 'md', tier, className, onClick }) => {
  const [error, setError] = useState(false);
  
  useEffect(() => {
      setError(false);
  }, [src]);

  // Determine ring class based on tier styles
  let ringClass = '';
  if (tier && TIER_STYLES[tier]) {
      const styles = TIER_STYLES[tier];
      if (tier === 'Organisation') {
          ringClass = `ring-4 ${styles.ringColor} ring-offset-2 ring-offset-white`;
      } else if (tier === 'Verified' || tier === 'Business') {
          ringClass = `ring-2 ${styles.ringColor} ring-offset-2 ring-offset-white`;
      }
  }
  
  const baseClasses = cn(
    'rounded-full object-cover flex-shrink-0 bg-gray-200 transition-opacity duration-300',
    sizeClasses[size],
    ringClass,
    className
  );

  if (!src || error) {
    return (
      <UserCircleIconSolid 
        className={cn('text-gray-400 bg-gray-100 rounded-full', sizeClasses[size], ringClass, className)} 
        title={alt}
        onClick={onClick}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={baseClasses}
      onError={() => setError(true)}
      onClick={onClick}
    />
  );
};
