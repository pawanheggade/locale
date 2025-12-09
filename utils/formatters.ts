import React from 'react';
import { Account } from '../types';

// Use Intl.RelativeTimeFormat for locale-aware relative time.
const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

// Cached formatters to avoid re-instantiation overhead
const currencyFormatterInteger = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

const currencyFormatterStandard = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
});

export const formatTimeRemaining = (expiryDate: number): string => {
  const now = Date.now();
  const remainingMs = expiryDate - now;

  if (remainingMs <= 0) {
    return "Expired";
  }
  
  const seconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
      // Intl will handle "tomorrow" vs "in X days"
      return `Expires ${rtf.format(days, 'day')}`;
  }
  if (hours > 0) {
      return `Expires ${rtf.format(hours, 'hour')}`;
  }
  if (minutes > 0) {
      return `Expires ${rtf.format(minutes, 'minute')}`;
  }
  return "Expires soon";
};

export const formatCurrency = (price: number | undefined | null): string => {
  if (price === undefined || price === null) return 'Contact for Price';
  
  // If the number is an integer, show no decimal places.
  if (price % 1 === 0) {
    return currencyFormatterInteger.format(price);
  }
  return currencyFormatterStandard.format(price);
};

export const formatCompactCurrency = (price: number | undefined | null): string => {
    if (price === undefined || price === null) return 'Contact';
    // Using Number() to remove trailing .0 from toFixed(1)
    if (price >= 10000000) return `₹${Number((price / 10000000).toFixed(1))}Cr`;
    if (price >= 100000) return `₹${Number((price / 100000).toFixed(1))}L`;
    if (price >= 1000) return `₹${Number((price / 1000).toFixed(1))}K`;
    return `₹${price.toFixed(0)}`;
};

export const formatFullDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatFullDateTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
};

export const formatShortDate = (date: Date): string => {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const timeSince = (timestamp: number): string => {
  const now = Date.now();
  const seconds = Math.floor((now - timestamp) / 1000);

  if (seconds < 29) return 'Just now';

  const intervals: { [key: string]: number } = {
    year: 31536000,
    month: 2592000,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const interval in intervals) {
    const value = Math.floor(seconds / intervals[interval]);
    if (value >= 1) {
      return rtf.format(-value, interval as Intl.RelativeTimeFormatUnit);
    }
  }

  return rtf.format(-seconds, 'second');
};


export const formatMonthYear = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
  });
};


export const renderWithMentions = (
  text: string,
  allAccounts: Account[],
  onViewAccount: (accountId: string) => void,
  onFilterByTag?: (tag: string) => void
): React.ReactNode => {
  if (!text) return text;
  
  // Match @username or #tag
  const regex = /(@[a-zA-Z0-9_.]+|#[a-zA-Z0-9_]+)/g;
  const accountsByUsername = new Map(allAccounts.map(acc => [acc.username.toLowerCase(), acc]));
  
  const parts = text.split(regex);

  return parts.map((part, index) => {
    // Username mention
    if (part.startsWith('@')) {
      const username = part.substring(1).toLowerCase();
      const account = accountsByUsername.get(username);
      if (account) {
        return React.createElement(
          'button',
          {
            key: `${index}`,
            onClick: (e: React.MouseEvent) => { e.stopPropagation(); onViewAccount(account.id); },
            className: "font-semibold text-red-600 focus:outline-none focus:ring-1 focus:ring-red-500 rounded-sm"
          },
          part
        );
      }
    } 
    // Hashtag
    else if (part.startsWith('#') && onFilterByTag) {
        const tag = part.substring(1);
        return React.createElement(
            'button',
            {
                key: `${index}`,
                onClick: (e: React.MouseEvent) => { e.stopPropagation(); onFilterByTag(tag); },
                className: "font-medium text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-500 rounded-sm"
            },
            part
        );
    }
    // Regular text
    return part;
  });
};

export const formatDaysRemaining = (endDate: number): string => {
  const now = Date.now();
  const remainingMs = endDate - now;

  if (remainingMs <= 0) {
    return "Trial expired";
  }

  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return rtf.format(days, 'day').replace('in ', '') + ' left';
  }
  if (hours > 0) {
    return rtf.format(hours, 'hour').replace('in ', '') + ' left';
  }
  
  return "Trial ends soon";
};

export const toDateTimeLocal = (timestamp: number | null | undefined): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - timezoneOffset);
    return localDate.toISOString().slice(0, 16);
};

export const fromDateTimeLocal = (dateString: string): number | null => {
    if (!dateString) return null;
    return new Date(dateString).getTime();
};