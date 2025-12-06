import React, { useRef, useMemo, useState } from 'react';
import { Account } from '../types';
import ModalShell from './ModalShell';
import { Button } from './ui/Button';
import { PaperAirplaneIcon, ArrowDownTrayIcon, SpinnerIcon } from './Icons';
import { SubscriptionBadge } from './SubscriptionBadge';
import { TIER_STYLES, getBadgeSvg, drawLogoOnCanvas, isShareAbortError } from '../lib/utils';
import { Logo } from './Logo';

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

export const ProfileQRModal: React.FC<ProfileQRModalProps> = ({ account, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const profileUrl = `${window.location.origin}/?account=${account.id}`;
  const encodedUrl = encodeURIComponent(profileUrl);

  // Determine border color class for the UI (not canvas)
  const styles = TIER_STYLES[account.subscription.tier] || TIER_STYLES.Personal;
  const borderColorClass = styles.borderColor;
  const qrColor = styles.hex.substring(1); // Remove '#' for URL parameter

  // Using QuickChart as it handles CORS headers better for canvas drawing than other public APIs
  const qrCodeApiUrl = `https://quickchart.io/qr?text=${encodedUrl}&size=400&margin=2&ecLevel=H&format=png&dark=${qrColor}`;

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
    await drawLogoOnCanvas(ctx, cardWidth / 2, logoY, 'default');

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

  const handleShare = async () => {
    setIsSharing(true);
    try {
        const blob = await generateQrCardBlob();
        const file = new File([blob], `${account.username}-locale-qr.png`, { type: 'image/png' });
        const shareData = {
            files: [file],
            title: `Check out ${account.name} on Locale`,
            text: `Profile: ${account.name} (@${account.username})`,
            url: profileUrl,
        };

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share(shareData);
        } else {
            await navigator.share({
                title: shareData.title,
                text: shareData.text,
                url: shareData.url,
            });
        }
    } catch (err: any) {
        if (!isShareAbortError(err)) {
            console.error('Error sharing profile:', err);
        }
    } finally {
        setIsSharing(false);
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
        <div className={`p-6 bg-white rounded-3xl border-4 ${borderColorClass} inline-block shadow-md flex flex-col items-center gap-4`}>
            <img src={qrCodeApiUrl} alt={`QR code for ${account.name}`} className="w-56 h-56 rounded-md" />
            <div>
                <div className="flex items-center justify-center gap-2">
                    <h3 className="text-xl font-bold text-gray-800">{account.name}</h3>
                    <SubscriptionBadge tier={account.subscription.tier} iconOnly />
                </div>
                <p className="text-sm text-gray-600">@{account.username}</p>
            </div>
            <Logo />
        </div>
        <div className="mt-6 w-full space-y-3">
          <Button onClick={handleDownload} variant="overlay-dark" className="w-full gap-2" isLoading={isGenerating}>
            {isGenerating ? 'Generating...' : <><ArrowDownTrayIcon className="w-5 h-5" /> Download</>}
          </Button>
          {navigator.share && (
            <Button 
                onClick={handleShare}
                variant="overlay-dark" className="w-full gap-2"
                isLoading={isSharing}
                disabled={isGenerating}
            >
              {!isSharing && <><PaperAirplaneIcon className="w-5 h-5" /> Share QR Card</>}
            </Button>
          )}
        </div>
      </div>
    </ModalShell>
  );
};