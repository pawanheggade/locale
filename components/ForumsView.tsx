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
import { useNavigation } from '../App';
import { useUI } from '../contexts/UIContext';

const ForumPostCard: React.FC<{ post: DisplayableForumPost, onCategoryClick: (cat: string) => void }> = ({ post, onCategoryClick }) => {
    const { currentAccount } = useAuth();
    const { toggleVote } = useForum();
    const { navigateTo } = useNavigation();
    
    const userVote = currentAccount ? (post.upvotes.includes(currentAccount.id) ? 'up' : post.downvotes.includes(currentAccount.id) ? 'down' : null) : null;
    
    return (
        <div 
            onClick={() => navigateTo('forumPostDetail', { forumPostId: post.id })} 
            className="bg-white rounded-xl border border-gray-200/80 p-4 flex gap-4 cursor-pointer transition-shadow"
        >
            <VoteButtons score={post.score} userVote={userVote} onVote={(vote) => toggleVote('post', post.id, vote)} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs">
                    <Avatar src={post.author?.avatarUrl} alt={post.author?.name} size="xs" tier={post.author?.subscription.tier} />
                    <span className="font-semibold text-gray-600">{post.author?.name || 'Unknown User'}</span>
                    <span className="text-gray-500">&bull;</span>
                    <span className="text-gray-500">{timeSince(post.timestamp)}</span>
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

type SortOption = 'latest' | 'top';

export const ForumsView: React.FC = () => {
    const { posts, categories, activeCategory, setActiveCategory } = useForum();
    const { openModal } = useUI();
    const { currentAccount } = useAuth();
    const { navigateTo } = useNavigation();
    const [sortOption, setSortOption] = useState<SortOption>('latest');

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
                    Discuss
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

            <div className="space-y-4">
                {displayPosts.length > 0 ? (
                    displayPosts.map(post => <ForumPostCard key={post.id} post={post} onCategoryClick={setActiveCategory} />)
                ) : (
                    <EmptyState
                        icon={<ChatBubbleEllipsisIcon />}
                        title="No Discussions Yet"
                        description={activeCategory === 'All'
                            ? "Be the first to start a conversation!"
                            : `Be the first to start a discussion in the "${activeCategory}" category.`
                        }
                        className="py-20"
                    />
                )}
            </div>
        </div>
    );
};