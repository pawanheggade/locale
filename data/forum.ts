import { ForumPost, ForumComment } from '../types';

export const mockForumCategories = ['General', 'Products', 'Services', 'Events', 'Questions'];

export const mockForumPosts: ForumPost[] = [
    {
        id: 'fp-1',
        authorId: 'user-1',
        title: 'Best place to source vintage teak wood in Mumbai?',
        content: "I'm restoring a few pieces and my usual supplier has run dry. Does anyone have recommendations for reliable sources for ethically sourced, old teak wood in or around Mumbai? Looking for quality over quantity. Thanks in advance!",
        timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
        category: 'Products',
        upvotes: ['user-2', 'user-3'],
        downvotes: [],
        isPinned: true,
    },
    {
        id: 'fp-2',
        authorId: 'user-2',
        title: 'Showcase: My latest interior design project in Bengaluru',
        content: "Just wrapped up a project for a client in Indiranagar and wanted to share the results! We went for a minimalist Scandinavian theme with lots of natural light. The client's favorite part was the custom bookshelf we designed. Let me know what you think!",
        timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
        category: 'General',
        upvotes: ['user-1', 'user-3', 'user-4', 'user-6'],
        downvotes: [],
        isPinned: false,
    },
    {
        id: 'fp-3',
        authorId: 'user-4',
        title: 'Question about veggie box subscriptions',
        content: "For those of you who subscribe to veggie boxes, how do you handle weeks when you're traveling? Can you typically pause subscriptions? Also, any tips for using up everything before the next box arrives?",
        timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000,
        category: 'Questions',
        upvotes: ['user-6'],
        downvotes: [],
        isPinned: false,
    }
];

export const mockForumComments: ForumComment[] = [
    {
        id: 'fc-1',
        postId: 'fp-1',
        authorId: 'user-3',
        content: "Have you tried the timber market in Dharavi? It can be a bit chaotic, but I've found some real gems there for my textile projects. You need to be prepared to haggle, though.",
        timestamp: Date.now() - 23 * 60 * 60 * 1000,
        parentId: null,
        upvotes: ['user-1', 'user-2'],
        downvotes: [],
    },
    {
        id: 'fc-2',
        postId: 'fp-1',
        authorId: 'user-1',
        content: "Thanks @ananya_das! I've heard of it but was a bit intimidated. Good to know it's worth a look. Any specific sellers you'd recommend?",
        timestamp: Date.now() - 22 * 60 * 60 * 1000,
        parentId: 'fc-1',
        upvotes: ['user-3'],
        downvotes: [],
    },
    {
        id: 'fc-3',
        postId: 'fp-1',
        authorId: 'user-3',
        content: "I don't have a specific name, but look for the older shops in the back alleys. They usually have the best quality wood. Good luck!",
        timestamp: Date.now() - 21 * 60 * 60 * 1000,
        parentId: 'fc-2',
        upvotes: ['user-1'],
        downvotes: [],
    },
    {
        id: 'fc-4',
        postId: 'fp-2',
        authorId: 'user-1',
        content: "Wow, @rohan_mehta, this looks stunning! The use of light and space is incredible. That bookshelf is a work of art.",
        timestamp: Date.now() - 47 * 60 * 60 * 1000,
        parentId: null,
        upvotes: ['user-2', 'user-3'],
        downvotes: [],
    },
    {
        id: 'fc-5',
        postId: 'fp-3',
        authorId: 'user-1',
        content: "Most services I've seen let you pause with a week's notice. As for using things up, I make a big batch of soup or a stir-fry at the end of the week with whatever is left!",
        timestamp: Date.now() - 95 * 60 * 60 * 1000,
        parentId: null,
        upvotes: ['user-4'],
        downvotes: [],
    },
];