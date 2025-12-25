import React from 'react';
import { cn } from '../lib/utils';
import { Card, CardContent } from './ui/Card';

interface PostCardSkeletonProps {
  variant?: 'default' | 'compact';
}

export const PostCardSkeleton: React.FC<PostCardSkeletonProps> = ({ variant = 'default' }) => {
  if (variant === 'compact') {
    return (
      <Card className="aspect-[4/5] animate-pulse">
        <div className="relative w-full h-full bg-gray-200">
          <div className="absolute top-0 left-0 right-0 p-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-300"></div>
              <div className="flex-1 space-y-1">
                <div className="h-3 w-1/2 rounded bg-gray-300"></div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-white/50 backdrop-blur-sm">
            <div className="h-3 w-4/5 rounded bg-gray-300 mb-1.5"></div>
            <div className="h-3 w-3/5 rounded bg-gray-300"></div>
            <div className="h-4 w-1/3 rounded bg-gray-300 mt-1.5"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="animate-pulse">
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-200"></div>
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-1/3 rounded bg-gray-200"></div>
            <div className="h-2 w-1/4 rounded bg-gray-200"></div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-gray-200"></div>
        </div>
      </div>

      {/* Media */}
      <div className="aspect-[4/3] bg-gray-200"></div>
      
      {/* Action Bar */}
      <div className="p-3 border-t border-gray-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-grow">
          <div className="w-9 h-9 rounded-xl bg-gray-200"></div>
          <div className="w-9 h-9 rounded-xl bg-gray-200"></div>
          <div className="w-9 h-9 rounded-xl bg-gray-200"></div>
          <div className="h-9 flex-1 rounded-xl bg-gray-200"></div>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="h-4 w-5/6 rounded bg-gray-200"></div>
          <div className="h-6 w-1/3 rounded bg-gray-200 mt-2"></div>
          <div className="h-3 w-full rounded bg-gray-200 mt-2"></div>
          <div className="h-3 w-2/3 rounded bg-gray-200"></div>
        </div>
      </CardContent>
    </Card>
  );
};
