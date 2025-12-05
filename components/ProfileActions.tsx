import React, { useState, useRef, useEffect } from 'react';
import { Account, SocialPlatform, SocialLink } from '../types';
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
    YouTubeIcon,
    ChevronDownIcon
} from './Icons';

interface ProfileActionsProps {
    account: Account;
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
    const className = "w-4 h-4";
    switch (platform) {
        case 'facebook': return <FacebookIcon className={className} />;
        case 'twitter': return <XIcon className={className} />;
        case 'instagram': return <InstagramIcon className={className} />;
        case 'youtube': return <YouTubeIcon className={className} />;
        case 'website': return <GlobeAltIcon className={className} />;
        default: return <GlobeAltIcon className={className} />;
    }
};

// Reusable list item to reduce code duplication in dropdowns
const DropdownItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick: (e: React.MouseEvent) => void;
    href?: string;
    target?: string;
    rel?: string;
}> = ({ icon, label, onClick, href, target, rel }) => {
    const Component = href ? 'a' : 'button';
    return (
        <Component
            href={href}
            target={target}
            rel={rel}
            onClick={onClick}
            className="w-full text-left flex items-center gap-3 px-4 py-2.5 transition-colors text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:bg-gray-50 whitespace-nowrap"
        >
            <span className="text-gray-500 flex-shrink-0">{icon}</span>
            <span className="font-medium">{label}</span>
        </Component>
    );
};

const ConnectDropdown = ({ 
    contacts, 
    socialLinks, 
    onShare, 
    onContactAction 
}: { 
    contacts: any[], 
    socialLinks: SocialLink[],
    onShare: () => void,
    onContactAction: (e: React.MouseEvent, method: { toast: string }) => void 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    useClickOutside(menuRef, () => setIsOpen(false), isOpen);

    const hasContacts = contacts && contacts.length > 0;
    const hasSocials = socialLinks && socialLinks.length > 0;
    const hasContent = hasContacts || hasSocials || !!onShare;
    if (!hasContent) return null;

    return (
        <div className="relative" ref={menuRef}>
            <Button
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                variant="outline"
                size="icon"
                title="More actions"
                className={cn(
                    "rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50",
                    isOpen ? 'bg-gray-100' : ''
                )}
            >
                <ChevronDownIcon className="w-5 h-5 text-gray-500" />
            </Button>
            {isOpen && (
                <div className="absolute top-full right-0 sm:left-0 sm:right-auto mt-2 w-auto bg-white rounded-xl border border-gray-100 shadow-lg z-50 animate-zoom-in overflow-hidden origin-top-right sm:origin-top-left">
                    <div className="py-1">
                        {hasContacts && contacts.map((method) => (
                            <DropdownItem
                                key={method.key}
                                href={method.href}
                                onClick={(e) => { onContactAction(e, method); setIsOpen(false); }}
                                icon={<method.icon className="w-4 h-4" />}
                                label={method.label}
                            />
                        ))}
                        
                        {hasContacts && (hasSocials || onShare) && <div className="my-1 h-px bg-gray-100" />}

                        {hasSocials && socialLinks.map((link) => (
                             <DropdownItem
                                key={link.platform}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setIsOpen(false)}
                                icon={getSocialIcon(link.platform)}
                                label={link.platform.charAt(0).toUpperCase() + link.platform.slice(1)}
                            />
                        ))}
                        
                        {hasSocials && onShare && <div className="my-1 h-px bg-gray-100" />}
                        
                        {onShare && (
                            <DropdownItem
                                onClick={(e) => { e.stopPropagation(); onShare(); setIsOpen(false); }}
                                icon={<PaperAirplaneIcon className="w-4 h-4" />}
                                label="Share"
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const PrimaryContactDropdown = ({ 
    methods, 
    primaryLabel, 
    primaryIcon: PrimaryIcon,
    onSelect
}: { 
    methods: { key: string; icon: React.FC<any>; label: string; href: string; toast: string }[],
    primaryLabel: string,
    primaryIcon: React.FC<any>,
    onSelect: (key: string) => void
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    useClickOutside(menuRef, () => setIsOpen(false), isOpen);

    if (!methods || methods.length === 0) return null;

    return (
        <div className="relative flex-1 sm:flex-none" ref={menuRef}>
            <Button
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                variant="pill-dark"
                className="w-full sm:w-auto justify-center gap-2 px-6"
            >
                <PrimaryIcon className="w-5 h-5" />
                <span>{primaryLabel}</span>
                <ChevronDownIcon className="w-4 h-4 ml-1 opacity-70" />
            </Button>
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-auto bg-white rounded-xl border border-gray-100 shadow-lg z-50 animate-zoom-in overflow-hidden origin-top-left">
                    <div className="py-1">
                        {methods.map((method) => (
                            <DropdownItem
                                key={method.key}
                                onClick={(e) => { 
                                    e.preventDefault();
                                    e.stopPropagation(); 
                                    onSelect(method.key); 
                                    setIsOpen(false); 
                                }}
                                icon={<method.icon className="w-4 h-4" />}
                                label={method.label}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export const ProfileActions: React.FC<ProfileActionsProps> = ({ 
    account, isOwnAccount, canHaveCatalog, onEditAccount, onOpenCatalog, onOpenAnalytics, 
    socialLinks, onShare, contactMethods, onContactAction, isLiked, onToggleLike
}) => {
    
    // Local state to allow owner to switch the visible primary contact for preview
    const [activeContactKey, setActiveContactKey] = useState<string | null>(null);

    const isPaidTier = ['Verified', 'Business', 'Organisation'].includes(account.subscription.tier);

    // Calculate Primary Contact
    // Priority: User Selected > Message > Mobile > Email
    const primaryContact = 
        contactMethods.find(m => m.key === activeContactKey) || 
        contactMethods.find(m => m.key === 'message') || 
        contactMethods.find(m => m.key === 'mobile') || 
        contactMethods.find(m => m.key === 'email');
    
    // Ensure activeContactKey is valid if methods change
    useEffect(() => {
        if (activeContactKey && !contactMethods.some(m => m.key === activeContactKey)) {
            setActiveContactKey(null);
        }
    }, [contactMethods, activeContactKey]);

    // Filter out primary from the list to show remaining as secondary icons
    const secondaryContacts = contactMethods.filter(m => m !== primaryContact);

    return (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 w-full">
            
            {/* Left-aligned actions (for everyone) */}
            <div className="flex flex-wrap gap-2 w-full sm:w-auto items-stretch">
                <LikeButton 
                    isLiked={isLiked} 
                    onToggle={onToggleLike} 
                    variant={isLiked ? "pill-lightred" : "pill-red"} 
                    className="flex-1 sm:flex-none sm:w-auto justify-center gap-2 px-6" 
                    includeLabel 
                    iconClassName="w-5 h-5"
                />
                
                {primaryContact && (
                    isOwnAccount && contactMethods.length > 1 ? (
                        <PrimaryContactDropdown 
                            methods={contactMethods} 
                            primaryLabel={primaryContact.label}
                            primaryIcon={primaryContact.icon}
                            onSelect={setActiveContactKey}
                        />
                    ) : (
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
                    )
                )}
                 <ConnectDropdown 
                    contacts={secondaryContacts}
                    socialLinks={socialLinks}
                    onShare={onShare}
                    onContactAction={onContactAction}
                />
            </div>

            {/* Right-aligned Owner Management Buttons */}
            {isOwnAccount && (
                <div className="flex flex-wrap gap-1.5 w-full sm:w-auto items-center pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 justify-start sm:justify-end">
                    {isPaidTier && (
                        <Button 
                            onClick={onOpenAnalytics} 
                            variant="overlay-dark"
                            size="sm"
                            className="bg-gray-100 hover:bg-gray-200 border-transparent text-gray-700 rounded-xl gap-1.5 px-3"
                        >
                            <ChartBarIcon className="w-5 h-5" />
                            <span>Analytics</span>
                        </Button>
                    )}
                    <Button 
                        onClick={onEditAccount} 
                        variant="overlay-dark"
                        size="sm"
                        className="bg-gray-100 hover:bg-gray-200 border-transparent text-gray-700 rounded-xl gap-1.5 px-3"
                    >
                        <PencilIcon className="w-5 h-5" />
                        <span>Edit Profile</span>
                    </Button>
                    {canHaveCatalog && (
                        <Button 
                            onClick={onOpenCatalog} 
                            variant="overlay-dark" 
                            size="sm"
                            className="bg-gray-100 hover:bg-gray-200 border-transparent text-gray-700 rounded-xl gap-1.5 px-3"
                        >
                            <DocumentIcon className="w-5 h-5" />
                            <span>Catalogs</span>
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};