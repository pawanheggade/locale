
import React, { useState, useRef } from 'react';
import { Subscription } from '../types';
import { CheckBadgeIcon, CheckBadgeIconSolid } from './Icons';
import { cn, TIER_STYLES } from '../lib/utils';
import { useClickOutside } from '../hooks/useClickOutside';

interface TierInfo {
    text: string;
    description: string;
    Icon?: React.FC<{ className?: string; title?: string }>;
}

// Only keep descriptive info here, style info is in TIER_STYLES
const tierMeta: Partial<Record<Subscription['tier'], TierInfo>> = {
    'Verified': {
        text: 'Verified',
        description: 'This is a verified account',
        Icon: CheckBadgeIcon,
    },
    'Business': {
        text: 'Business',
        description: 'This is a verified business account',
        Icon: CheckBadgeIcon,
    },
    'Organisation': {
        text: 'Organisation',
        description: 'This is a verified organisation account',
        Icon: CheckBadgeIconSolid,
    },
};

export const SubscriptionBadge: React.FC<{ tier: Subscription['tier']; iconOnly?: boolean; className?: string }> = ({ tier, iconOnly = false, className }) => {
    const meta = tierMeta[tier];
    const styles = TIER_STYLES[tier];
    const [isOpen, setIsOpen] = useState(false);
    const badgeRef = useRef<HTMLDivElement>(null);

    useClickOutside(badgeRef, () => setIsOpen(false), isOpen);

    if (!meta || !styles) {
        return null;
    }

    const IconComponent = meta.Icon || CheckBadgeIcon;

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    const badgeContent = iconOnly ? (
        <IconComponent className={cn(`w-4 h-4 ${styles.iconColor} flex-shrink-0`, className)} />
    ) : (
        <div
            className={cn(`flex items-center justify-center w-6 h-6 rounded-full ${styles.textColor} flex-shrink-0`, className)}
        >
            <IconComponent className={`w-4 h-4 ${styles.iconColor}`} />
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
                aria-label={`${meta.text} Badge. Click for info.`}
                aria-expanded={isOpen}
                title={meta.text}
            >
                {badgeContent}
            </div>

            {isOpen && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[100] animate-fade-in w-max max-w-[200px]" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded shadow-lg text-center">
                        {meta.description}
                    </div>
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900 absolute left-1/2 -translate-x-1/2 top-full"></div>
                </div>
            )}
        </div>
    );
};
