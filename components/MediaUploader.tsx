import React, { useState, useRef, DragEvent, ChangeEvent, KeyboardEvent } from 'react';
import { MediaUpload } from '../hooks/useMediaUploader';
import { XMarkIcon, SpinnerIcon, AlertIcon } from './Icons';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';

interface MediaUploaderProps {
  mediaUploads: MediaUpload[];
  handleFiles: (files: File[]) => void;
  removeMedia: (id: string) => void;
  reorderMedia: (draggedIndex: number, dragOverIndex: number) => void;
  maxFiles: number;
  maxFileSizeMB: number;
}

const MediaPreview: React.FC<{ upload: MediaUpload; onRemove: () => void; }> = ({ upload, onRemove }) => {
    return (
        <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden border group">
            {upload.type === 'video' ? (
                 <video src={upload.previewUrl} className="w-full h-full object-cover" />
            ) : (
                 <img src={upload.previewUrl} alt="Preview" className="w-full h-full object-cover" />
            )}

            {upload.status === 'uploading' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mx-2">
                        <div className="bg-red-600 h-1.5 rounded-full" style={{ width: `${upload.progress}%` }}></div>
                    </div>
                </div>
            )}
            {upload.status === 'error' && (
                <div className="absolute inset-0 bg-red-800/80 flex flex-col items-center justify-center text-white p-1">
                    <AlertIcon className="w-6 h-6" />
                    <p className="text-xs text-center mt-1">{upload.error}</p>
                </div>
            )}

            <Button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                variant="overlay"
                size="xs"
                className="absolute top-1 right-1 w-6 h-6 p-0 flex items-center justify-center rounded-full transition-all z-10 text-white drop-shadow-md"
                aria-label="Remove media"
            >
                <XMarkIcon className="w-4 h-4" />
            </Button>
        </div>
    );
};

export const MediaUploader: React.FC<MediaUploaderProps> = ({ mediaUploads, handleFiles, removeMedia, reorderMedia, maxFiles, maxFileSizeMB }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const dragItem = useRef<number | null>(null);

    const onDragOverContainer = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        // Only show container highlight if we are dragging files, not internal items
        if (dragItem.current === null) {
            setIsDraggingOver(true);
        }
    };

    const onDragLeaveContainer = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        // Prevents flickering when dragging over children elements
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDraggingOver(false);
    };

    const onDropContainer = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDraggingOver(false);
        
        // If dragging an internal item and dropping on the container background (not on another item),
        // cancel the drag operation.
        if (dragItem.current !== null) {
             dragItem.current = null;
             setDraggedIndex(null);
             setDragOverIndex(null);
             return;
        }

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFiles(files);
        }
    };
    
    const onFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            handleFiles(files);
        }
        e.target.value = '';
    };
    
    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
        }
    };

    // Item Reordering Handlers
    const handleDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
        dragItem.current = index;
        setDraggedIndex(index);
        // Required for Firefox
        e.dataTransfer.setData('text/plain', index.toString());
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleItemDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
         e.preventDefault();
         e.stopPropagation(); // Stop bubbling to container so it doesn't flash red
         e.dataTransfer.dropEffect = 'move';
         
         if (dragItem.current !== null && dragItem.current !== index) {
             setDragOverIndex(index);
         }
    };

    const handleItemDrop = (e: DragEvent<HTMLDivElement>, targetIndex: number) => {
        // If dragging a file (external), allow bubbling to container to handle upload
        if (dragItem.current === null) return;

        e.preventDefault();
        e.stopPropagation();

        const sourceIndex = dragItem.current;
        if (sourceIndex !== targetIndex) {
            reorderMedia(sourceIndex, targetIndex);
        }
        
        resetDragState();
    };

    const handleDragEnd = () => {
        resetDragState();
    };

    const resetDragState = () => {
        dragItem.current = null;
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    return (
        <div>
            <div
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={handleKeyDown}
                onDragOver={onDragOverContainer}
                onDragLeave={onDragLeaveContainer}
                onDrop={onDropContainer}
                role="button"
                tabIndex={0}
                aria-label="Upload media. Click or drag and drop files here."
                className={cn(
                    'flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
                    isDraggingOver ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                )}
            >
                <input ref={fileInputRef} type="file" multiple onChange={onFileSelect} className="hidden" accept="image/*,video/*" tabIndex={-1} />
                <p className="text-sm text-gray-600">Drag & drop media here, or click to select files.</p>
                <p className="text-xs text-gray-500 mt-1">Max {maxFiles} files, up to {maxFileSizeMB}MB each.</p>
            </div>

            {mediaUploads.length > 0 && (
                <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {mediaUploads.map((upload, index) => (
                        <div
                            key={upload.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleItemDragOver(e, index)}
                            onDrop={(e) => handleItemDrop(e, index)}
                            onDragEnd={handleDragEnd}
                            className={cn(
                                'cursor-grab active:cursor-grabbing transition-all duration-200 transform relative rounded-xl',
                                draggedIndex === index ? 'opacity-50' : 'opacity-100',
                                dragOverIndex === index && draggedIndex !== index ? 'scale-105 ring-2 ring-red-500 ring-offset-2 z-10 shadow-lg' : ''
                            )}
                            title="Drag to reorder"
                        >
                            <MediaPreview upload={upload} onRemove={() => removeMedia(upload.id)} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};