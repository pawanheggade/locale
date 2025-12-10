import React, { useState, useMemo } from 'react';
import { useForum } from '../contexts/ForumContext';
import { useAuth } from '../contexts/AuthContext';
import { DisplayableForumPost } from '../types';
import { timeSince } from '../utils/formatters';
import { VoteButtons } from './VoteButtons';
import { Button, TabButton } from './ui/Button';
import { ChatBubbleEllipsisIcon, PencilIcon } from './Icons';
import { Avatar } from './Avatar';
import { CategoryBadge } from './Badges';
import { EmptyState } from './EmptyState';
import { useNavigation } from '../contexts/NavigationContext';
import { useUI } from '../contexts/UIContext';
import { cn } from '../lib/utils';

interface ForumPostCardProps {
    post: DisplayableForumPost;
    onCategoryClick: (cat: string) => void;
    variant: 'default' | 'compact';
}

const ForumPostCard: React.FC<ForumPostCardProps> = ({ post, onCategoryClick, variant }) => {
    const { currentAccount } = useAuth();
    const { toggleVote } = useForum();
    const { navigateTo } = useNavigation();
    
    const userVote = currentAccount ? (post.upvotes.includes(currentAccount.id) ? 'up' : post.downvotes.includes(currentAccount.id) ? 'down' : null) : null;
    
    if (variant === 'compact') {
        return (
            <div
                onClick={() => navigateTo('forumPostDetail', { forumPostId: post.id })} 
                className="bg-white rounded-xl border border-gray-200/80 p-3 flex flex-col gap-2 cursor-pointer h-full"
            >
                <div className="flex items-center gap-2 text-xs">
                    
                    <span className="font-semibold text-gray-600 truncate">@{post.author?.username || 'unknown'}</span>
                </div>
                <h3 className="text-sm font-bold text-gray-800 break-words line-clamp-3">{post.title}</h3>
                <div className="flex-grow" />
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                    <VoteButtons score={post.score} userVote={userVote} onVote={(vote) => toggleVote('post', post.id, vote)} orientation="horizontal" />
                    <span className="flex items-center gap-1"><ChatBubbleEllipsisIcon className="w-3 h-3" /> {post.commentCount}</span>
                </div>
            </div>
        );
    }
    
    return (
        <div 
            onClick={() => navigateTo('forumPostDetail', { forumPostId: post.id })} 
            className="bg-white rounded-xl border border-gray-200/80 p-4 flex gap-4 cursor-pointer"
        >
            <VoteButtons score={post.score} userVote={userVote} onVote={(vote) => toggleVote('post', post.id, vote)} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs">
                    
                    <span className="font-semibold text-gray-600">@{post.author?.username || 'unknown'}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mt-1 break-words">{post.title}</h3>
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1.5"><ChatBubbleEllipsisIcon className="w-4 h-4" /> {post.commentCount} Comments</span>
                    <CategoryBadge 
                        category={post.category} 
                        onClick={(e) => { e.stopPropagation(); onCategoryClick(post.category); }}
                        className="text-[10px] h-auto min-h-0" 
                    />
                </div>
            </div>
        </div>
    );
};

interface ForumsViewProps {}

// FIX: Define SortOption type
type SortOption = 'latest' | 'top';

export const ForumsView: React.FC<ForumsViewProps> = () => {
    const { posts, categories, activeCategory, setActiveCategory } = useForum();
    const { openModal, gridView, isTabletOrDesktop } = useUI();
    const { currentAccount } = useAuth();
    const { navigateTo } = useNavigation();
    const [sortOption, setSortOption] = useState<SortOption>('latest');

    const variant = isTabletOrDesktop ? gridView : 'default';

    const displayPosts = useMemo(() => {
        const filtered = activeCategory === 'All' 
            ? posts
            : posts.filter(p => p.category === activeCategory);
        
        // Return a new sorted array to avoid mutating the context state
        return [...filtered].sort((a, b) => {
            if (sortOption === 'top') {
                return b.score - a.score;
            }
            return b.timestamp - a.timestamp; // latest
        });
    }, [posts, activeCategory, sortOption]);

    const handleDiscussClick = () => {
      if (currentAccount) {
        navigateTo('createForumPost');
      } else {
        openModal({ type: 'login' });
      }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in-down">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Forums</h1>
                <Button onClick={handleDiscussClick} size="sm" variant="pill-red" className="shrink-0">
                    <PencilIcon className="w-4 h-4 mr-2" />
                    Create Post
                </Button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200/80 mb-6 overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-center border-b border-gray-200">
                     <div className="flex space-x-4 px-4 overflow-x-auto hide-scrollbar w-full sm:w-auto">
                        <TabButton onClick={() => setActiveCategory('All')} isActive={activeCategory === 'All'} size="sm">All</TabButton>
                        {categories.map(cat => (
                            <TabButton key={cat} onClick={() => setActiveCategory(cat)} isActive={activeCategory === cat} size="sm">{cat}</TabButton>
                        ))}
                     </div>
                     <div className="flex items-center gap-2 p-3">
                         <Button 
                            onClick={() => setSortOption('latest')} 
                            variant={sortOption === 'latest' ? 'secondary' : 'ghost'}
                            size="xs"
                            className="rounded-xl font-semibold"
                         >
                            Latest
                         </Button>
                         <Button 
                            onClick={() => setSortOption('top')} 
                            variant={sortOption === 'top' ? 'secondary' : 'ghost'}
                            size="xs"
                            className="rounded-xl font-semibold"
                         >
                            Top
                         </Button>
                     </div>
                </div>
            </div>

            {displayPosts.length > 0 ? (
                <div className={cn(
                    variant === 'compact' 
                        ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2' 
                        : 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'
                )}>
                    {displayPosts.map(post => <ForumPostCard key={post.id} post={post} onCategoryClick={setActiveCategory} variant={variant} />)}
                </div>
            ) : (
                <EmptyState
                    icon={<ChatBubbleEllipsisIcon />}
                    title="No Posts Yet"
                    description={activeCategory === 'All'
                        ? "Be the first to create a forum post!"
                        : `Be the first to create a forum post in the "${activeCategory}" category.`
                    }
                    className="py-20"
                />
            )}
        </div>
    );
};