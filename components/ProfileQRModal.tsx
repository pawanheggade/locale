
import React, { useRef, useMemo, useState } from 'react';
import { Account } from '../types';
import ModalShell from './ModalShell';
import { Button } from './ui/Button';
import { ShareIcon, ArrowDownTrayIcon, SpinnerIcon } from './Icons';
import { useUI } from '../contexts/UIContext';

interface ProfileQRModalProps {
  account: Account;
  onClose: () => void;
}

const tierColors: Record<string, string> = {
    'Verified': '#ef4444',     // red-500
    'Business': '#f59e0b',     // amber-500
    'Organisation': '#d97706', // amber-600
    'Basic': '#111827',        // gray-900
    'Personal': '#111827'      // gray-900
};

// Helper to draw rounded rectangles on canvas
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export const ProfileQRModal: React.FC<ProfileQRModalProps> = ({ account, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { addToast } = useUI();
  const [isGenerating, setIsGenerating] = useState(false);

  const profileUrl = `${window.location.origin}/?account=${account.id}`;
  const encodedUrl = encodeURIComponent(profileUrl);
  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodedUrl}&ecc=H&margin=10&color=000000&bgcolor=FFFFFF`;

  const borderColor = useMemo(() => {
      switch (account.subscription.tier) {
          case 'Verified': return 'border-red-500';
          case 'Business': return 'border-amber-500';
          case 'Organisation': return 'border-amber-600';
          default: return 'border-gray-900';
      }
  }, [account.subscription.tier]);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context failed');

        // Configuration
        const scale = 3; // High resolution factor
        const cardWidth = 320;
        const padding = 24;
        const contentHeight = 480; 
        
        const width = cardWidth * scale;
        const height = contentHeight * scale;
        
        canvas.width = width;
        canvas.height = height;
        ctx.scale(scale, scale);

        // 1. White Background & Shape
        ctx.fillStyle = '#FFFFFF';
        // Fill entire canvas white first
        ctx.fillRect(0, 0, cardWidth, contentHeight); 
        
        // 2. Colored Border
        const tierColor = tierColors[account.subscription.tier] || '#111827';
        ctx.lineWidth = 5;
        ctx.strokeStyle = tierColor;
        // Inset border by half linewidth so it doesn't clip
        roundRect(ctx, 2.5, 2.5, cardWidth - 5, contentHeight - 5, 24); 
        ctx.stroke();

        // 3. Load & Draw QR Code
        const qrImg = new Image();
        qrImg.crossOrigin = 'anonymous';
        qrImg.src = qrCodeApiUrl;
        await new Promise((resolve, reject) => {
            qrImg.onload = resolve;
            qrImg.onerror = reject;
        });
        
        const qrSize = cardWidth - (padding * 2);
        ctx.drawImage(qrImg, padding, padding, qrSize, qrSize);

        // 4. Text (Name & Username)
        const textY = padding + qrSize + 16;
        ctx.textAlign = 'center';
        
        // Name
        ctx.font = 'bold 22px sans-serif';
        ctx.fillStyle = '#111827'; // gray-900
        ctx.fillText(account.name, cardWidth / 2, textY + 16);
        
        // Username
        ctx.font = '500 14px sans-serif';
        ctx.fillStyle = '#6b7280'; // gray-500
        ctx.fillText(`@${account.username}`, cardWidth / 2, textY + 40);

        // 5. Locale Logo (Divider removed, adjusted Y position)
        const logoY = textY + 94; 
        ctx.font = '500 20px sans-serif';
        ctx.fillStyle = '#000000'; // Black text
        
        const text = "locale";
        const textMeasure = ctx.measureText(text);
        const textX = (cardWidth - textMeasure.width) / 2;
        
        // Draw "locale"
        ctx.textAlign = 'left';
        ctx.fillText(text, textX, logoY);
        
        // Draw Triangle Icon under 'o'
        const lWidth = ctx.measureText('l').width;
        const oWidth = ctx.measureText('o').width;
        
        const triangleCenterX = textX + lWidth + (oWidth / 2) + 1; // Approx center of 'o'
        const triangleTopY = logoY + 6; 

        ctx.save();
        ctx.translate(triangleCenterX - 6, triangleTopY); // Center the 12px wide SVG
        
        ctx.beginPath();
        // Triangle Path: M2 2L6 10L10 2H2Z combined with M1 7H11
        ctx.moveTo(2, 2);
        ctx.lineTo(6, 10);
        ctx.lineTo(10, 2);
        ctx.lineTo(2, 2);
        
        ctx.moveTo(1, 7);
        ctx.lineTo(11, 7);
        
        ctx.strokeStyle = '#DC2626'; // red-600
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        ctx.restore();

        // 6. Convert & Download
        canvas.toBlob((blob) => {
            if (blob) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${account.username}-qr-card.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                addToast('QR Card downloaded!', 'success');
            } else {
                throw new Error('Blob creation failed');
            }
        }, 'image/png');

    } catch (error) {
      console.error('Download failed', error);
      addToast('Failed to generate QR card.', 'error');
    } finally {
        setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out ${account.name} on Locale`,
          text: `Scan this QR code to visit ${account.name}'s profile on Locale.`,
          url: profileUrl,
        });
      } catch (error: any) {
        // Ignore abort/cancel errors
        const isAbort = error.name === 'AbortError' || 
                        (typeof error.message === 'string' && (
                            error.message.toLowerCase().includes('abort') || 
                            error.message.toLowerCase().includes('cancel')
                        ));
        if (!isAbort) {
            console.error('Error sharing:', error);
            addToast('Could not open share menu', 'error');
        }
      }
    } else {
      navigator.clipboard.writeText(profileUrl);
      addToast('Profile link copied to clipboard', 'success');
    }
  };

  return (
    <ModalShell
      panelRef={modalRef}
      onClose={onClose}
      title="Profile QR Code"
      titleId="profile-qr-title"
      panelClassName="w-full max-w-sm p-0 overflow-hidden rounded-2xl"
    >
      <div className="flex flex-col items-center">
        <div className="p-8 pb-6 bg-white w-full flex flex-col items-center">
            {/* Unified Card Container */}
            <div className={`relative p-6 rounded-3xl border-[5px] ${borderColor} bg-white shadow-sm flex flex-col items-center w-full max-w-[280px]`}>
                
                {/* QR Code */}
                <div className="relative mb-4 w-full aspect-square">
                    <img src={qrCodeApiUrl} alt={`QR code for ${account.name}`} className="w-full h-full object-contain rounded-lg" />
                </div>
                
                {/* Name & Username */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 leading-tight">{account.name}</h2>
                    <p className="text-gray-500 font-medium mt-1">@{account.username}</p>
                </div>

                {/* Locale Logo */}
                <div className="flex items-baseline text-black font-medium text-xl select-none pointer-events-none">
                    <span>l</span>
                    <span className="relative inline-flex flex-col items-center">
                        <span>o</span>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-[80%]">
                            <path d="M2 2L6 10L10 2H2Z M1 7H11" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </span>
                    <span>cale</span>
                </div>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="w-full bg-gray-50 border-t p-4 flex gap-3 justify-center">
            <Button onClick={handleDownload} variant="glass" className="flex-1 justify-center" disabled={isGenerating}>
                {isGenerating ? <SpinnerIcon className="w-5 h-5" /> : <ArrowDownTrayIcon className="w-5 h-5 mr-2" />}
                {isGenerating ? 'Saving...' : 'Download'}
            </Button>
            <Button onClick={handleShare} variant="glass-dark" className="flex-1 justify-center">
                <ShareIcon className="w-5 h-5 mr-2" />
                Share Profile
            </Button>
        </div>
      </div>
    </ModalShell>
  );
};
