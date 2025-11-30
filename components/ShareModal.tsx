import React, { useState, useEffect, useRef } from 'react';
import { Post } from '../types';
import ModalShell from './ModalShell';
import { FacebookIcon, XIcon, WhatsAppIcon, DocumentDuplicateIcon, CheckIcon, SpinnerIcon, PaperAirplaneIcon } from './Icons';
import { generatePostPreviewImage } from '../utils/media';
import { Button } from './ui/Button';
import { useIsMounted } from '../hooks/useIsMounted';

interface ShareModalProps {
  post: Post;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ post, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const imageUrlRef = useRef<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const isMounted = useIsMounted();
  
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
    
    const isAbortError = (err: any): boolean => {
        if (!err) return false;
        return (
            err.name === 'AbortError' ||
            err.code === 20 ||
            (typeof err.message === 'string' &&
                (err.message.toLowerCase().includes('abort') ||
                    err.message.toLowerCase().includes('cancel') ||
                    err.message.toLowerCase().includes('canceled')))
        );
    };

    try {
        await navigator.share({ title: post.title, text: shareText, url: shareUrl });
    } catch (error) {
        if (!isAbortError(error)) {
            console.error('Error sharing:', error);
        }
    } finally {
        if (isMounted()) {
            setIsSharing(false);
        }
    }
  };


  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(shareText);
  
  const socialLinks = [
    { name: 'Facebook', icon: FacebookIcon, url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { name: 'X', icon: XIcon, url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}` },
    { name: 'WhatsApp', icon: WhatsAppIcon, url: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}` }
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
        <div className="w-full aspect-[16/9] bg-gray-100 rounded-lg overflow-hidden mb-6 relative">
            {isGenerating ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                    <SpinnerIcon className="w-8 h-8" />
                    <p className="mt-2 text-sm">Generating preview...</p>
                </div>
            ) : previewImageUrl ? (
                <img src={previewImageUrl} alt="Share preview" className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
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
              className="w-full px-3 py-2 text-sm text-gray-800 bg-gray-100 border border-gray-300 rounded-md focus:outline-none"
              aria-label="Shareable link"
            />
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="w-28 flex-shrink-0 text-red-600 border-red-200"
              aria-label={isCopied ? 'Link copied' : 'Copy link'}
            >
              {isCopied ? <CheckIcon className="w-5 h-5" /> : <DocumentDuplicateIcon className="w-5 h-5" />}
              <span className="ml-2">{isCopied ? 'Copied!' : 'Copy'}</span>
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {socialLinks.map(({ name, icon: Icon, url }) => (
              <Button
                as="a"
                key={name}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                variant="outline"
                className="flex items-center justify-center gap-2 w-full h-auto py-2.5"
                aria-label={`Share on ${name}`}
              >
                <Icon className="w-5 h-5" />
                <span>{name}</span>
              </Button>
            ))}
          </div>

          {navigator.share && (
            <Button
              onClick={handleNativeShare}
              isLoading={isSharing}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 h-12 text-base"
              aria-label="Share via system dialog"
            >
              {!isSharing && (
                <>
                  <PaperAirplaneIcon className="w-5 h-5" />
                  <span>More Options...</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </ModalShell>
  );
};