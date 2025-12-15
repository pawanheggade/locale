
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useForum } from '../contexts/ForumContext';
import { useAuth } from '../contexts/AuthContext';
import { DisplayableForumPost } from '../types';
import { timeSince } from '../utils/formatters';
import { VoteButtons } from './VoteButtons';
import { Button, TabButton } from './ui/Button';
import { ChatBubbleEllipsisIcon, PlusIcon } from './Icons';
import { CategoryBadge } from './Badges';
import { EmptyState } from './EmptyState';
import { useNavigation } from '../contexts/NavigationContext';
import { useUI } from '../contexts/UIContext';
import { cn } from '../lib/utils';
import { useSwipeToNavigateTabs } from '../hooks/useSwipeToNavigateTabs';
import { Select } from './ui/Select';

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
                className="bg-white rounded-xl border border-gray-200/80 p-3 flex flex-col gap-2 cursor-pointer h-full active:scale-[0.98] transition-transform duration-100"
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
            className="bg-white rounded-xl border border-gray-200/80 p-4 sm:p-5 cursor-pointer active:scale-[0.99] transition-transform duration-100 flex gap-4"
        >
            <div className="flex-shrink-0 pt-1 hidden sm:block">
                 <VoteButtons score={post.score} userVote={userVote} onVote={(vote) => toggleVote('post', post.id, vote)} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <CategoryBadge category={post.category} onClick={(e) => { e.stopPropagation(); onCategoryClick(post.category); }} className="text-[10px] h-auto min-h-0" />
                    <span className="text-xs text-gray-500">&bull; Posted by @{post.author?.username || 'unknown'} &bull; {timeSince(post.timestamp)}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{post.title}</h3>
                <p className="text-gray-600 text-sm line-clamp-2 mb-3">{post.content}</p>
                
                <div className="flex items-center justify-between sm:justify-start gap-4 text-sm text-gray-500">
                    <div className="sm:hidden">
                         <VoteButtons score={post.score} userVote={userVote} onVote={(vote) => toggleVote('post', post.id, vote)} orientation="horizontal" />
                    </div>
                    <div className="flex items-center gap-1.5 hover:bg-gray-100 px-2 py-1 rounded-md transition-colors">
                        <ChatBubbleEllipsisIcon className="w-4 h-4" />
                        <span>{post.commentCount} comments</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ForumsView: React.FC = () => {
    const { posts, categories, activeCategory, setActiveCategory } = useForum();
    const { navigateTo } = useNavigation();
    const { gridView, isTabletOrDesktop } = useUI();
    const { currentAccount } = useAuth();
    const { openModal } = useUI();
    
    const [sortOption, setSortOption] = useState<'latest' | 'trending' | 'oldest'>('latest');

    const swipeRef = useRef<HTMLDivElement>(null);
    const tabs = useMemo(() => ['All', ...categories], [categories]);
    const [animationClass, setAnimationClass] = useState('');
    const prevTabRef = useRef(activeCategory);

    useEffect(() => {
        const prevIndex = tabs.indexOf(prevTabRef.current);
        const currentIndex = tabs.indexOf(activeCategory);

        if (prevIndex !== -1 && prevIndex !== currentIndex) {
            setAnimationClass(currentIndex > prevIndex ? 'animate-slide-in-from-right' : 'animate-slide-in-from-left');
        }
        prevTabRef.current = activeCategory;
    }, [activeCategory, tabs]);

    useSwipeToNavigateTabs({
        tabs,
        activeTab: activeCategory,
        setActiveTab: setActiveCategory,
        swipeRef
    });

    const filteredPosts = useMemo(() => {
        let filtered = posts;
        if (activeCategory && activeCategory !== 'All') {
             filtered = filtered.filter(p => p.category === activeCategory);
        }
        
        return [...filtered].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            
            switch (sortOption) {
                case 'trending': return b.score - a.score;
                case 'oldest': return a.timestamp - b.timestamp;
                case 'latest': 
                default: return b.timestamp - a.timestamp;
            }
        });
    }, [posts, activeCategory, sortOption]);

    const handleCreatePost = () => {
        if (!currentAccount) {
            openModal({ type: 'login' });
            return;
        }
        navigateTo('createForumPost');
    };

    return (
        <div className="animate-fade-in-down p-4 sm:p-6 lg:p-8 pb-24">
            <div className="flex items-center justify-between gap-4 mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Forums</h1>
                <Button onClick={handleCreatePost} variant="pill-red" className="gap-2 shrink-0 h-10 px-3 sm:px-4">
                    <PlusIcon className="w-5 h-5" />
                    <span>Discuss</span>
                </Button>
            </div>

            <div className="mb-2 border-b border-gray-200/80 overflow-x-auto hide-scrollbar">
                <div className="flex space-x-2 pb-1">
                    <TabButton 
                        onClick={() => setActiveCategory('All')} 
                        isActive={activeCategory === 'All'}
                        className="px-3"
                    >
                        All
                    </TabButton>
                    {categories.map(cat => (
                        <TabButton 
                            key={cat} 
                            onClick={() => setActiveCategory(cat)} 
                            isActive={activeCategory === cat}
                            className="px-3"
                        >
                            {cat}
                        </TabButton>
                    ))}
                </div>
            </div>

            <div className="flex justify-end mb-2">
                <Select 
                    value={sortOption} 
                    onChange={(e) => setSortOption(e.target.value as any)}
                    variant="overlay"
                    fullWidth={false}
                    menuAlign="right"
                >
                    <option value="latest">Latest</option>
                    <option value="trending">Trending</option>
                    <option value="oldest">Oldest</option>
                </Select>
            </div>

            <div ref={swipeRef} className="relative overflow-x-hidden">
                <div
                    key={activeCategory} 
                    className={cn(
                        'grid gap-4',
                        isTabletOrDesktop && gridView === 'compact' ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1',
                        animationClass
                    )}
                >
                    {filteredPosts.length > 0 ? (
                        filteredPosts.map(post => (
                            <ForumPostCard 
                                key={post.id} 
                                post={post} 
                                onCategoryClick={setActiveCategory}
                                variant={isTabletOrDesktop && gridView === 'compact' ? 'compact' : 'default'}
                            />
                        ))
                    ) : (
                        <div className="col-span-full">
                            <EmptyState 
                                icon={<ChatBubbleEllipsisIcon />} 
                                title="No discussions found" 
                                description={activeCategory !== 'All' ? `There are no posts in the ${activeCategory} category yet.` : "Be the first to start a discussion!"}
                                className="py-12"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
