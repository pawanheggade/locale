
import React, { useState, useRef, useEffect } from 'react';
import { Account, SocialPlatform, SocialLink, ContactOption } from '../types';
import { Button, ButtonProps } from './ui/Button';
import { LikeButton } from './LikeButton';
import { useClickOutside } from '../hooks/useClickOutside';
import { cn } from '../lib/utils';
import { 
    GlobeAltIcon, 
    PaperAirplaneIcon, 
    InstagramIcon, 
    YouTubeIcon, 
    ChevronDownIcon,
    UserPlusIcon
} from './Icons';

interface ProfileActionsProps {
    account: Account;
    isOwnAccount: boolean;
    socialLinks: SocialLink[];
    onShare: () => void;
    contactMethods: { key: string; icon: React.FC<any>; label: string; href: string; toast: string }[];
    onContactAction: (e: React.MouseEvent, method: { toast: string }) => void;
    isLiked: boolean;
    onToggleLike: () => void;
    onUpdateAccount: (updatedFields: Partial<Account>) => void;
}

const getSocialIcon = (platform: SocialPlatform) => {
    const className = "w-4 h-4";
    switch (platform) {
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
            className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 focus:outline-none focus:bg-gray-50 whitespace-nowrap"
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
                    "rounded-xl border-black text-black",
                    isOpen ? 'bg-gray-100' : ''
                )}
            >
                <ChevronDownIcon className="w-5 h-5 text-black" />
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
    account, isOwnAccount, socialLinks, onShare, contactMethods, onContactAction, isLiked, onToggleLike, onUpdateAccount
}) => {
    
    // This state now drives the UI and triggers saves.
    const [activeContactKey, setActiveContactKey] = useState<string | null>(account.preferredContactMethod || null);

    // Update local state when account prop changes from parent (e.g., after save).
    useEffect(() => {
        setActiveContactKey(account.preferredContactMethod || null);
    }, [account.preferredContactMethod]);

    const handlePrimaryContactChange = (key: string) => {
        // Optimistically update the local state for immediate UI feedback.
        setActiveContactKey(key);
        // Persist the change.
        onUpdateAccount({ preferredContactMethod: key as ContactOption });
    };

    // Calculate Primary Contact based on the current state.
    const primaryContact = 
        contactMethods.find(m => m.key === activeContactKey) || 
        contactMethods.find(m => m.key === 'message') || 
        contactMethods.find(m => m.key === 'mobile') || 
        contactMethods.find(m => m.key === 'email');
    
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
                    icon={UserPlusIcon}
                />
                
                {primaryContact && (
                    isOwnAccount && contactMethods.length > 1 ? (
                        <PrimaryContactDropdown 
                            methods={contactMethods} 
                            primaryLabel={primaryContact.label}
                            primaryIcon={primaryContact.icon}
                            onSelect={handlePrimaryContactChange}
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
        </div>
    );
};
