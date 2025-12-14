
import React from 'react';
import { AppView } from '../types';
import { UserIcon } from './Icons';
import { Button } from './ui/Button';
import { useBadgeAnimation } from '../hooks/useBadgeAnimation';
import { cn } from '../lib/utils';

interface AccountMenuProps {
    activityCount: number;
    currentView: AppView;
    handleAccountViewToggle: () => void;
}

export const AccountMenu: React.FC<AccountMenuProps> = ({
    activityCount,
    currentView,
    handleAccountViewToggle,
}) => {
    const animateBadge = useBadgeAnimation(activityCount);

    return (
        <Button
            onClick={handleAccountViewToggle}
            variant="ghost"
            size="icon"
            className={cn(
                "!rounded-xl text-gray-600",
                currentView === 'account' && "text-red-600 bg-red-50"
            )}
            aria-label="Open profile"
        >
            <UserIcon className="w-6 h-6" isFilled={currentView === 'account'} />
            {activityCount > 0 && (
                <span className={cn(
                    "absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold border-2 border-white",
                    animateBadge ? "animate-badge-pop-in" : ""
                )}>
                    {activityCount > 9 ? '9+' : activityCount}
                </span>
            )}
        </Button>
    );
};
