
import React, { useRef, useMemo, useState } from 'react';
import { Account } from '../types';
import ModalShell from './ModalShell';
import { Button } from './ui/Button';
import { ShareIcon, ArrowDownTrayIcon, SpinnerIcon } from './Icons';
import { useUI } from '../contexts/UIContext';
import { SubscriptionBadge } from './SubscriptionBadge';

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

const getBadgeSvg = (tier: string) => {
    if (tier === 'Organisation') {
        // Amber-600 #d97706 - Solid
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#d97706" stroke="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" /></svg>`;
    }
    
    let color = '#111827'; 
    if (tier === 'Verified') color = '#ef4444'; // red-500
    if (tier === 'Business') color = '#f59e0b'; // amber-500

    // Outline
    return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" /></svg>`;
};

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
        
        // Draw Badge on Canvas if applicable
        if (account.subscription.tier !== 'Personal' && account.subscription.tier !== 'Basic') {
            const nameWidth = ctx.measureText(account.name).width;
            const badgeSvg = getBadgeSvg(account.subscription.tier);
            const badgeImg = new Image();
            badgeImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(badgeSvg);
            
            await new Promise((resolve) => {
                badgeImg.onload = resolve;
                badgeImg.onerror = resolve; // continue even if badge fails
            });

            const badgeSize = 24;
            const badgeX = (cardWidth / 2) + (nameWidth / 2) + 6;
            const badgeY = (textY + 16) - (badgeSize / 2) - 7; // Adjust vertical centering visually
            
            ctx.drawImage(badgeImg, badgeX, badgeY, badgeSize, badgeSize);
        }
        
        // Username
        ctx.font = '500 14px sans-serif';
        ctx.fillStyle = '#6b7280'; // gray-500
        ctx.fillText(`@${account.username}`, cardWidth / 2, textY + 40);

        // 5. Locale Logo
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

  const shouldShowBadge = account.subscription.tier !== 'Personal' && account.subscription.tier !== 'Basic';

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
                    <div className="flex items-center justify-center gap-1.5">
                        <h2 className="text-2xl font-bold text-gray-900 leading-tight">{account.name}</h2>
                        {shouldShowBadge && (
                            <SubscriptionBadge tier={account.subscription.tier} iconOnly className="w-6 h-6 mt-0.5" />
                        )}
                    </div>
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
