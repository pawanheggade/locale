
import React, { useState, useEffect } from 'react';
import { Post, Media } from '../types';
import { useMediaUploader } from '../hooks/useMediaUploader';
import { MediaUploader } from './MediaUploader';
import { usePosts } from '../contexts/PostsContext';
import { useNavigation } from '../contexts/NavigationContext';
import { useAuth } from '../contexts/AuthContext';
import { FixedPageFooter } from './FixedPageFooter';
import { FormField } from './FormField';
import { Select } from './ui/Select';
import { useStory } from '../contexts/StoryContext';
import { Textarea } from './ui/Textarea';

const MAX_FILES = 1;
const MAX_FILE_SIZE_MB = 15;
const DESCRIPTION_MAX_LENGTH = 200;

export const CreateStoryPostPage: React.FC = () => {
    const { handleBack, navigateTo } = useNavigation();
    const { addStory } = useStory();
    const { postsByAuthorId } = usePosts();
    const { currentAccount } = useAuth();
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [linkedPostId, setLinkedPostId] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    
    const userPosts = currentAccount ? postsByAuthorId.get(currentAccount.id) || [] : [];
    
    const { mediaUploads, handleFiles, removeMedia, reorderMedia } = useMediaUploader({
        maxFiles: MAX_FILES,
        maxFileSizeMB: MAX_FILE_SIZE_MB,
        subscriptionTier: currentAccount?.subscription.tier,
    });
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const finalMedia = mediaUploads.find(m => m.status === 'complete');
        if (!finalMedia) {
            setError('Please upload an image or video for your story.');
            return;
        }
        
        setIsSubmitting(true);
        const media: Media = { type: finalMedia.type, url: finalMedia.finalUrl! };
        
        const newStory = addStory(media, linkedPostId, description.trim());
        
        if (newStory) {
            navigateTo('all');
        } else {
            setError('Failed to create story. Please try again.');
            setIsSubmitting(false);
        }
    };
    
    if (!currentAccount) return null;

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto animate-fade-in-down pb-28 p-4 sm:p-6 lg:p-8">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6">Create Story</h1>
                    <form id="create-story-form" onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <FormField id="story-media" label="Story Media" error={error}>
                                <MediaUploader
                                    mediaUploads={mediaUploads}
                                    handleFiles={handleFiles}
                                    removeMedia={removeMedia}
                                    reorderMedia={reorderMedia}
                                    maxFiles={MAX_FILES}
                                    maxFileSizeMB={MAX_FILE_SIZE_MB}
                                />
                            </FormField>
                            <p className="text-xs text-gray-600 mt-2">Stories are visible for 24 hours.</p>
                        </div>
                        
                        <FormField 
                            id="story-description" 
                            label="Description (Optional)"
                            description={`${description.length} / ${DESCRIPTION_MAX_LENGTH}`}
                        >
                          <Textarea 
                              value={description}
                              onChange={e => setDescription(e.target.value)}
                              maxLength={DESCRIPTION_MAX_LENGTH}
                              rows={3}
                              placeholder="Add a caption to your story..."
                          />
                        </FormField>

                        {userPosts.length > 0 && (
                            <FormField id="link-post" label="Link to a Post (Optional)" description="Attach one of your posts to this story.">
                                <Select value={linkedPostId || ''} onChange={e => setLinkedPostId(e.target.value || null)}>
                                    <option value="">None</option>
                                    {userPosts.map(post => (
                                        <option key={post.id} value={post.id}>
                                            {post.title}
                                        </option>
                                    ))}
                                </Select>
                            </FormField>
                        )}
                    </form>
                </div>
            </div>
            <FixedPageFooter
                onCancel={handleBack}
                submitFormId="create-story-form"
                isLoading={isSubmitting}
                submitText="Post Story"
                submitDisabled={mediaUploads.length === 0 || mediaUploads.some(m => m.status !== 'complete')}
            />
        </div>
    );
};
