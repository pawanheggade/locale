
import React from 'react';
import { useUI } from '../contexts/UIContext';
import { CheckIcon, AlertIcon, XMarkIcon } from './Icons';
import { cn } from '../lib/utils';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUI();

  return (
    <div 
        className="fixed top-20 left-0 right-0 z-[2100] flex flex-col items-center gap-2 pointer-events-none px-4"
        role="region" 
        aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-full shadow-lg border animate-fade-in-up max-w-sm w-full sm:w-auto min-w-[200px]",
            toast.type === 'error' 
                ? "bg-red-50 border-red-200 text-red-800" 
                : "bg-gray-900 text-white border-gray-800"
          )}
        >
          <div className="flex-shrink-0">
            {toast.type === 'error' ? (
                <AlertIcon className="w-5 h-5" />
            ) : (
                <CheckIcon className="w-5 h-5 text-green-400" />
            )}
          </div>
          <p className="text-sm font-medium flex-grow text-center sm:text-left">{toast.message}</p>
          {toast.onUndo ? (
              <button 
                onClick={toast.onUndo} 
                className="text-sm font-bold underline ml-2 hover:opacity-80"
              >
                  Undo
              </button>
          ) : (
              <button 
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 hover:opacity-70 transition-opacity ml-1"
                aria-label="Dismiss"
              >
                  <XMarkIcon className="w-4 h-4 opacity-60" />
              </button>
          )}
        </div>
      ))}
    </div>
  );
};
