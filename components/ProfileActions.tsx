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
    isMobile?: boolean;
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
    socialLinks, onShare, contactMethods, onContactAction, isLiked, onToggleLike, isMobile 
}) => {
    const btnSize = isMobile ? 'sm' : 'sm';
    const iconBtnSize = isMobile ? 'icon' : 'icon-sm';
    const btnClass = isMobile ? 'justify-center gap-2 px-3' : 'gap-2 px-3';
    
    if (isOwnAccount) {
        return (
            <div className="flex w-full flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    {/* Public-facing actions (Contacts, Socials, Share) */}
                    {contactMethods.map(method => (
                        <Button as="a" key={method.key} href={method.href} target={method.key === 'message' ? '_blank' : undefined} rel={method.key === 'message' ? 'noopener noreferrer' : undefined} onClick={(e) => onContactAction(e, method)} variant="overlay-dark" size={iconBtnSize} title={method.label}>
                            <method.icon className="w-4 h-4" />
                        </Button>
                    ))}
                    <SocialsDropdown links={socialLinks} size={iconBtnSize} />
                    <Button variant="overlay-dark" size={iconBtnSize} onClick={onShare} title="Share Profile">
                        <PaperAirplaneIcon className="w-4 h-4" />
                    </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {/* Management actions (Analytics, Edit, Catalog) on a new line */}
                    <Button variant="overlay-dark" size={btnSize} className={btnClass} onClick={onOpenAnalytics}>
                        <ChartBarIcon className="w-4 h-4" />
                        Analytics
                    </Button>
                    <Button variant="overlay-dark" size={btnSize} className={btnClass} onClick={onEditAccount}>
                        <PencilIcon className="w-4 h-4" />
                        {isMobile ? 'Edit' : <span className="hidden md:inline">Edit Profile</span>}
                        {!isMobile && <span className="md:hidden">Edit</span>}
                    </Button>
                    {canHaveCatalog && (
                        <Button variant="overlay-dark" size={btnSize} className={btnClass} onClick={onOpenCatalog}>
                            <DocumentIcon className="w-4 h-4" />
                            {isMobile ? 'Catalog' : <span className="hidden md:inline">Manage Catalog</span>}
                            {!isMobile && <span className="md:hidden">Catalog</span>}
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <>
            {isMobile && (
                <LikeButton isLiked={isLiked} onToggle={onToggleLike} variant={isLiked ? "pill-lightred" : "pill-red"} className="flex-1 justify-center gap-2" includeLabel />
            )}
            {!isMobile && (
                <LikeButton isLiked={isLiked} onToggle={onToggleLike} variant={isLiked ? "pill-lightred" : "pill-red"} size="sm" className="gap-2 px-6" includeLabel iconClassName="w-4 h-4" />
            )}
            {contactMethods.map(method => (
                <Button as="a" key={method.key} href={method.href} target={method.key === 'message' ? '_blank' : undefined} rel={method.key === 'message' ? 'noopener noreferrer' : undefined} onClick={(e) => onContactAction(e, method)} variant="overlay-dark" size={iconBtnSize} title={method.label}>
                    <method.icon className="w-4 h-4" />
                </Button>
            ))}
            <SocialsDropdown links={socialLinks} size={iconBtnSize} />
            <Button variant="overlay-dark" size={iconBtnSize} onClick={onShare} title="Share Profile">
                <PaperAirplaneIcon className="w-4 h-4" />
            </Button>
        </>
    );
};