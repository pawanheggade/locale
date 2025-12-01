import type { FC } from 'react';
import { CheckBadgeIcon, CheckBadgeIconSolid } from '../components/Icons';

// A simple utility for conditionally joining class names.
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export const inputBaseStyles = "rounded-md border border-gray-300 bg-white text-sm text-black ring-offset-white placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-600";

export const overlayInputBaseStyles = "bg-transparent border-0 rounded-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-b-2 focus-visible:border-red-500 h-10 px-1";

// Centralized styling configuration for subscription tiers
export const TIER_STYLES: Record<string, {
  textColor: string;
  bgColor: string;
  borderColor: string;
  ringColor: string;
  iconColor: string;
  hex: string; // For Canvas/SVG uses
  icon: FC<any> | null;
  description: string;
}> = {
  'Verified': { 
    textColor: 'text-red-800', 
    bgColor: 'bg-red-500', 
    borderColor: 'border-red-500', 
    ringColor: 'ring-red-500', 
    iconColor: 'text-red-500',
    hex: '#ef4444',
    icon: CheckBadgeIcon,
    description: 'This is a verified account.',
  },
  'Business': { 
    textColor: 'text-amber-800', 
    bgColor: 'bg-amber-500', 
    borderColor: 'border-amber-500', 
    ringColor: 'ring-amber-500', 
    iconColor: 'text-amber-500',
    hex: '#f59e0b',
    icon: CheckBadgeIcon,
    description: 'This is a verified business account.',
  },
  'Organisation': { 
    textColor: 'text-amber-900', 
    bgColor: 'bg-amber-600', 
    borderColor: 'border-amber-600', 
    ringColor: 'ring-amber-600', 
    iconColor: 'text-amber-600',
    hex: '#d97706',
    icon: CheckBadgeIconSolid,
    description: 'This is a verified organisation account.',
  },
  'Basic': { 
    textColor: 'text-gray-900', 
    bgColor: 'bg-gray-900', 
    borderColor: 'border-gray-900', 
    ringColor: 'ring-gray-900', 
    iconColor: 'text-gray-900',
    hex: '#111827',
    icon: null,
    description: 'This is a basic seller account.',
  },
  'Personal': { 
    textColor: 'text-gray-900', 
    bgColor: 'bg-gray-900', 
    borderColor: 'border-gray-900', 
    ringColor: 'ring-gray-900', 
    iconColor: 'text-gray-900',
    hex: '#111827',
    icon: null,
    description: 'This is a personal account.',
  },
};

export const getBadgeSvg = (tier: string) => {
    // Uses the centralized HEX codes
    const styles = TIER_STYLES[tier] || TIER_STYLES.Personal;
    
    if (tier === 'Organisation') {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${styles.hex}" stroke="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" /></svg>`;
    }
    
    // Outline style for others
    return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${styles.hex}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" /></svg>`;
};


export const drawLogoOnCanvas = async (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  y: number,
  size: 'default' | 'large' = 'default'
) => {
  const isLarge = size === 'large';
  const fontName = 'Comfortaa';
  const fontSize = isLarge ? 24 : 20;
  const font = `bold ${fontSize}px ${fontName}`;

  await document.fonts.load(font);
  ctx.font = font;
  ctx.fillStyle = '#111827';
  ctx.textAlign = 'left';

  const lPart = "l";
  const calePart = "cale";
  const oMetrics = ctx.measureText('o');
  const oWidth = oMetrics.width;
  
  const totalWidth = ctx.measureText(lPart).width + oWidth + ctx.measureText(calePart).width;
  const startX = centerX - totalWidth / 2;

  // Draw 'l'
  ctx.fillText(lPart, startX, y);

  // Draw solid circle for 'o'
  const circleX = startX + ctx.measureText(lPart).width + (oWidth / 2);
  // Comfortaa x-height is ~54% of font size. Circle diameter = x-height. Radius = x-height/2.
  const circleRadius = (fontSize * 0.54) / 2; 
  // Center of circle should be at half of x-height above baseline.
  const circleY = y - circleRadius; 
  ctx.beginPath();
  ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
  ctx.fill();

  // Draw 'cale'
  const caleX = startX + ctx.measureText(lPart).width + oWidth;
  ctx.fillText(calePart, caleX, y);
  
  const lWidth = ctx.measureText('l').width;
  
  const triangleCenterX = startX + lWidth + (oWidth / 2) + 1;
  const triangleSize = isLarge ? 15 : 11;
  const triangleTopY = y + (isLarge ? 4 : 6);

  ctx.save();
  ctx.translate(triangleCenterX - (triangleSize / 2), triangleTopY);
  
  const scale = triangleSize / 12;
  
  // Draw triangle (red)
  ctx.beginPath();
  ctx.moveTo(2, 2);
  ctx.lineTo(6, 10);
  ctx.lineTo(10, 2);
  ctx.closePath();
  ctx.strokeStyle = '#DC2626';
  ctx.lineWidth = 1.5 / scale;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Draw horizontal line (black)
  ctx.beginPath();
  ctx.moveTo(1, 7);
  ctx.lineTo(11, 7);
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 1.5 / scale;
  ctx.lineCap = 'round';
  ctx.stroke();
  
  ctx.restore();
};