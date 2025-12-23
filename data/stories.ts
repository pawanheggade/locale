
import { StoryPost } from '../types';

export const mockStoryPosts: StoryPost[] = [
  {
    id: 'story-1',
    authorId: 'user-1',
    media: { type: 'image', url: 'https://picsum.photos/seed/story1_armchair/1080/1920' },
    timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
    expiryTimestamp: Date.now() + 22 * 60 * 60 * 1000, // Expires in 22 hours
    linkPostId: (Date.now() - 1 * 24 * 60 * 60 * 1000).toString(), // Links to 'Restored Mid-Century Modern Armchair'
    viewedBy: [],
    likedBy: [],
  },
  {
    id: 'story-2',
    authorId: 'user-1',
    media: { type: 'video', url: 'https://www.w3schools.com/tags/movie.mp4' },
    timestamp: Date.now() - 1 * 60 * 60 * 1000, // 1 hour ago
    expiryTimestamp: Date.now() + 23 * 60 * 60 * 1000, // Expires in 23 hours
    linkPostId: (Date.now() - 4 * 24 * 60 * 60 * 1000).toString(), // Links to 'Minimalist Solid Oak Desk'
    viewedBy: [],
    likedBy: [],
  },
  {
    id: 'story-3',
    authorId: 'user-4',
    media: { type: 'image', url: 'https://picsum.photos/seed/story3_veggies/1080/1920' },
    timestamp: Date.now() - 5 * 60 * 60 * 1000, // 5 hours ago
    expiryTimestamp: Date.now() + 19 * 60 * 60 * 1000, // Expires in 19 hours
    linkPostId: (Date.now() - 12 * 60 * 60 * 1000).toString(), // Links to 'Weekly Organic Veggie Box'
    viewedBy: [],
    likedBy: [],
  },
  {
    id: 'story-4',
    authorId: 'user-2',
    media: { type: 'image', url: 'https://picsum.photos/seed/story4_design/1080/1920' },
    timestamp: Date.now() - 8 * 60 * 60 * 1000, // 8 hours ago
    expiryTimestamp: Date.now() + 16 * 60 * 60 * 1000, // Expires in 16 hours
    linkPostId: null,
    viewedBy: ['user-1'],
    likedBy: ['user-1'],
  },
   {
    id: 'story-5-expired',
    authorId: 'user-3',
    media: { type: 'image', url: 'https://picsum.photos/seed/story5_expired/1080/1920' },
    timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
    expiryTimestamp: Date.now() - 1 * 60 * 60 * 1000, // Expired 1 hour ago
    linkPostId: null,
    viewedBy: ['user-1', 'user-2'],
    likedBy: [],
  },
];
