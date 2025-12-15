
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Account, AppView } from '../types';
import { XMarkIcon, PlusIcon, BellIcon, ShoppingBagIcon, UserIcon, Cog6ToothIcon } from './Icons';
import { Button } from './ui/Button';
import { useBadgeAnimation } from '../hooks/useBadgeAnimation';
import { useClickOutside } from '../hooks/useClickOutside';
import { useIsMounted } from '../hooks/useIsMounted';
import { cn } from '../lib/utils';
// FIX: Corrected import path to resolve module error.
import { useNavigation } from '../../contexts/NavigationContext';

interface AccountMenuProps {
    currentAccount: Account;
    activityCount: number;
    onOpenCreateModal?: () => void;
    navigateTo: (view: AppView, options?: any) => void;
    currentView: AppView;
    handleAccountViewToggle: () => void;
    onEditProfile: () => void;
    onOpenActivityPage: () => void;
    bagCount: number;
    onOpenSubscriptionPage: () => void;
}

interface MenuItemProps {
  onClick: () => void;
  icon: React.ReactElement<{ className?: string }>;
  label: string;
  badgeCount?: number;
  animateBadge?: boolean;
  isActive?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ onClick, icon, label, badgeCount = 0, animateBadge = false, isActive = false }) => (
    <Button
      onClick={onClick}
      variant="ghost"
      className={cn(
        "w-full p-0 h-auto rounded-xl text-right",
        isActive && "bg-red-50"
      )}
    >
      <div className="w-full flex items-center justify-end gap-2 p-2">
        <span className={cn(
          "text-sm font-bold whitespace-nowrap",
          isActive ? "text-red-600" : "text-gray-700"
        )}>
          {label}
        </span>
        <div className="relative w-5 h-5 flex items-center justify-center">
            {React.cloneElement(icon, {
              className: cn(
                icon.props.className,
                isActive ? 'text-red-600' : 'text-gray-700'
              ),
            })}
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
    navigateTo,
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

    return (
        <div ref={accountMenuRef}>
            <Button
                id="account-menu-button"
                onClick={toggleMenu}
                variant="ghost"
                size="icon"
                className={cn(
                    "relative !rounded-xl border-none transition-colors",
                    isAccountMenuOpen
                        ? "!bg-red-100 !text-red-600"
                        : "text-gray-700"
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
                      "absolute right-0 mt-2 w-auto origin-top-right z-30 focus:outline-none rounded-xl border border-gray-200/60",
                      "bg-white",
                      isClosing ? 'animate-zoom-out' : 'animate-zoom-in'
                  )}
                >
                    <div className="p-1.5">
                        <div>
                            <MenuItem onClick={() => handleMenuAction(handleAccountViewToggle)} icon={<UserIcon className="w-5 h-5" />} label="Profile" isActive={currentView === 'account'} />
                            {onOpenCreateModal && currentAccount.subscription.tier !== 'Personal' && (
                                <MenuItem onClick={() => handleMenuAction(onOpenCreateModal)} icon={<PlusIcon className="w-5 h-5" />} label="Post" isActive={currentView === 'createPost' || currentView === 'editPost'} />
                            )}
                            <MenuItem onClick={() => handleMenuAction(() => navigateTo('bag'))} icon={<ShoppingBagIcon className="w-5 h-5" />} label="Bag" badgeCount={bagCount} animateBadge={animateBadge} isActive={currentView === 'bag'} />
                            <MenuItem onClick={() => handleMenuAction(onOpenActivityPage)} icon={<BellIcon className="w-5 h-5" />} label="Activity" badgeCount={activityCount} isActive={currentView === 'activity'} />
                            <MenuItem onClick={() => handleMenuAction(() => navigateTo('settings'))} icon={<Cog6ToothIcon className="w-5 h-5" />} label="Settings" isActive={currentView === 'settings'} />
                        </div>

                        {currentAccount.role === 'admin' && (
                            <>
                                <div className="my-1.5 h-px bg-gray-200/50" />
                                <div>
                                    <MenuItem onClick={() => handleMenuAction(() => navigateTo('admin'))} icon={<UserIcon className="w-5 h-5" />} label="Admin Panel" isActive={currentView === 'admin'} />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
