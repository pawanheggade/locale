import React, { useState, useRef } from 'react';
import { SocialPlatform, SocialLink } from '../types';
import { Button, ButtonProps } from './ui/Button';
import { LikeButton } from './LikeButton';
import { useClickOutside } from '../hooks/useClickOutside';
import { 
    PencilIcon, 
    DocumentIcon, 
    ChartBarIcon, 
    GlobeAltIcon, 
    ShareIcon,
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

const SocialsDropdown = ({ links, size = 'icon-sm' }: { links: SocialLink[], size?: ButtonProps['size'] }) => {
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
                className={isOpen ? 'text-red-600' : ''}
            >
                <GlobeAltIcon className="w-4 h-4" />
            </Button>
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl border border-gray-100 z-30 animate-zoom-in overflow-hidden origin-top-right">
                    <div className="py-1">
                        {links.map((link, idx) => (
                            <a
                                key={idx}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-4 py-2.5 transition-colors text-sm text-gray-600"
                                onClick={() => setIsOpen(false)}
                            >
                                <span className="text-gray-600">{getSocialIcon(link.platform)}</span>
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
    
    if (isOwnAccount) {
        return (
            <>
                <Button variant="overlay-dark" size="sm" className="px-3 gap-2" onClick={onOpenAnalytics}>
                    <ChartBarIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Analytics</span>
                </Button>
                <Button variant="overlay-dark" size="sm" className="px-3 gap-2" onClick={onEditAccount}>
                    <PencilIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Edit Profile</span>
                </Button>
                {canHaveCatalog && (
                    <Button variant="overlay-dark" size="sm" className="px-3 gap-2" onClick={onOpenCatalog}>
                        <DocumentIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Manage Catalog</span>
                    </Button>
                )}
                <SocialsDropdown links={socialLinks} size="icon-sm" />
                <Button variant="overlay-dark" size="icon-sm" onClick={onShare} title="Share Profile">
                    <ShareIcon className="w-4 h-4" />
                </Button>
            </>
        );
    }
    
    return (
        <>
            <LikeButton isLiked={isLiked} onToggle={onToggleLike} variant={isLiked ? "pill-lightred" : "pill-red"} size="sm" className="gap-2 px-4" includeLabel iconClassName="w-4 h-4" />
            {contactMethods.map(method => (
                <Button as="a" key={method.key} href={method.href} target={method.key === 'message' ? '_blank' : undefined} rel={method.key === 'message' ? 'noopener noreferrer' : undefined} onClick={(e) => onContactAction(e, method)} variant="overlay-dark" size="icon-sm" title={method.label}>
                    <method.icon className="w-4 h-4" />
                </Button>
            ))}
            <SocialsDropdown links={socialLinks} size="icon-sm" />
            <Button variant="overlay-dark" size="icon-sm" onClick={onShare} title="Share Profile"><ShareIcon className="w-4 h-4" /></Button>
        </>
    );
};