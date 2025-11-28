import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Account, AppView } from '../types';
import { XMarkIcon, PlusIcon, HeartIcon, BellIcon, PencilIcon, MapPinIcon, ShoppingBagIcon, UserIcon, Cog6ToothIcon, Squares3X3Icon, Squares2X2Icon } from './Icons';
import { Button } from './ui/Button';
import { useBadgeAnimation } from '../hooks/useBadgeAnimation';
import { Avatar } from './Avatar';
import { useClickOutside } from '../hooks/useClickOutside';
import { useIsMounted } from '../hooks/useIsMounted';

interface AccountMenuProps {
    currentAccount: Account;
    unreadNotificationsCount: number;
    onOpenCreateModal?: () => void;
    onViewChange: (view: AppView) => void;
    currentView: AppView;
    handleAccountViewToggle: () => void;
    onEditProfile: () => void;
    onOpenActivityPage: () => void;
    mainView: 'grid' | 'map';
    onMainViewChange: (view: 'grid' | 'map') => void;
    gridView: 'default' | 'compact';
    onGridViewChange: (view: 'default' | 'compact') => void;
    onOpenSettingsModal: () => void;
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
    <Button onClick={onClick} variant="ghost" className="w-full p-0 h-auto rounded-xl" role="menuitem">
      <div className="w-full flex items-center justify-start gap-3 p-3">
        <div className="relative w-6 h-6 flex items-center justify-center">
            {icon}
            {badgeCount > 0 && (
                <span className={`absolute -top-1 -right-1.5 block h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold border-2 border-white ${animateBadge ? 'animate-badge-pop-in' : ''}`}>{badgeCount}</span>
            )}
        </div>
        <span className="text-sm font-semibold text-gray-600">{label}</span>
      </div>
    </Button>
);


export const AccountMenu: React.FC<AccountMenuProps> = ({
    currentAccount,
    unreadNotificationsCount,
    onOpenCreateModal,
    onViewChange,
    currentView,
    handleAccountViewToggle,
    onEditProfile,
    onOpenActivityPage,
    mainView,
    onMainViewChange,
    gridView,
    onGridViewChange,
    onOpenSettingsModal,
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

    const handleViewToggle = () => {
      onMainViewChange(mainView === 'grid' ? 'map' : 'grid');
    };

    const handleGridViewToggle = () => {
      onGridViewChange(gridView === 'default' ? 'compact' : 'default');
    };

    const iconClass = "w-6 h-6";

    return (
        <div ref={accountMenuRef}>
            <Button
                id="account-menu-button"
                onClick={toggleMenu}
                variant={isAccountMenuOpen ? "circular-lightred" : "circular-red"}
                size="icon"
                className="relative"
                aria-label="Open account menu"
                aria-haspopup="true"
                aria-expanded={isAccountMenuOpen}
            >
                <div className="relative w-6 h-6">
                    <XMarkIcon className={`absolute w-6 h-6 transition-all duration-300 ease-in-out ${isAccountMenuOpen ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'}`} />
                    <PlusIcon className={`absolute w-6 h-6 transition-all duration-300 ease-in-out ${isAccountMenuOpen ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0'}`} />
                </div>
                {unreadNotificationsCount > 0 && !isAccountMenuOpen && (
                    <span className="absolute top-1 right-1 block h-3 w-3 rounded-full bg-white border-2 border-red-600" title={`${unreadNotificationsCount} unread notifications`}>
                        <span className="sr-only">{unreadNotificationsCount} unread notifications</span>
                    </span>
                )}
            </Button>

            {isAccountMenuOpen && (
                <div
                  className={`absolute right-0 mt-2 w-72 origin-top-right bg-white rounded-xl border border-gray-100 z-30 focus:outline-none ${isClosing ? 'animate-zoom-out' : 'animate-zoom-in'}`}
                  role="menu"
                  aria-orientation="vertical"
                  tabIndex={-1}
                  aria-labelledby="account-menu-button"
                >
                    <Button 
                        onClick={() => handleMenuAction(handleAccountViewToggle)} 
                        variant="ghost"
                        className="w-full h-auto text-left p-0 border-b bg-gray-50 rounded-t-xl rounded-b-none"
                        role="menuitem"
                    >
                        <div className="w-full flex items-center justify-start gap-3 p-4">
                            <Avatar 
                                src={currentAccount.avatarUrl} 
                                alt={currentAccount.name} 
                                size="lg" 
                                tier={currentAccount.subscription.tier} 
                            />
                            <div>
                                <p className="font-bold text-gray-800 truncate">{currentAccount.name}</p>
                                <p className="text-sm text-gray-600">View Profile</p>
                            </div>
                        </div>
                    </Button>
                    <div className="py-1" role="none">
                        <div className="p-2" role="none">
                            {onOpenCreateModal && currentAccount.subscription.tier !== 'Personal' && (
                                <Button 
                                    onClick={() => handleMenuAction(onOpenCreateModal)} 
                                    variant="pill-red"
                                    className="w-full justify-center gap-2 px-4 py-3 text-base font-semibold mb-2 h-auto" 
                                    role="menuitem"
                                >
                                    <PencilIcon className="w-5 h-5" />
                                    <span>Post</span>
                                </Button>
                            )}
                            <div className="grid grid-cols-2 gap-2">
                                <MenuItem onClick={() => handleMenuAction(() => onViewChange('bag'))} icon={<ShoppingBagIcon className="w-6 h-6 text-gray-600" />} label="Bag" badgeCount={bagCount} animateBadge={animateBadge} />
                                <MenuItem onClick={() => handleMenuAction(() => onViewChange('likes'))} icon={<HeartIcon className="w-6 h-6 text-gray-600" />} label="Likes" />
                                <MenuItem onClick={() => handleMenuAction(onOpenActivityPage)} icon={<BellIcon className="w-6 h-6 text-gray-600" />} label="Activity" badgeCount={unreadNotificationsCount} />
                                <MenuItem onClick={() => handleMenuAction(onOpenSettingsModal)} icon={<Cog6ToothIcon className="w-6 h-6 text-gray-600" />} label="Settings" />
                            </div>
                        </div>
                        <div className="my-1 h-px bg-gray-100" role="separator" />
                        <div className="px-2" role="none">
                           <div className="grid grid-cols-2 gap-2">
                               <Button onClick={() => handleMenuAction(handleViewToggle)} variant="ghost" className="flex-col h-auto gap-2 p-2 rounded-xl" role="menuitem">
                                    <div className="w-6 h-6 flex items-center justify-center text-gray-600">
                                       {mainView === 'grid' ? <MapPinIcon className={iconClass}/> : <Squares2X2Icon className={iconClass}/>}
                                    </div>
                                    <span className="text-xs font-semibold text-gray-600">{mainView === 'grid' ? 'Maps' : 'Grid'}</span>
                                </Button>
                                <Button onClick={() => handleMenuAction(handleGridViewToggle)} variant="ghost" className="flex-col h-auto gap-2 p-2 rounded-xl" role="menuitem">
                                     <div className="w-6 h-6 flex items-center justify-center text-gray-600">
                                       {gridView === 'default' ? <Squares3X3Icon className={iconClass}/> : <Squares2X2Icon className={iconClass}/>}
                                    </div>
                                    <span className="text-xs font-semibold text-gray-600">{gridView === 'default' ? 'Compact' : 'Default'}</span>
                                </Button>
                           </div>
                        </div>

                        {currentAccount.role === 'admin' && (
                            <>
                                <div className="my-1 h-px bg-gray-100" role="separator" />
                                <div className="p-2" role="none">
                                    <Button onClick={() => handleMenuAction(() => onViewChange('admin'))} variant="ghost" className="w-full justify-center gap-4 px-4 py-2.5 text-base h-auto font-medium text-gray-600 rounded-xl" role="menuitem">
                                        <UserIcon className="w-6 h-6 text-gray-600" />
                                        <span>Admin Panel</span>
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};