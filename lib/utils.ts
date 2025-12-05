import type { FC } from 'react';
import { CheckBadgeIcon, CheckBadgeIconSolid } from '../components/Icons';
// FIX: Add import for Subscription type used in getBadgeSvg
import { Subscription } from '../types';

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
  // FIX: Complete the 'Personal' tier object with missing properties.
  'Personal': { 
    textColor: 'text-gray-900', 
    bgColor: 'bg-gray-900', 
    borderColor: 'border-gray-900', 
    ringColor: 'ring-gray-900', 
    iconColor: 'text-gray-900',
    hex: '#111827',
    icon: null,
    description: 'A personal account for browsing and community interaction.',
  },
};

// FIX: Add and export isShareAbortError function.
export const isShareAbortError = (err: any): boolean => {
  return (
    err.name === 'AbortError' ||
    err.code === 20 || // DOMException code for AbortError in some browsers
    (typeof err.message === 'string' &&
      (err.message.toLowerCase().includes('abort') ||
        err.message.toLowerCase().includes('cancel') ||
        err.message.toLowerCase().includes('canceled')))
  );
};

// FIX: Add and export getBadgeSvg function.
export const getBadgeSvg = (tier: Subscription['tier']): string => {
    const styles = TIER_STYLES[tier];
    if (!styles || !styles.icon) return '';

    const isSolid = tier === 'Organisation';
    const path = isSolid
        ? `<path fill-rule="evenodd" clip-rule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" />`
        : `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />`;
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${isSolid ? styles.hex : 'none'}" stroke="${isSolid ? 'none' : styles.hex}" stroke-width="${isSolid ? '0' : '1.5'}">${path}</svg>`;
    return svg;
};

// FIX: Add and export drawLogoOnCanvas function.
export const drawLogoOnCanvas = async (ctx: CanvasRenderingContext2D, x: number, y: number, variant: 'default' | 'white' = 'default') => {
    const textColor = variant === 'white' ? '#FFFFFF' : '#111827';
    const accentColor = variant === 'white' ? '#FFFFFF' : '#DC2626';

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const fontSize = 28;
    // Use a generic font family as a fallback for canvas rendering
    ctx.font = `bold ${fontSize}px "Comfortaa", sans-serif`;
    ctx.fillStyle = textColor;
    
    const text = "locale";
    const totalWidth = ctx.measureText(text).width;
    const startX = x - totalWidth / 2;
    
    const l_width = ctx.measureText("l").width;
    const o_width = ctx.measureText("o").width;

    // Draw "l"
    ctx.fillText("l", startX + l_width / 2, y);

    // Draw "o"
    const o_x = startX + l_width + o_width / 2;
    ctx.fillText("o", o_x, y);

    // Draw "cale"
    const cale_x = startX + l_width + o_width;
    ctx.textAlign = 'left';
    ctx.fillText("cale", cale_x, y);

    // Draw SVG parts over 'o'
    const o_center_x = o_x;
    const o_center_y = y;

    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // triangle
    ctx.beginPath();
    ctx.moveTo(o_center_x - 4, o_center_y - 6);
    ctx.lineTo(o_center_x, o_center_y + 2);
    ctx.lineTo(o_center_x + 4, o_center_y - 6);
    ctx.closePath();
    ctx.strokeStyle = accentColor;
    ctx.stroke();

    // line
    ctx.beginPath();
    ctx.moveTo(o_center_x - 5.5, o_center_y - 1);
    ctx.lineTo(o_center_x + 5.5, o_center_y - 1);
    ctx.strokeStyle = textColor;
    ctx.stroke();

    ctx.restore();
};
