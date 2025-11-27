
import React, { useState, useRef } from 'react';
import { Subscription } from '../types';
import { CheckBadgeIcon, CheckBadgeIconSolid } from './Icons';
import { cn } from '../lib/utils';
import { useClickOutside } from '../hooks/useClickOutside';

interface TierInfo {
    textColor: string;
    iconColor: string;
    badgeIconColor?: string;
    text: string;
    description: string;
    Icon?: React.FC<{ className?: string; title?: string }>;
}

const tierMap: Partial<Record<Subscription['tier'], TierInfo>> = {
    'Verified': {
        textColor: 'text-red-800',
        iconColor: 'text-red-500',
        text: 'Verified',
        description: 'This is a verified account',
        Icon: CheckBadgeIcon,
    },
    'Business': {
        textColor: 'text-amber-800',
        iconColor: 'text-amber-500',
        text: 'Business',
        description: 'This is a verified business account',
        Icon: CheckBadgeIcon,
    },
    'Organisation': {
        textColor: 'text-amber-900',
        iconColor: 'text-amber-600',
        badgeIconColor: 'text-amber-600',
        text: 'Organisation',
        description: 'This is a verified organisation account',
        Icon: CheckBadgeIconSolid,
    },
};

export const SubscriptionBadge: React.FC<{ tier: Subscription['tier']; iconOnly?: boolean; className?: string }> = ({ tier, iconOnly = false, className }) => {
    const info = tierMap[tier];
    const [isOpen, setIsOpen] = useState(false);
    const badgeRef = useRef<HTMLDivElement>(null);

    useClickOutside(badgeRef, () => setIsOpen(false), isOpen);

    if (!info) {
        return null;
    }

    const IconComponent = info.Icon || CheckBadgeIcon;

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    const badgeContent = iconOnly ? (
        <IconComponent className={cn(`w-4 h-4 ${info.iconColor} flex-shrink-0`, className)} />
    ) : (
        <div
            className={cn(`flex items-center justify-center w-6 h-6 rounded-full ${info.textColor} flex-shrink-0`, className)}
        >
            <IconComponent className={`w-4 h-4 ${info.badgeIconColor || info.iconColor}`} />
        </div>
    );

    return (
        <div className="relative inline-flex items-center" ref={badgeRef}>
            <div 
                role="button" 
                tabIndex={0}
                onClick={handleToggle}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }
                }}
                className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-full"
                aria-label={`${info.text} Badge. Click for info.`}
                aria-expanded={isOpen}
                title={info.text}
            >
                {badgeContent}
            </div>

            {isOpen && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[100] animate-fade-in w-max max-w-[200px]" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded shadow-lg text-center">
                        {info.description}
                    </div>
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900 absolute left-1/2 -translate-x-1/2 top-full"></div>
                </div>
            )}
        </div>
    );
};
