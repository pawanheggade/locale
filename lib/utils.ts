// FIX: Import FC type from react to resolve 'Cannot find namespace React' error.
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
  // FIX: Use FC type instead of React.FC
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
