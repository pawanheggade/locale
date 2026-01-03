
import React, { useState } from 'react';
import { InstagramPost } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { SpinnerIcon, InstagramIcon } from './Icons';
import { fetchInstagramPosts } from '../utils/instagram';
import { useNavigation } from '../contexts/NavigationContext';
import { EmptyState } from './EmptyState';

export const ImportPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const { navigateTo } = useNavigation();

  const handleFetch = async () => {
    if (!username.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      const fetchedPosts = await fetchInstagramPosts(username);
      setPosts(fetchedPosts);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = (post: InstagramPost) => {
    navigateTo('createPost', { 
        prefillData: {
            description: post.caption,
            media: [{ type: 'image', url: post.media_url }],
        }
    });
  };

  const handleBack = () => {
    setStep(1);
    setPosts([]);
    setError('');
  };

  return (
    <div className="animate-fade-in-down max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
              {step === 1 ? 'Import from Instagram' : `Posts for @${username}`}
          </h1>
          {step === 2 && <Button variant="outline" onClick={handleBack}>Go Back</Button>}
      </div>
      
      <div className="min-h-[60vh] flex flex-col">
          {step === 1 && (
               <div className="flex flex-col items-center justify-center flex-1 text-center">
                  <InstagramIcon className="w-16 h-16 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 max-w-sm mb-4">Enter your Instagram username to fetch your recent posts. This feature helps you quickly create Locale posts from your existing content.</p>
                   <div className="w-full max-w-sm flex gap-2">
                      <Input 
                          value={username} 
                          onChange={e => setUsername(e.target.value)} 
                          placeholder="@username"
                          onKeyDown={e => e.key === 'Enter' && handleFetch()}
                          autoFocus
                      />
                      <Button onClick={handleFetch} isLoading={isLoading} disabled={!username.trim()}>Fetch Posts</Button>
                   </div>
                   {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
                   <p className="text-xs text-gray-500 mt-4 max-w-sm">
                       Note: This is a demonstration. No real data is fetched from Instagram. Mock data is used for illustrative purposes.
                   </p>
               </div>
          )}
          {step === 2 && (
              <div className="flex-1 flex flex-col min-h-0">
                  {isLoading ? (
                      <div className="flex-1 flex items-center justify-center"><SpinnerIcon className="w-8 h-8 text-red-600" /></div>
                  ) : posts.length === 0 ? (
                      <EmptyState 
                          icon={<InstagramIcon />}
                          title="No Posts Found"
                          description="We couldn't find any posts for this username. Please go back and try a different one."
                          action={<Button onClick={handleBack}>Go Back</Button>}
                      />
                  ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto">
                          {posts.map(post => (
                              <div key={post.id} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                  <img src={post.media_url} alt="Instagram post" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                                      <Button variant="pill-red" size="sm" onClick={() => handleImport(post)}>Import</Button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          )}
      </div>
  </div>
  );
};

export default ImportPage;
