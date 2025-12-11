import React, { useState, useRef } from 'react';
import { Subscription } from '../types';
import { cn, TIER_STYLES } from '../lib/utils';
import { useClickOutside } from '../hooks/useClickOutside';

export const SubscriptionBadge: React.FC<{ tier: Subscription['tier']; iconOnly?: boolean; className?: string }> = ({ tier, iconOnly = false, className }) => {
    const styles = TIER_STYLES[tier];
    const [isOpen, setIsOpen] = useState(false);
    const badgeRef = useRef<HTMLDivElement>(null);

    useClickOutside(badgeRef, () => setIsOpen(false), isOpen);

    if (!styles || !styles.icon) {
        return null;
    }

    const IconComponent = styles.icon;

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
                aria-label={`${tier} Badge. Click for info.`}
                aria-expanded={isOpen}
                title={tier}
            >
                {badgeContent}
            </div>

            {isOpen && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[100] animate-fade-in w-max max-w-[200px]" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded text-center">
                        {styles.description}
                    </div>
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900 absolute left-1/2 -translate-x-1/2 top-full"></div>
                </div>
            )}
        </div>
    );
};