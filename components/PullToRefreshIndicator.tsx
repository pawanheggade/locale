

import React from 'react';
import { ArrowDownIcon, SpinnerIcon } from './Icons';

interface PullToRefreshIndicatorProps {
  pullPosition: number;
  isRefreshing: boolean;
  pullThreshold: number;
  isPulling: boolean;
}

const PULL_ICON_SIZE = 40;
const CIRCLE_RADIUS = 16;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

const PullToRefreshIndicator: React.FC<PullToRefreshIndicatorProps> = ({
  pullPosition,
  isRefreshing,
  pullThreshold,
  isPulling,
}) => {
  const pullProgress = Math.min(pullPosition / pullThreshold, 1);
  const strokeDashoffset = CIRCLE_CIRCUMFERENCE * (1 - pullProgress);
  const isReadyToRefresh = pullPosition >= pullThreshold;

  return (
    <div
      className="absolute top-0 left-0 right-0 h-20 flex justify-center items-end pb-4 pointer-events-none z-50"
      aria-hidden="true"
      style={{
        transform: `translateY(${isRefreshing ? pullThreshold : pullPosition}px)`,
        transition: !isPulling ? 'transform 0.3s ease-in-out' : 'none',
      }}
    >
      <div
        className="flex items-center justify-center bg-white rounded-full transition-transform duration-200"
        style={{
          width: `${PULL_ICON_SIZE}px`,
          height: `${PULL_ICON_SIZE}px`,
          transform: `scale(${isRefreshing ? 1 : Math.min(1, pullProgress * 1.2)})`,
          opacity: isRefreshing ? 1 : Math.min(1, pullProgress * 1.5),
        }}
      >
        {isRefreshing ? (
          <SpinnerIcon className="w-6 h-6 text-red-500" />
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            <svg
              className="absolute w-full h-full transform -rotate-90"
              viewBox="0 0 36 36"
            >
              <circle
                cx="18"
                cy="18"
                r={CIRCLE_RADIUS}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-300"
              />
              <circle
                cx="18"
                cy="18"
                r={CIRCLE_RADIUS}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={CIRCLE_CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="text-red-500 transition-all duration-100"
              />
            </svg>
            <div
              className="transition-transform duration-300"
              style={{
                transform: `rotate(${isReadyToRefresh ? '180deg' : '0deg'})`,
              }}
            >
              <ArrowDownIcon
                className="w-5 h-5 text-gray-600"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PullToRefreshIndicator;
