
import React, { useState, useEffect, useRef } from 'react';
// FIX: Changed Post to DisplayablePost to correctly type the post prop, which includes author information.
import { DisplayablePost } from '../types';
import ModalShell from './ModalShell';
import { SpinnerIcon, ArrowDownTrayIcon, PaperAirplaneIcon } from './Icons';
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
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
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
            setImageBlob(blob);
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
    if (isGenerating || isSharing || !imageBlob) return;
    setIsSharing(true);
    
    try {
        const file = new File([imageBlob], `${post.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`, { type: imageBlob.type });
        const shareData: ShareData = {
            title: post.title,
            text: shareText,
            url: shareUrl,
        };

        // Check if browser can share files
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            shareData.files = [file];
        }

        await navigator.share(shareData);
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
        
        <div className="space-y-3">
          {navigator.share && (
            <Button
              onClick={handleNativeShare}
              isLoading={isSharing}
              disabled={isGenerating || isSharing}
              variant="pill-red"
              className="w-full flex items-center justify-center h-12 text-base"
              aria-label="Share post"
            >
              {!isSharing && <PaperAirplaneIcon className="w-5 h-5 mr-2" />}
              <span>{isSharing ? 'Sharing...' : 'Share'}</span>
            </Button>
          )}

          <div className="grid grid-cols-2 gap-3">
              <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  className="w-full"
                  aria-label={isCopied ? 'Link copied' : 'Copy link'}
              >
                  {isCopied ? 'Copied!' : 'Copy Link'}
              </Button>
              <Button
                  onClick={handleDownload}
                  isLoading={isDownloading}
                  disabled={isGenerating || isDownloading}
                  variant="outline"
                  className="flex items-center justify-center w-full gap-1.5"
                  aria-label="Download postcard image"
                >
                  {!isDownloading && <ArrowDownTrayIcon className="w-5 h-5" />}
                  <span>Download</span>
                </Button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
};
