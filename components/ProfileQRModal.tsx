
import React, { useRef, useMemo } from 'react';
import { Account } from '../types';
import ModalShell from './ModalShell';
import { Button } from './ui/Button';
import { Avatar } from './Avatar';
import { ShareIcon } from './Icons';
import { useUI } from '../contexts/UIContext';
import { SubscriptionBadge } from './SubscriptionBadge';

interface ProfileQRModalProps {
  account: Account;
  onClose: () => void;
}

export const ProfileQRModal: React.FC<ProfileQRModalProps> = ({ account, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { addToast } = useUI();

  // Generate URL to the profile (simplified for this implementation)
  const profileUrl = `${window.location.origin}/?account=${account.id}`;
  const encodedUrl = encodeURIComponent(profileUrl);
  
  // Use a high error correction level (H) so the center image doesn't break scanning
  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodedUrl}&ecc=H&margin=10&color=000000&bgcolor=FFFFFF`;

  const colorClasses = useMemo(() => {
      switch (account.subscription.tier) {
          case 'Verified': return { border: 'border-red-500', footer: 'bg-red-500' };
          case 'Business': return { border: 'border-amber-500', footer: 'bg-amber-500' };
          case 'Business Pro': return { border: 'border-amber-600', footer: 'bg-amber-600' };
          default: return { border: 'border-black', footer: 'bg-black' };
      }
  }, [account.subscription.tier]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out ${account.name} on Locale`,
          text: `Scan this QR code to visit ${account.name}'s profile on Locale.`,
          url: profileUrl,
        });
      } catch (error: any) {
        // Robustly ignore AbortError (user cancelled)
        const isAbort = error.name === 'AbortError' || 
                        (typeof error.message === 'string' && (
                            error.message.toLowerCase().includes('abort') || 
                            error.message.toLowerCase().includes('cancel')
                        )) ||
                        (typeof error === 'string' && (
                            error.toLowerCase().includes('abort') ||
                            error.toLowerCase().includes('cancel')
                        ));
        if (!isAbort) {
            console.error('Error sharing:', error);
        }
      }
    } else {
      navigator.clipboard.writeText(profileUrl);
      addToast('Profile link copied to clipboard!', 'success');
    }
  };

  const renderFooter = () => (
    <div className="flex w-full justify-between gap-3">
        <Button variant="glass" onClick={onClose}>Close</Button>
        <Button variant="glass-red" onClick={handleShare} className="gap-2 flex-1">
            <ShareIcon className="w-5 h-5" />
            Share Profile
        </Button>
    </div>
  );

  return (
    <ModalShell
      panelRef={modalRef}
      onClose={onClose}
      title="Profile Code"
      footer={renderFooter()}
      panelClassName="w-full max-w-sm"
      titleId="profile-qr-title"
    >
      <div className="p-6 flex flex-col items-center justify-center bg-gray-50">
        
        {/* The Card Container */}
        <div className={`w-full max-w-[280px] bg-white border-4 ${colorClasses.border} rounded-3xl overflow-hidden shadow-2xl flex flex-col transform transition-transform hover:scale-[1.02]`}>
            
            {/* Card Body */}
            <div className="p-8 flex flex-col items-center bg-white">
                <div className="relative w-full aspect-square mb-5">
                    {/* QR Code Image */}
                    <img 
                        src={qrCodeApiUrl} 
                        alt={`QR Code for ${account.name}`} 
                        className="w-full h-full object-contain"
                    />
                    
                    {/* Centered Profile Picture Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="p-1.5 bg-white rounded-full shadow-sm">
                            <Avatar 
                                src={account.avatarUrl} 
                                alt={account.name} 
                                size="md"
                                className="w-12 h-12" 
                            />
                        </div>
                    </div>
                </div>

                <div className="text-center space-y-1">
                    <div className="flex items-center justify-center gap-1.5 px-1">
                        <h2 className="text-xl font-bold text-gray-900 leading-tight break-words line-clamp-2">{account.name}</h2>
                        <div className="flex-shrink-0">
                            <SubscriptionBadge tier={account.subscription.tier} iconOnly />
                        </div>
                    </div>
                    <div className="flex items-center justify-center gap-1.5">
                        <p className="text-sm text-gray-500 font-medium">@{account.username}</p>
                    </div>
                </div>
            </div>

            {/* Card Footer */}
            <div className={`${colorClasses.footer} p-5 flex justify-center items-center`}>
                <h1 className="text-3xl font-bold text-white tracking-tighter">locale</h1>
            </div>
        </div>

      </div>
    </ModalShell>
  );
};
