
import React from 'react';
import { Subscription } from '../types';
import { CheckBadgeIcon, CheckBadgeIconSolid } from './Icons';
import { cn } from '../lib/utils';

interface TierInfo {
    textColor: string;
    iconColor: string;
    badgeIconColor?: string;
    text: string;
    Icon?: React.FC<{ className?: string; title?: string }>;
}

const tierMap: Partial<Record<Subscription['tier'], TierInfo>> = {
    'Verified': {
        textColor: 'text-red-800',
        iconColor: 'text-red-500',
        text: 'Verified',
        Icon: CheckBadgeIcon,
    },
    'Business': {
        textColor: 'text-amber-800',
        iconColor: 'text-amber-500',
        text: 'Business',
        Icon: CheckBadgeIcon,
    },
    'Organisation': {
        textColor: 'text-amber-900',
        iconColor: 'text-amber-600',
        badgeIconColor: 'text-amber-600',
        text: 'Organisation',
        Icon: CheckBadgeIconSolid,
    },
};

export const SubscriptionBadge: React.FC<{ tier: Subscription['tier']; iconOnly?: boolean; className?: string }> = ({ tier, iconOnly = false, className }) => {
    const info = tierMap[tier];

    if (!info) {
        return null;
    }

    const IconComponent = info.Icon || CheckBadgeIcon;

    if (iconOnly) {
        return <IconComponent className={cn(`w-4 h-4 ${info.iconColor} flex-shrink-0`, className)} title={`${info.text} Subscriber`} />;
    }

    return (
        <div
            className={cn(`flex items-center justify-center w-6 h-6 rounded-full ${info.textColor} flex-shrink-0`, className)}
            title={`${info.text} Subscriber`}
        >
            <IconComponent className={`w-4 h-4 ${info.badgeIconColor || info.iconColor}`} />
        </div>
    );
};
