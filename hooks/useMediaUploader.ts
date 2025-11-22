
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { fileToDataUrl, compressImage } from '../utils/media';
import { useUI } from '../contexts/UIContext';

export interface MediaUpload {
  id: string;
  file?: File;
  previewUrl: string;
  progress: number;
  status: 'uploading' | 'complete' | 'error';
  finalUrl?: string;
  error?: string;
  type: 'image' | 'video';
}

interface UseMediaUploaderOptions {
  maxFiles: number;
  maxFileSizeMB: number;
  subscriptionTier?: string;
}

export const useMediaUploader = ({ maxFiles, maxFileSizeMB, subscriptionTier }: UseMediaUploaderOptions) => {
  const [mediaUploads, setMediaUploads] = useState<MediaUpload[]>([]);
  const { addToast } = useUI();
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      // Use a function to get the latest state during cleanup
      setMediaUploads(currentUploads => {
        currentUploads.forEach(upload => {
          if (upload.previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(upload.previewUrl);
          }
        });
        return currentUploads;
      });
    };
  }, []);

  const processFile = useCallback(async (file: File, uploadId: string) => {
    const progressInterval = setInterval(() => {
      if (!isMountedRef.current) {
        clearInterval(progressInterval);
        return;
      }
      setMediaUploads(prev => prev.map(u => u.id === uploadId ? { ...u, progress: Math.min(u.progress + 10, 90) } : u));
    }, 200);

    try {
      const isImage = file.type.startsWith('image/');
      const processedFile = isImage ? await compressImage(file, { maxWidth: 1024, quality: 0.8 }) : file;
      const finalUrl = await fileToDataUrl(processedFile);

      clearInterval(progressInterval);

      if (isMountedRef.current) {
        setMediaUploads(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'complete', progress: 100, finalUrl } : u));
      }
    } catch (err) {
      clearInterval(progressInterval);
      console.error('File processing error:', err);
      if (isMountedRef.current) {
        setMediaUploads(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'error', error: 'Upload failed' } : u));
      }
    }
  }, []);

  const handleFiles = useCallback((files: File[]) => {
    const MAX_SIZE_BYTES = maxFileSizeMB * 1024 * 1024;
    const newUploads: MediaUpload[] = [];

    for (const file of files) {
      const uploadId = `${file.name}-${Date.now()}`;
      const previewUrl = URL.createObjectURL(file);
      const fileType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null;

      if (mediaUploads.length + newUploads.length >= maxFiles) {
        addToast(`You can upload a maximum of ${maxFiles} media files${subscriptionTier ? ` with your ${subscriptionTier} plan` : ''}.`, 'error');
        break;
      }

      if (file.size > MAX_SIZE_BYTES) {
        newUploads.push({ id: uploadId, previewUrl, progress: 0, status: 'error', error: `File too large (max ${maxFileSizeMB}MB)`, type: fileType || 'image' });
        continue;
      }

      if (!fileType) {
        newUploads.push({ id: uploadId, previewUrl, progress: 0, status: 'error', error: 'Unsupported file type', type: 'image' });
        continue;
      }

      newUploads.push({ id: uploadId, file, previewUrl, progress: 0, status: 'uploading', type: fileType });
    }

    if (newUploads.length > 0) {
      setMediaUploads(prev => [...prev, ...newUploads]);
      newUploads.forEach(upload => {
        if (upload.file && upload.status === 'uploading') {
          processFile(upload.file, upload.id);
        }
      });
    }
  }, [mediaUploads.length, maxFiles, maxFileSizeMB, subscriptionTier, addToast, processFile]);

  const removeMedia = useCallback((id: string) => {
    setMediaUploads(prev => {
      const uploadToRemove = prev.find(u => u.id === id);
      if (uploadToRemove && uploadToRemove.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(uploadToRemove.previewUrl);
      }
      return prev.filter(u => u.id !== id);
    });
  }, []);

  const reorderMedia = useCallback((draggedIndex: number, dragOverIndex: number) => {
    if (draggedIndex === dragOverIndex) return;
    setMediaUploads(prev => {
        const reordered = [...prev];
        const [draggedItem] = reordered.splice(draggedIndex, 1);
        reordered.splice(dragOverIndex, 0, draggedItem);
        return reordered;
    });
  }, []);

  return { mediaUploads, setMediaUploads, handleFiles, removeMedia, reorderMedia };
};
