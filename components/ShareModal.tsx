
import React, { useState, useEffect, useRef } from 'react';
// FIX: Changed Post to DisplayablePost to correctly type the post prop, which includes author information.
import { DisplayablePost } from '../types';
import ModalShell from './ModalShell';
import { SpinnerIcon, ArrowDownTrayIcon } from './Icons';
import { generatePostPreviewImage } from '../utils/media';
import { Button } from './ui/Button';
import { useIsMounted } from '../hooks/useIsMounted';
import { isShareAbortError } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

interface ShareModalProps {
  post: DisplayablePost;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ post: initialPost, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const imageUrlRef = useRef<string | null>(null);
  const { accountsById } = useAuth();
  
  const [isCopied, setIsCopied] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const isMounted = useIsMounted();
  
  // Ensure the post has the author object for postcard generation
  const post = {
      ...initialPost,
      author: initialPost.author || accountsById.get(initialPost.authorId)
  };

  const shareUrl = `${window.location.origin}?post=${post.id}`;
  const shareText = `Check out this ${post.type.toLowerCase()} on Locale: "${post.title}"`;

  useEffect(() => {
    const generate = async () => {
        setIsGenerating(true);
        const blob = await generatePostPreviewImage(post);
        if (isMounted() && blob) {
            const url = URL.createObjectURL(blob);
            setPreviewImageUrl(url);
            imageUrlRef.current = url;
        }
        if (isMounted()) {
            setIsGenerating(false);
        }
    };

    generate();

    return () => {
        if (imageUrlRef.current) {
            URL.revokeObjectURL(imageUrlRef.current);
        }
    };
  }, [post, isMounted]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      if (isMounted()) {
        setIsCopied(true);
        setTimeout(() => {
            if (isMounted()) {
                setIsCopied(false);
            }
        }, 2000);
      }
    });
  };

  const handleNativeShare = async () => {
    setIsSharing(true);
    
    try {
        await navigator.share({ title: post.title, text: shareText, url: shareUrl });
    } catch (error) {
        if (!isShareAbortError(error)) {
            console.error('Error sharing:', error);
        }
    } finally {
        if (isMounted()) {
            setIsSharing(false);
        }
    }
  };
  
  const handleDownload = () => {
    if (!previewImageUrl) return;
    setIsDownloading(true);
    try {
        const link = document.createElement('a');
        link.href = previewImageUrl;
        const safeTitle = post.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        link.download = `locale-post-${safeTitle}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Download failed:', error);
    } finally {
        if (isMounted()) {
            setIsDownloading(false);
        }
    }
  };


  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(shareText);
  
  const socialLinks = [
    { name: 'Message', url: `sms:?&body=${encodedText}%20${encodedUrl}` },
    { name: 'WhatsApp', url: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}` }
  ];

  return (
    <ModalShell
      panelRef={modalRef}
      onClose={onClose}
      title="Share Post"
      panelClassName="w-full max-w-md"
      titleId="share-post-title"
    >
      <div className="p-6">
        <div className="w-full aspect-square bg-gray-50 rounded-lg overflow-hidden mb-6 relative">
            {isGenerating ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
                    <SpinnerIcon className="w-8 h-8" />
                    <p className="mt-2 text-sm">Generating preview...</p>
                </div>
            ) : previewImageUrl ? (
                <img src={previewImageUrl} alt="Share preview" className="w-full h-full object-contain" />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
                    <p className="text-sm">Could not generate preview.</p>
                </div>
            )}
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="w-full px-3 py-2 text-sm text-gray-800 bg-gray-50 border border-gray-300 rounded-md focus:outline-none"
              aria-label="Shareable link"
            />
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="w-28 flex-shrink-0 text-red-600 border-red-200"
              aria-label={isCopied ? 'Link copied' : 'Copy link'}
            >
              {isCopied ? 'Copied!' : 'Copy'}
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-3">
             <Button
                onClick={handleDownload}
                isLoading={isDownloading}
                disabled={isGenerating || isDownloading}
                variant="outline"
                className="flex items-center justify-center w-full h-auto py-2.5"
                aria-label="Download postcard image"
              >
                {!isDownloading && <ArrowDownTrayIcon className="w-5 h-5 mr-1" />}
                <span>Download</span>
              </Button>
            {socialLinks.map(({ name, url }) => (
              <Button
                as="a"
                key={name}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                variant="outline"
                className="flex items-center justify-center w-full h-auto py-2.5"
                aria-label={`Share on ${name}`}
              >
                <span>{name}</span>
              </Button>
            ))}
          </div>

          {navigator.share && (
            <Button
              onClick={handleNativeShare}
              isLoading={isSharing}
              variant="outline"
              className="w-full flex items-center justify-center h-12 text-base"
              aria-label="Share via system dialog"
            >
              {!isSharing && (
                <span>More Options...</span>
              )}
            </Button>
          )}
        </div>
      </div>
    </ModalShell>
  );
};
