
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';
import { useUI } from '../contexts/UIContext';
import { useConfirmationModal } from '../hooks/useConfirmationModal';
import { 
    PlusIcon, 
    ChartBarIcon, 
    DocumentIcon, 
    PencilIcon, 
    Cog6ToothIcon, 
    ChatBubbleEllipsisIcon,
    ChevronRightIcon,
    UserIcon,
    CashIcon,
    GlobeAltIcon,
    VideoPostcardIcon
} from './Icons';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { Avatar } from './Avatar';

const StudioCard: React.FC<{
    title: string;
    description: string;
    icon: React.ReactNode;
    onClick: () => void;
    badgeCount?: number;
    className?: string;
    proFeature?: boolean;
}> = ({ title, description, icon, onClick, badgeCount, className, proFeature }) => (
    <div 
        onClick={onClick}
        className={cn(
            "bg-white rounded-xl border border-gray-200/80 p-5 flex items-center gap-4 cursor-pointer hover:border-gray-300 hover:bg-gray-50/50 active:scale-[0.99] transition-all group relative",
            className
        )}
    >
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-700 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-red-600 transition-colors">{title}</h3>
                {proFeature && (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full uppercase">
                        Subscribe
                    </span>
                )}
            </div>
            <p className="text-sm text-gray-600 truncate mt-0.5">{description}</p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
            {badgeCount !== undefined && badgeCount > 0 && (
                 <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                     {badgeCount > 99 ? '99+' : badgeCount}
                 </span>
            )}
            <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
        </div>
    </div>
);

export const StudioPage: React.FC = () => {
    const { currentAccount, signOut } = useAuth();
    const { navigateTo } = useNavigation();
    const { openModal } = useUI();
    const showConfirmation = useConfirmationModal();

    if (!currentAccount) return null;

    const isPersonalTier = currentAccount.subscription.tier === 'Personal';
    const isPaidTier = ['Verified', 'Business', 'Organisation'].includes(currentAccount.subscription.tier);
    const canHaveCatalog = isPaidTier;
    const isAdmin = currentAccount.role === 'admin';

    const handleCreatePost = () => {
        if (currentAccount.subscription.tier === 'Personal') {
            navigateTo('subscription');
        } else {
            navigateTo('createPost');
        }
    };
    
    const handleCreateStory = () => {
        if (currentAccount.subscription.tier === 'Personal') {
            navigateTo('subscription');
        } else {
            navigateTo('createStoryPost');
        }
    };

    const handleAnalyticsClick = () => {
        if (isPaidTier) {
            navigateTo('accountAnalytics', { account: currentAccount });
        } else {
            navigateTo('subscription');
        }
    };

    const handleCatalogClick = () => {
        if (canHaveCatalog) {
            navigateTo('manageCatalog', { account: currentAccount });
        } else {
            navigateTo('subscription');
        }
    };

    const handleSignOut = () => {
        showConfirmation({
            title: 'Sign Out',
            message: 'Are you sure you want to sign out?',
            onConfirm: () => {
                signOut();
                navigateTo('all');
            },
            confirmText: 'Sign Out',
            confirmClassName: 'bg-red-600 text-white',
        });
    };

    return (
        <div className="animate-fade-in-down p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto pb-24">
            <div className="flex items-center gap-4 mb-8">
                <Avatar 
                    src={currentAccount.avatarUrl} 
                    alt={currentAccount.name} 
                    size="lg" 
                    tier={currentAccount.subscription.tier}
                    className="border-2 border-white shadow-sm cursor-pointer active:scale-95 transition-transform"
                    onClick={() => navigateTo('account', { account: currentAccount })}
                />
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Studio</h1>
                    <p className="text-gray-600">Manage your presence on Locale</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isAdmin && (
                    <StudioCard 
                        title="Admin Panel" 
                        description="Manage accounts, posts, and reports." 
                        icon={<UserIcon className="w-6 h-6" />} 
                        onClick={() => navigateTo('admin')}
                        className="sm:col-span-2 border-slate-200 bg-slate-50"
                    />
                )}

                {/* Primary Actions */}
                 <StudioCard 
                    title="Create Story" 
                    description="Post a 24-hour update." 
                    icon={<VideoPostcardIcon className="w-6 h-6" />} 
                    onClick={handleCreateStory}
                    proFeature={isPersonalTier}
                />
                <StudioCard 
                    title="Create Post" 
                    description="List a new item or service." 
                    icon={<PlusIcon className="w-6 h-6" />} 
                    onClick={handleCreatePost}
                    proFeature={isPersonalTier}
                />

                <StudioCard 
                    title="Create Discussion" 
                    description="Start a topic in the forums." 
                    icon={<ChatBubbleEllipsisIcon className="w-6 h-6" />} 
                    onClick={() => navigateTo('createForumPost')}
                />

                <StudioCard 
                    title="Analytics" 
                    description="View performance insights." 
                    icon={<ChartBarIcon className="w-6 h-6" />} 
                    onClick={handleAnalyticsClick}
                    proFeature={!isPaidTier}
                />

                <StudioCard 
                    title="Catalog" 
                    description="Manage your product catalog." 
                    icon={<DocumentIcon className="w-6 h-6" />} 
                    onClick={handleCatalogClick}
                    proFeature={!canHaveCatalog}
                />
                
                <StudioCard 
                    title="Socials" 
                    description="Manage your social media links." 
                    icon={<GlobeAltIcon className="w-6 h-6" />} 
                    onClick={() => openModal({ type: 'editSocials' })}
                />
                
                <StudioCard 
                    title="Edit Profile" 
                    description="Update bio, contact info, and more." 
                    icon={<PencilIcon className="w-6 h-6" />} 
                    onClick={() => navigateTo('editProfile', { account: currentAccount })}
                />
                
                <StudioCard 
                    title="Settings" 
                    description="App preferences and account actions." 
                    icon={<Cog6ToothIcon className="w-6 h-6" />} 
                    onClick={() => navigateTo('settings')}
                />

                <StudioCard 
                    title="Subscription" 
                    description="Manage your plan and billing." 
                    icon={<CashIcon className="w-6 h-6" />} 
                    onClick={() => navigateTo('subscription')}
                />
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-200/80 flex flex-col items-center gap-4">
                 <Button variant="link" onClick={() => navigateTo('account', { account: currentAccount })} className="text-gray-600 text-sm">
                    View Public Profile
                 </Button>
                 
                 <Button variant="ghost" onClick={handleSignOut} className="text-red-600 text-sm hover:bg-red-50">
                    Sign Out
                 </Button>
            </div>
        </div>
    );
};

export default StudioPage;