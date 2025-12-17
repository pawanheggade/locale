import React from 'react';
import { createPortal } from 'react-dom';
import { useLoading } from '../contexts/LoadingContext';
import { SpinnerIcon } from './Icons';

export const GlobalLoadingIndicator: React.FC = () => {
    const { isLoading } = useLoading();

    if (!isLoading) {
        return null;
    }

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-white/50 backdrop-blur-sm flex items-center justify-center animate-fade-in" aria-live="assertive" role="alert">
            <SpinnerIcon className="w-10 h-10 text-red-600" />
        </div>,
        document.body
    );
};
