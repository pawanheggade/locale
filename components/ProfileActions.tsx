import React, { useState, useRef } from 'react';
import { SocialPlatform, SocialLink } from '../types';
import { Button, ButtonProps } from './ui/Button';
import { LikeButton } from './LikeButton';
import { useClickOutside } from '../hooks/useClickOutside';
import { cn } from '../lib/utils';
import { 
    PencilIcon, 
    DocumentIcon, 
    ChartBarIcon, 
    GlobeAltIcon, 
    PaperAirplaneIcon,
    FacebookIcon,
    XIcon,
    InstagramIcon,
    YouTubeIcon
} from './Icons';

interface ProfileActionsProps {
    isOwnAccount: boolean;
    canHaveCatalog: boolean;
    onEditAccount: () => void;
    onOpenCatalog: () => void;
    onOpenAnalytics: () => void;
    socialLinks: SocialLink[];
    onShare: () => void;
    contactMethods: { key: string; icon: React.FC<any>; label: string; href: string; toast: string }[];
    onContactAction: (e: React.MouseEvent, method: { toast: string }) => void;
    isLiked: boolean;
    onToggleLike: () => void;
    isMobile?: boolean; // Kept for interface compatibility but largely superseded by responsive classes
}

const getSocialIcon = (platform: SocialPlatform) => {
    switch (platform) {
        case 'facebook': return <FacebookIcon className="w-4 h-4" />;
        case 'twitter': return <XIcon className="w-4 h-4" />;
        case 'instagram': return <InstagramIcon className="w-4 h-4" />;
        case 'youtube': return <YouTubeIcon className="w-4 h-4" />;
        case 'website': return <GlobeAltIcon className="w-4 h-4" />;
        default: return <GlobeAltIcon className="w-4 h-4" />;
    }
};

const SocialsDropdown = ({ links, size = 'icon-sm', className, showLabel = false }: { links: SocialLink[], size?: ButtonProps['size'], className?: string, showLabel?: boolean }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useClickOutside(menuRef, () => setIsOpen(false), isOpen);

    if (!links || links.length === 0) return null;

    return (
        <div className="relative" ref={menuRef}>
            <Button
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                variant="overlay-dark"
                size={size}
                title="Social Profiles"
                className={cn(className, isOpen ? 'text-red-600 bg-red-50' : '', showLabel ? 'gap-2 px-4' : '')}
            >
                <GlobeAltIcon className="w-5 h-5" />
                {showLabel && <span>Socials</span>}
            </Button>
            {isOpen && (
                <div className="absolute top-full right-0 sm:left-0 sm:right-auto mt-2 w-48 bg-white rounded-xl border border-gray-100 shadow-lg z-30 animate-zoom-in overflow-hidden origin-top-right sm:origin-top-left">
                    <div className="py-1">
                        {links.map((link, idx) => (
                            <a
                                key={idx}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-4 py-2.5 transition-colors text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                onClick={() => setIsOpen(false)}
                            >
                                <span className="text-gray-500">{getSocialIcon(link.platform)}</span>
                                <span className="capitalize font-medium">{link.platform}</span>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export const ProfileActions: React.FC<ProfileActionsProps> = ({ 
    isOwnAccount, canHaveCatalog, onEditAccount, onOpenCatalog, onOpenAnalytics, 
    socialLinks, onShare, contactMethods, onContactAction, isLiked, onToggleLike
}) => {
    
    // Unified Logic: Calculate Primary and Secondary contacts for ALL users (Owners and Visitors)
    // Determine Primary Contact (Priority: Message -> Mobile -> Email)
    const primaryContact = contactMethods.find(m => m.key === 'message') 
                        || contactMethods.find(m => m.key === 'mobile') 
                        || contactMethods.find(m => m.key === 'email');
    
    // Filter out primary from the list to show remaining as secondary icons
    const secondaryContacts = contactMethods.filter(m => m !== primaryContact);

    return (
        <div className="flex flex-col gap-3 w-full">
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:justify-between items-stretch sm:items-center">
                {/* Primary Actions Group: Like + Primary Contact */}
                <div className="flex gap-2 w-full sm:w-auto">
                    <LikeButton 
                        isLiked={isLiked} 
                        onToggle={onToggleLike} 
                        variant={isLiked ? "pill-lightred" : "pill-red"} 
                        // Flex-1 on mobile ensures full width split, fixed padding on desktop
                        className="flex-1 sm:flex-none sm:w-auto justify-center gap-2 px-6" 
                        includeLabel 
                        iconClassName="w-5 h-5"
                    />
                    
                    {primaryContact && (
                        <Button
                            as="a"
                            href={primaryContact.href}
                            target={primaryContact.key === 'message' ? '_blank' : undefined}
                            rel={primaryContact.key === 'message' ? 'noopener noreferrer' : undefined}
                            onClick={(e) => onContactAction(e, primaryContact)}
                            variant="pill-dark"
                            className="flex-1 sm:flex-none sm:w-auto justify-center gap-2 px-6"
                        >
                            <primaryContact.icon className="w-5 h-5" />
                            <span>{primaryContact.label}</span>
                        </Button>
                    )}
                </div>

                {/* Secondary Actions Group: Other Contacts + Socials + Share */}
                <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-start sm:justify-end">
                    {secondaryContacts.map(method => (
                        <Button 
                            key={method.key} 
                            as="a" 
                            href={method.href} 
                            onClick={(e) => onContactAction(e, method)} 
                            variant="overlay-dark" 
                            size="sm" 
                            title={method.label}
                            className="bg-gray-100 hover:bg-gray-200 border-transparent text-gray-700 rounded-xl gap-2 px-4"
                        >
                            <method.icon className="w-5 h-5" />
                            <span>{method.label}</span>
                        </Button>
                    ))}
                    
                    <SocialsDropdown 
                        links={socialLinks} 
                        size="sm" 
                        showLabel={true}
                        className="bg-gray-100 hover:bg-gray-200 border-transparent text-gray-700 rounded-xl" 
                    />

                    <Button 
                        variant="overlay-dark" 
                        size="sm" 
                        onClick={onShare} 
                        title="Share Profile"
                        className="bg-gray-100 hover:bg-gray-200 border-transparent text-gray-700 rounded-xl gap-2 px-4"
                    >
                        <PaperAirplaneIcon className="w-5 h-5" />
                        <span>Share</span>
                    </Button>
                </div>
            </div>

            {/* Owner Management Buttons (Rendered below standard actions) */}
            {isOwnAccount && (
                <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center mt-1 pt-3 border-t border-gray-100 sm:border-t-0 sm:pt-0">
                    <Button 
                        onClick={onOpenAnalytics} 
                        variant="overlay-dark"
                        size="sm"
                        className="bg-gray-100 hover:bg-gray-200 border-transparent text-gray-700 rounded-xl gap-2 px-4"
                    >
                        <ChartBarIcon className="w-5 h-5" />
                        <span>Analytics</span>
                    </Button>
                    <Button 
                        onClick={onEditAccount} 
                        variant="overlay-dark"
                        size="sm"
                        className="bg-gray-100 hover:bg-gray-200 border-transparent text-gray-700 rounded-xl gap-2 px-4"
                    >
                        <PencilIcon className="w-5 h-5" />
                        <span>Edit Profile</span>
                    </Button>
                    {canHaveCatalog && (
                        <Button 
                            onClick={onOpenCatalog} 
                            variant="overlay-dark" 
                            size="sm"
                            className="bg-gray-100 hover:bg-gray-200 border-transparent text-gray-700 rounded-xl gap-2 px-4"
                        >
                            <DocumentIcon className="w-5 h-5" />
                            <span>Catalog</span>
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};