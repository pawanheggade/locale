
import React from 'react';
import { SpinnerIcon } from '../Icons';

export const LoadingFallback: React.FC = () => (
    <div className="flex items-center justify-center h-full min-h-[50vh]">
        <SpinnerIcon className="w-8 h-8 text-red-600 animate-spin" />
    </div>
);
