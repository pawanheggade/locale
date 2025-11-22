
import React, { useState, useRef } from 'react';
import ModalShell from './ModalShell';
import { Button } from './ui/Button';
import { SpinnerIcon } from './Icons';
import { cn } from '../lib/utils';

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
        <>
            <Button variant="glass" onClick={onClose} disabled={isSubmitting} className="mr-auto">
                Cancel
            </Button>
            <Button 
                onClick={handleSubmit} 
                isLoading={isSubmitting} 
                disabled={!file} 
                variant="glass-red"
                className="w-32"
            >
                Upload
            </Button>
        </>
    );

    return (
        <ModalShell
            panelRef={modalRef}
            onClose={onClose}
            title="Upload Catalogs"
            footer={renderFooter()}
            panelClassName="w-full max-w-md"
            titleId="upload-catalog-title"
        >
            <div className="p-6 space-y-4">
                <div 
                    className={cn(
                        "border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors",
                        file ? "border-red-500 bg-red-50" : "border-gray-300 hover:bg-gray-50"
                    )}
                    onClick={() => !isSubmitting && fileInputRef.current?.click()}
                >
                    <input 
                        ref={fileInputRef} 
                        type="file" 
                        className="hidden" 
                        accept=".pdf,image/*" 
                        onChange={handleFileChange}
                        disabled={isSubmitting}
                    />
                    <div className="space-y-2">
                         <div className="mx-auto h-12 w-12 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                        </div>
                        {file ? (
                             <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        ) : (
                            <>
                                <p className="text-sm font-medium text-gray-900">Click to select file</p>
                                <p className="text-xs text-gray-500">PDF or Images up to 10MB</p>
                            </>
                        )}
                    </div>
                </div>

                {isSubmitting && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-red-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                )}

                {error && (
                    <p className="text-sm text-red-600 text-center">{error}</p>
                )}
            </div>
        </ModalShell>
    );
};
