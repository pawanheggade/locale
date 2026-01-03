
import { InstagramPost } from '../types';

// A mock function to simulate fetching Instagram posts.
// In a real application, this would involve a server-side call to the Instagram Graph API.
export const fetchInstagramPosts = (username: string): Promise<InstagramPost[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const postCount = Math.floor(Math.random() * 8) + 8; // 8 to 15 posts
      const mockPosts: InstagramPost[] = Array.from({ length: postCount }, (_, i) => {
        const timestamp = Date.now() - (i * 24 * 60 * 60 * 1000) - (Math.random() * 24 * 60 * 60 * 1000);
        return {
          id: `insta-${username}-${timestamp}`,
          media_url: `https://picsum.photos/seed/${username}${i}/500/500`,
          caption: `This is a sample caption for post #${i + 1} from ${username}. #sample #mockdata #localeapp`,
          timestamp: new Date(timestamp).toISOString(),
          media_type: 'IMAGE',
        };
      });
      resolve(mockPosts);
    }, 1500); // Simulate network delay
  });
};
