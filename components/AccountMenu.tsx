
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Account, AppView } from '../types';
import { XMarkIcon, PlusIcon, HeartIcon, BellIcon, PencilIcon, MapPinIcon, ShoppingBagIcon, UserIcon, Cog6ToothIcon, Squares3X3Icon, Squares2X2Icon, CheckBadgeIconSolid } from './Icons';
import { Button } from './ui/Button';
import { useBadgeAnimation } from '../hooks/useBadgeAnimation';
import { Avatar } from './Avatar';

interface AccountMenuProps {
    currentAccount: Account;
    unreadNotificationsCount: number;
    onOpenCreateModal?: () => void;
    onViewChange: (view: AppView) => void;
    currentView: AppView;
    handleAccountViewToggle: () => void;
    onOpenNotificationsModal: () => void;
    mainView: 'grid' | 'map';
    onMainViewChange: (view: 'grid' | 'map') => void;
    gridView: 'default' | 'compact';
    onGridViewChange: (view: 'default' | 'compact') => void;
    onOpenSettingsModal: () => void;
    bagCount: number;
    onOpenSubscriptionPage: () => void;
}

export const AccountMenu: React.FC<AccountMenuProps> = ({
    currentAccount,
    unreadNotificationsCount,
    onOpenCreateModal,
    onViewChange,
    currentView,
    handleAccountViewToggle,
    onOpenNotificationsModal,
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
    const isMountedRef = useRef(true);
    const animateBadge = useBadgeAnimation(bagCount);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
          isMountedRef.current = false;
        };
    }, []);

    const closeMenu = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => {
            if (isMountedRef.current) {
                setIsAccountMenuOpen(false);
                setIsClosing(false);
            }
        }, 300); // Animation duration
    }, []);
    
    const toggleMenu = () => {
        if (isAccountMenuOpen) {
            closeMenu();
        } else {
            setIsAccountMenuOpen(true);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isAccountMenuOpen && !isClosing && accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
                closeMenu();
            }
        };
        document.addEventListener('mousedown', handleClickOutside, true);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside, true);
        };
    }, [isAccountMenuOpen, isClosing, closeMenu]);

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
                variant="glass-red"
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
                  className={`absolute right-0 mt-2 w-72 origin-top-right bg-white rounded-lg shadow-2xl border border-gray-100 z-30 focus:outline-none ${isClosing ? 'animate-zoom-out' : 'animate-zoom-in'}`}
                  role="menu"
                  aria-orientation="vertical"
                  tabIndex={-1}
                  aria-labelledby="account-menu-button"
                >
                    <button 
                        onClick={() => handleMenuAction(handleAccountViewToggle)} 
                        className="w-full text-left p-4 border-b bg-gray-50 active:bg-gray-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-500 rounded-t-lg"
                        role="menuitem"
                    >
                        <div className="flex items-center gap-3">
                            <Avatar 
                                src={currentAccount.avatarUrl} 
                                alt={currentAccount.name} 
                                size="lg" 
                                tier={currentAccount.subscription.tier} 
                            />
                            <div>
                                <p className="font-bold text-gray-800 truncate">{currentAccount.name}</p>
                                <p className="text-sm text-gray-500">View Profile</p>
                            </div>
                        </div>
                    </button>
                    <div className="py-1" role="none">
                        <div className="p-2" role="none">
                            {onOpenCreateModal && currentAccount.subscription.tier !== 'Personal' && (
                                <Button 
                                    onClick={() => handleMenuAction(onOpenCreateModal)} 
                                    variant="glass-red"
                                    className="w-full justify-center gap-2 px-4 py-3 text-base font-semibold mb-2 h-auto" 
                                    role="menuitem"
                                >
                                    <PencilIcon className="w-5 h-5" />
                                    <span>Post</span>
                                </Button>
                            )}
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => handleMenuAction(() => onViewChange('forum'))} className="flex items-center gap-3 p-3 rounded-lg active:bg-gray-100 transition-colors" role="menuitem">
                                    <div className="w-6 h-6 flex items-center justify-center">
                                        <UserIcon className="w-6 h-6 text-gray-600" />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-700">Forum</span>
                                </button>
                                <button onClick={() => handleMenuAction(() => onViewChange('bag'))} className="flex items-center gap-3 p-3 rounded-lg active:bg-gray-100 transition-colors" role="menuitem">
                                    <div className="relative w-6 h-6 flex items-center justify-center">
                                        <ShoppingBagIcon className="w-6 h-6 text-gray-600" />
                                        {bagCount > 0 && (
                                            <span className={`absolute -top-1 -right-1.5 block h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold border-2 border-white ${animateBadge ? 'animate-badge-pop-in' : ''}`}>{bagCount}</span>
                                        )}
                                    </div>
                                    <span className="text-sm font-semibold text-gray-700">Bag</span>
                                </button>
                                <button onClick={() => handleMenuAction(() => onViewChange('likes'))} className="flex items-center gap-3 p-3 rounded-lg active:bg-gray-100 transition-colors" role="menuitem">
                                    <div className="w-6 h-6 flex items-center justify-center">
                                        <HeartIcon className="w-6 h-6 text-gray-600" />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-700">Likes</span>
                                </button>
                                <button onClick={() => handleMenuAction(onOpenNotificationsModal)} className="flex items-center gap-3 p-3 rounded-lg active:bg-gray-100 transition-colors" role="menuitem">
                                    <div className="relative w-6 h-6 flex items-center justify-center">
                                        <BellIcon className="w-6 h-6 text-gray-600" />
                                        {unreadNotificationsCount > 0 && (
                                            <span className="absolute -top-1 -right-1.5 block h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold border-2 border-white">{unreadNotificationsCount}</span>
                                        )}
                                    </div>
                                    <span className="text-sm font-semibold text-gray-700">Activity</span>
                                </button>
                                <button onClick={() => handleMenuAction(onOpenSettingsModal)} className="flex items-center gap-3 p-3 rounded-lg active:bg-gray-100 transition-colors" role="menuitem">
                                    <div className="w-6 h-6 flex items-center justify-center">
                                        <Cog6ToothIcon className="w-6 h-6 text-gray-600" />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-700">Settings</span>
                                </button>
                                <button onClick={() => handleMenuAction(onOpenSubscriptionPage)} className="flex items-center gap-3 p-3 rounded-lg active:bg-gray-100 transition-colors" role="menuitem">
                                    <div className="w-6 h-6 flex items-center justify-center">
                                        <CheckBadgeIconSolid className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-700">Subscribe</span>
                                </button>
                            </div>
                        </div>
                        <div className="my-1 h-px bg-gray-100" role="separator" />
                        <div className="px-2" role="none">
                           <div className="grid grid-cols-2 gap-2">
                               <button onClick={() => handleMenuAction(handleViewToggle)} className="flex flex-col items-center justify-center gap-2 p-2 rounded-lg active:bg-gray-100 transition-colors" role="menuitem">
                                    <div className="w-6 h-6 flex items-center justify-center text-gray-600">
                                       {mainView === 'grid' ? <MapPinIcon className={iconClass}/> : <Squares2X2Icon className={iconClass}/>}
                                    </div>
                                    <span className="text-xs font-semibold text-gray-700">{mainView === 'grid' ? 'Maps' : 'Grid'}</span>
                                </button>
                                <button onClick={() => handleMenuAction(handleGridViewToggle)} className="flex flex-col items-center justify-center gap-2 p-2 rounded-lg active:bg-gray-100 transition-colors" role="menuitem">
                                     <div className="w-6 h-6 flex items-center justify-center text-gray-600">
                                       {gridView === 'default' ? <Squares3X3Icon className={iconClass}/> : <Squares2X2Icon className={iconClass}/>}
                                    </div>
                                    <span className="text-xs font-semibold text-gray-700">{gridView === 'default' ? 'Compact' : 'Default'}</span>
                                </button>
                           </div>
                        </div>

                        {currentAccount.role === 'admin' && (
                            <>
                                <div className="my-1 h-px bg-gray-100" role="separator" />
                                <div className="p-2" role="none">
                                    <button onClick={() => handleMenuAction(() => onViewChange('admin'))} className="w-full flex items-center justify-center gap-4 px-4 py-2.5 text-base font-medium text-gray-700 active:bg-gray-100 transition-colors rounded-lg" role="menuitem">
                                        <UserIcon className="w-6 h-6 text-gray-600" />
                                        <span>Admin Panel</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
