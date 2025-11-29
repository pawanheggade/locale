
import React, { useState, useRef } from 'react';
import ModalShell from './ModalShell';
import { cn } from '../lib/utils';
import { ModalFooter } from './ModalFooter';

interface UploadCatalogModalProps {
    onClose: () => void;
    onUpload: (file: File) => Promise<void>;
}

export const UploadCatalogModal: React.FC<UploadCatalogModalProps> = ({ onClose, onUpload }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            // Max 10MB
            if (selectedFile.size > 10 * 1024 * 1024) {
                setError('File size exceeds 10MB limit.');
                setFile(null);
                return;
            }
            setFile(selectedFile);
            setError('');
        }
    };

    const handleSubmit = async () => {
        if (!file) return;
        
        setIsSubmitting(true);
        // Simulate progress
        const interval = setInterval(() => {
            setProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        try {
            await onUpload(file);
            setProgress(100);
            clearInterval(interval);
            setTimeout(onClose, 500);
        } catch (err) {
            clearInterval(interval);
            setError('Failed to upload file. Please try again.');
            setIsSubmitting(false);
            setProgress(0);
        }
    };

    const renderFooter = () => (
        <ModalFooter
            onCancel={onClose}
            onSubmit={handleSubmit}
            submitText={isSubmitting ? 'Uploading...' : 'Upload'}
            isSubmitting={isSubmitting}
            isSubmitDisabled={!file}
        />
    );

    return (
        <ModalShell
            panelRef={modalRef}
            onClose={onClose}
            title="Upload Catalog Item"
            footer={renderFooter()}
            panelClassName="w-full max-w-md"
            titleId="upload-catalog-title"
        >
            <div className="p-6">
                <div 
                    className={cn(
                        "border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors",
                        error ? "border-red-300 bg-red-50" : "border-gray-300",
                        isSubmitting && "opacity-50 pointer-events-none"
                    )}
                    onClick={() => !isSubmitting && fileInputRef.current?.click()}
                >
                    <input 
                        ref={fileInputRef} 
                        type="file" 
                        className="hidden" 
                        accept=".pdf,image/*" 
                        onChange={handleFileChange}
                    />
                    {file ? (
                        <div>
                            <p className="font-medium text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm font-medium text-gray-900">Click to select file</p>
                            <p className="text-xs text-gray-500 mt-1">PDF or Images (Max 10MB)</p>
                        </>
                    )}
                </div>
                
                {error && <p className="mt-2 text-sm text-red-600 text-center">{error}</p>}

                {isSubmitting && (
                    <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-red-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                        </div>
                        <p className="text-xs text-gray-500 text-center mt-1">{progress === 100 ? 'Upload Complete!' : 'Uploading...'}</p>
                    </div>
                )}
            </div>
        </ModalShell>
    );
};
