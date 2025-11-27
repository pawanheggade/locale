import React, { useState, useRef } from 'react';
import { CatalogItem } from '../types';
import ModalShell from './ModalShell';
import { Button } from './ui/Button';
import { TrashIcon, DocumentIcon, PlusIcon } from './Icons';
import { cn } from '../lib/utils';
import { useUI } from '../contexts/UIContext';
import { useConfirmationModal } from '../hooks/useConfirmationModal';

interface ManageCatalogModalProps {
    catalog: CatalogItem[];
    onClose: () => void;
    onAdd: (files: File[]) => Promise<void>;
    onRemove: (itemId: string) => Promise<void>;
}

export const ManageCatalogModal: React.FC<ManageCatalogModalProps> = ({ catalog, onClose, onAdd, onRemove }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const showConfirmation = useConfirmationModal();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length > 0) {
            setIsSubmitting(true);
            await onAdd(selectedFiles);
            setIsSubmitting(false);
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const requestRemove = (id: string, name: string) => {
        showConfirmation({
            title: 'Remove Item',
            message: `Are you sure you want to remove "${name}" from your catalog?`,
            onConfirm: async () => {
                await onRemove(id);
                // No need to re-open modal as context update will re-render if it's still open
            },
            confirmText: 'Remove',
        });
    };

    const renderFooter = () => (
        <Button variant="overlay-dark" onClick={onClose}>
            Done
        </Button>
    );

    return (
        <ModalShell
            panelRef={modalRef}
            onClose={onClose}
            title="Manage Catalogs"
            footer={renderFooter()}
            panelClassName="w-full max-w-lg"
            titleId="manage-catalog-title"
        >
            <div className="p-6 space-y-6">
                {/* Add New Files Section */}
                <div 
                    className={cn(
                        "border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors",
                        isSubmitting && "opacity-50 pointer-events-none"
                    )}
                    onClick={() => !isSubmitting && fileInputRef.current?.click()}
                >
                    <input 
                        ref={fileInputRef} 
                        type="file" 
                        className="hidden" 
                        multiple
                        accept=".pdf,image/*" 
                        onChange={handleFileChange}
                        disabled={isSubmitting}
                    />
                    <PlusIcon className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-900">Click to add files</p>
                    <p className="text-xs text-gray-500">PDF or Images (Max 10MB each)</p>
                </div>

                {/* Existing Files List */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-3">Current Files ({catalog.length})</h3>
                    {catalog.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No files in catalogs.</p>
                    ) : (
                        <ul className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {catalog.map((item) => (
                                <li key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {item.type === 'image' ? (
                                            <img src={item.url} alt="" className="w-10 h-10 object-cover rounded bg-white" />
                                        ) : (
                                            <div className="w-10 h-10 flex items-center justify-center bg-red-100 text-red-600 rounded">
                                                <DocumentIcon className="w-5 h-5" />
                                            </div>
                                        )}
                                        <span className="text-sm font-medium text-gray-600 truncate max-w-[180px] sm:max-w-xs" title={item.name}>{item.name}</span>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon-sm" 
                                        onClick={() => requestRemove(item.id, item.name)}
                                        disabled={isSubmitting}
                                        className="text-red-600"
                                        aria-label="Remove file"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </ModalShell>
    );
};