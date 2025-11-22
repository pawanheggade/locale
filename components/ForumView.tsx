
import React, { useState, useMemo } from 'react';
import { useForum } from '../contexts/ForumContext';
import { useAuth } from '../contexts/AuthContext';
import { DisplayableForumPost } from '../types';
import { usePostActions } from '../contexts/PostActionsContext';
import { timeSince } from '../utils/formatters';
import { VoteButtons } from './VoteButtons';
import { Button, TabButton } from './ui/Button';
import { ChatBubbleBottomCenterTextIcon, PencilIcon } from './Icons';
import { Avatar } from './Avatar';

const ForumPostCard: React.FC<{ post: DisplayableForumPost }> = ({ post }) => {
    const { currentAccount } = useAuth();
    const { toggleVote } = useForum();
    const { onViewForumPost } = usePostActions();
    
    const userVote = currentAccount ? (post.upvotes.includes(currentAccount.id) ? 'up' : post.downvotes.includes(currentAccount.id) ? 'down' : null) : null;
    
    return (
        <div 
            onClick={() => onViewForumPost(post.id)} 
            className="bg-white rounded-lg shadow-md p-4 flex gap-4 cursor-pointer transition-shadow"
        >
            <VoteButtons score={post.score} userVote={userVote} onVote={(vote) => toggleVote('post', post.id, vote)} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs">
                    <Avatar src={post.author?.avatarUrl} alt={post.author?.name} size="xs" tier={post.author?.subscription.tier} />
                    <span className="font-semibold text-gray-700">{post.author?.name || 'Unknown User'}</span>
                    <span className="text-gray-500">&bull;</span>
                    <span className="text-gray-500">{timeSince(post.timestamp)}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mt-1 truncate">{post.title}</h3>
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1.5"><ChatBubbleBottomCenterTextIcon className="w-4 h-4" /> {post.commentCount} Comments</span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{post.category}</span>
                </div>
            </div>
        </div>
    );
};

type SortOption = 'latest' | 'top';

export const ForumView: React.FC = () => {
    const { posts, categories } = useForum();
    const { onCreateForumPost } = usePostActions();
    const [activeCategory, setActiveCategory] = useState<string>('All');
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

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Community Forum</h1>
                <Button onClick={onCreateForumPost} size="sm" variant="glass-red" className="shrink-0">
                    <PencilIcon className="w-4 h-4 mr-2" />
                    Discuss
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 p-4 bg-white rounded-lg shadow-sm">
                 <div className="flex space-x-2 p-1 bg-gray-100 rounded-full overflow-x-auto hide-scrollbar max-w-full sm:max-w-2xl">
                    <TabButton onClick={() => setActiveCategory('All')} isActive={activeCategory === 'All'} size="sm">All</TabButton>
                    {categories.map(cat => (
                        <TabButton key={cat} onClick={() => setActiveCategory(cat)} isActive={activeCategory === cat} size="sm">{cat}</TabButton>
                    ))}
                 </div>
                 <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-full">
                     <button 
                        onClick={() => setSortOption('latest')} 
                        className={`px-3 py-1 text-sm font-semibold rounded-full transition-all ${sortOption === 'latest' ? 'glass-button-pill bg-white shadow text-gray-900' : 'text-gray-600'}`}
                     >
                        Latest
                     </button>
                     <button 
                        onClick={() => setSortOption('top')} 
                        className={`px-3 py-1 text-sm font-semibold rounded-full transition-all ${sortOption === 'top' ? 'glass-button-pill bg-white shadow text-gray-900' : 'text-gray-600'}`}
                     >
                        Top
                     </button>
                 </div>
            </div>

            <div className="space-y-4">
                {displayPosts.length > 0 ? (
                    displayPosts.map(post => <ForumPostCard key={post.id} post={post} />)
                ) : (
                    <div className="text-center py-20 flex flex-col items-center">
                        <ChatBubbleBottomCenterTextIcon className="w-16 h-16 text-gray-300" />
                        <h2 className="text-2xl font-semibold text-gray-700 mt-4">No Discussions Yet</h2>
                        <p className="text-gray-500 mt-2 max-w-md">
                            {activeCategory === 'All'
                                ? "Be the first to start a conversation!"
                                : `Be the first to start a discussion in the "${activeCategory}" category.`
                            }
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
