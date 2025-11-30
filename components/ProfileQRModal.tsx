


import React, { useRef, useMemo, useState } from 'react';
import { Account } from '../types';
import ModalShell from './ModalShell';
import { Button } from './ui/Button';
import { ShareIcon, ArrowDownTrayIcon, SpinnerIcon } from './Icons';
import { SubscriptionBadge } from './SubscriptionBadge';
import { TIER_STYLES } from '../lib/utils';

interface ProfileQRModalProps {
  account: Account;
  onClose: () => void;
}

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
    // Uses the centralized HEX codes
    const styles = TIER_STYLES[tier] || TIER_STYLES.Personal;
    
    if (tier === 'Organisation') {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${styles.hex}" stroke="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" /></svg>`;
    }
    
    // Outline style for others
    return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${styles.hex}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" /></svg>`;
};

export const ProfileQRModal: React.FC<ProfileQRModalProps> = ({ account, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const profileUrl = `${window.location.origin}/?account=${account.id}`;
  const encodedUrl = encodeURIComponent(profileUrl);
  // Using QuickChart as it handles CORS headers better for canvas drawing than other public APIs
  const qrCodeApiUrl = `https://quickchart.io/qr?text=${encodedUrl}&size=400&margin=2&ecLevel=H&format=png`;

  // Determine border color class for the UI (not canvas)
  const styles = TIER_STYLES[account.subscription.tier] || TIER_STYLES.Personal;
  const borderColorClass = styles.borderColor;

  const generateQrCardBlob = async (): Promise<Blob> => {
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
    ctx.fillRect(0, 0, cardWidth, contentHeight); 
    
    // 2. Colored Border using centralized Hex
    ctx.lineWidth = 5;
    ctx.strokeStyle = styles.hex;
    
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
            badgeImg.onerror = resolve; 
        });

        const badgeSize = 24;
        const badgeX = (cardWidth / 2) + (nameWidth / 2) + 6;
        const badgeY = (textY + 16) - (badgeSize / 2) - 7; 
        
        ctx.drawImage(badgeImg, badgeX, badgeY, badgeSize, badgeSize);
    }
    
    // Username
    ctx.font = '500 14px sans-serif';
    ctx.fillStyle = '#6b7280'; // gray-500
    ctx.fillText(`@${account.username}`, cardWidth / 2, textY + 40);

    // 5. Locale Logo
    const logoY = textY + 94; 
    ctx.font = 'bold 20px Comfortaa, sans-serif'; // Bold for canvas
    ctx.fillStyle = '#111827'; // gray-900
    
    const text = "locale";
    const textMeasure = ctx.measureText(text);
    const textX = (cardWidth - textMeasure.width) / 2;
    
    ctx.textAlign = 'left';
    ctx.fillText(text, textX, logoY);
    
    // Manually approximate the position for the triangle since measureText for individual letters is tricky with variable width fonts
    // Comfortaa is wider, so we adjust slightly.
    const lWidth = ctx.measureText('l').width;
    const oWidth = ctx.measureText('o').width;
    
    const triangleCenterX = textX + lWidth + (oWidth / 2) + 1; 
    const triangleTopY = logoY + 6; 

    ctx.save();
    ctx.translate(triangleCenterX - 6, triangleTopY);
    
    ctx.beginPath();
    ctx.moveTo(2, 2);
    ctx.lineTo(6, 10);
    ctx.lineTo(10, 2);
    ctx.lineTo(2, 2);
    ctx.moveTo(1, 7);
    ctx.lineTo(11, 7);
    
    ctx.strokeStyle = '#DC2626'; 
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Blob creation failed'));
        }, 'image/png');
    });
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
        const blob = await generateQrCardBlob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${account.username}-locale-qr.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Failed to generate QR card:", error);
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <ModalShell
      panelRef={modalRef}
      onClose={onClose}
      title="Share Profile"
      panelClassName="w-full max-w-xs"
      titleId="profile-qr-title"
    >
      <div className="p-6 flex flex-col items-center text-center">
        <div className={`p-3 bg-white rounded-xl border-4 ${borderColorClass} inline-block shadow-md`}>
          <img src={qrCodeApiUrl} alt={`QR code for ${account.name}`} className="w-56 h-56 rounded-md" />
        </div>
        <div className="mt-4">
          <h3 className="text-xl font-bold text-gray-800">{account.name}</h3>
          <p className="text-sm text-gray-600">@{account.username}</p>
        </div>
        <div className="mt-6 w-full space-y-3">
          <Button onClick={handleDownload} variant="pill-dark" className="w-full gap-2" isLoading={isGenerating}>
            {isGenerating ? 'Generating...' : <><ArrowDownTrayIcon className="w-5 h-5" /> Download</>}
          </Button>
          {navigator.share && (
            <Button 
                onClick={async () => {
                    await navigator.share({ url: profileUrl, title: account.name, text: `Check out ${account.name} on Locale!`});
                }}
                variant="outline" className="w-full gap-2"
            >
              <ShareIcon className="w-5 h-5" /> More Share Options
            </Button>
          )}
        </div>
      </div>
    </ModalShell>
  );
};
