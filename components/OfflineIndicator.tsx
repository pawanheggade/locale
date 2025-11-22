
import React, { useState, useEffect } from 'react';
import { CloudSlashIcon } from './Icons';

export const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white px-4 py-3 z-[5000] flex items-center justify-center gap-2 animate-slide-in-up shadow-lg">
      <CloudSlashIcon className="w-5 h-5 text-gray-400" />
      <span className="text-sm font-medium">You are offline. Some features may be unavailable.</span>
    </div>
  );
};
