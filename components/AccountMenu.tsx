import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Account, AppView } from '../types';
import { XMarkIcon, PlusIcon, HeartIcon, BellIcon, PencilIcon, MapPinIcon, ShoppingBagIcon, UserIcon, Cog6ToothIcon, Squares2X2Icon } from './Icons';
import { Button } from './ui/Button';
import { useBadgeAnimation } from '../hooks/useBadgeAnimation';
import { useClickOutside } from '../hooks/useClickOutside';
import { useIsMounted } from '../hooks/useIsMounted';
import { cn } from '../lib/utils';

interface AccountMenuProps {
    currentAccount: Account;
    activityCount: number;
    onOpenCreateModal?: () => void;
    onViewChange: (view: AppView) => void;
    currentView: AppView;
    handleAccountViewToggle: () => void;
    onEditProfile: () => void;
    onOpenActivityPage: () => void;
    bagCount: number;
    onOpenSubscriptionPage: () => void;
}

const MenuItem: React.FC<{
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badgeCount?: number;
  animateBadge?: boolean;
}> = ({ onClick, icon, label, badgeCount = 0, animateBadge = false }) => (
    <Button onClick={onClick} variant="ghost" className="w-full p-0 h-auto rounded-xl text-right">
      <div className="w-full flex items-center justify-end gap-2 p-2">
        <span className="text-sm font-bold text-gray-700 whitespace-nowrap">{label}</span>
        <div className="relative w-5 h-5 flex items-center justify-center">
            {icon}
            {badgeCount > 0 && (
                <span className={`absolute -top-1 -right-1.5 block h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold border-2 border-white ${animateBadge ? 'animate-badge-pop-in' : ''}`}>{badgeCount}</span>
            )}
        </div>
      </div>
    </Button>
);


export const AccountMenu: React.FC<AccountMenuProps> = ({
    currentAccount,
    activityCount,
    onOpenCreateModal,
    onViewChange,
    currentView,
    handleAccountViewToggle,
    onEditProfile,
    onOpenActivityPage,
    bagCount,
    onOpenSubscriptionPage,
}) => {
    const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const accountMenuRef = useRef<HTMLDivElement>(null);
    const isMounted = useIsMounted();
    const animateBadge = useBadgeAnimation(bagCount);

    const closeMenu = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => {
            if (isMounted()) {
                setIsAccountMenuOpen(false);
                setIsClosing(false);
            }
        }, 300); // Animation duration
    }, [isMounted]);
    
    const toggleMenu = () => {
        if (isAccountMenuOpen) {
            closeMenu();
        } else {
            setIsAccountMenuOpen(true);
        }
    };

    useClickOutside(accountMenuRef, () => {
        if (isAccountMenuOpen && !isClosing) {
            closeMenu();
        }
    }, isAccountMenuOpen);

    const handleMenuAction = (action: () => void) => {
        action();
        closeMenu();
    };

    const iconClass = "w-5 h-5";

    return (
        <div ref={accountMenuRef}>
            <Button
                id="account-menu-button"
                onClick={toggleMenu}
                variant="overlay-dark"
                size="icon"
                className={cn(
                    "relative !rounded-xl",
                    isAccountMenuOpen && "text-red-600"
                )}
                aria-label="Open account menu"
                aria-haspopup="true"
                aria-expanded={isAccountMenuOpen}
                aria-controls="account-menu-dropdown"
            >
                <div className="relative w-6 h-6">
                    <XMarkIcon className={`absolute w-6 h-6 transition-all duration-300 ease-in-out ${isAccountMenuOpen ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'}`} />
                    <PlusIcon className={`absolute w-6 h-6 transition-all duration-300 ease-in-out ${isAccountMenuOpen ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0'}`} />
                </div>
                {activityCount > 0 && !isAccountMenuOpen && (
                    <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold border-2 border-white animate-badge-pop-in" title={`${activityCount} new activities`}>
                        {activityCount > 9 ? '9+' : activityCount}
                    </span>
                )}
            </Button>

            {isAccountMenuOpen && (
                <div
                  id="account-menu-dropdown"
                  className={cn(
                      "absolute right-0 mt-2 w-auto origin-top-right z-30 focus:outline-none shadow-xl rounded-xl border border-gray-200/60",
                      "bg-white",
                      isClosing ? 'animate-zoom-out' : 'animate-zoom-in'
                  )}
                >
                    <div className="p-1.5">
                        <div>
                            <MenuItem onClick={() => handleMenuAction(handleAccountViewToggle)} icon={<UserIcon className="w-5 h-5 text-gray-700" />} label="Profile" />
                            {onOpenCreateModal && currentAccount.subscription.tier !== 'Personal' && (
                                <MenuItem onClick={() => handleMenuAction(onOpenCreateModal)} icon={<PencilIcon className="w-5 h-5 text-gray-700" />} label="Post" />
                            )}
                            <MenuItem onClick={() => handleMenuAction(() => onViewChange('bag'))} icon={<ShoppingBagIcon className="w-5 h-5 text-gray-700" />} label="Bag" badgeCount={bagCount} animateBadge={animateBadge} />
                            <MenuItem onClick={() => handleMenuAction(onOpenActivityPage)} icon={<BellIcon className="w-5 h-5 text-gray-700" />} label="Activity" badgeCount={activityCount} />
                        </div>

                        {currentAccount.role === 'admin' && (
                            <>
                                <div className="my-1.5 h-px bg-gray-200/50" />
                                <div>
                                    <MenuItem onClick={() => handleMenuAction(() => onViewChange('admin'))} icon={<UserIcon className="w-5 h-5 text-gray-700" />} label="Admin Panel" />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};