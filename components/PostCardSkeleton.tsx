
import React from 'react';

export const PostCardSkeleton: React.FC<{ index: number }> = ({ index }) => (
    <div
      className="bg-white rounded-xl overflow-hidden flex flex-col animate-pulse"
      style={{ animationDelay: `${index * 75}ms`, animationDuration: '1.5s' }}
    >
      <div className="w-full bg-gray-300 aspect-[4/3]"></div>
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex-grow">
          <div className="h-5 bg-gray-300 rounded w-3/4 mb-3"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="flex justify-between items-center text-gray-600">
            <div className="flex items-center gap-2 w-full">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded-full w-16 flex-shrink-0"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mt-3"></div>
        </div>
        <div className="p-3 border-t mt-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-300 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-300 rounded w-2/3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mt-1.5"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
);
