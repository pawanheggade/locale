
import React from 'react';
import { Subscription } from '../types';
import { CheckBadgeIcon, CheckBadgeIconSolid } from './Icons';

interface TierInfo {
    textColor: string;
    bgColor: string;
    iconColor: string;
    badgeIconColor?: string;
    text: string;
    Icon?: React.FC<{ className?: string; title?: string }>;
}

const tierMap: Partial<Record<Subscription['tier'], TierInfo>> = {
    'Verified': {
        textColor: 'text-red-800',
        bgColor: 'bg-red-100',
        iconColor: 'text-red-500',
        text: 'Verified',
        Icon: CheckBadgeIcon,
    },
    'Business': {
        textColor: 'text-amber-800',
        bgColor: 'bg-amber-100',
        iconColor: 'text-amber-500',
        text: 'Business',
        Icon: CheckBadgeIcon,
    },
    'Business Pro': {
        textColor: 'text-white',
        bgColor: 'bg-amber-600',
        iconColor: 'text-amber-600',
        badgeIconColor: 'text-white',
        text: 'Business Pro',
        Icon: CheckBadgeIconSolid,
    },
};

export const SubscriptionBadge: React.FC<{ tier: Subscription['tier']; iconOnly?: boolean }> = ({ tier, iconOnly = false }) => {
    const info = tierMap[tier];

    if (!info) {
        return null;
    }

    const IconComponent = info.Icon || CheckBadgeIcon;

    if (iconOnly) {
        return <IconComponent className={`w-4 h-4 ${info.iconColor} flex-shrink-0`} title={`${info.text} Subscriber`} />;
    }

    return (
        <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${info.bgColor} ${info.textColor} text-xs font-semibold flex-shrink-0`}
            title={`${info.text} Subscriber`}
        >
            <IconComponent className={`w-3.5 h-3.5 ${info.badgeIconColor || info.iconColor}`} /> {info.text}
        </div>
    );
};
