import React, { useState, useRef } from 'react';
import { Account, CatalogItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { TrashIcon, PlusIcon, DocumentIcon } from './Icons';
import { cn } from '../lib/utils';
import { useConfirmationModal } from '../hooks/useConfirmationModal';

interface ManageCatalogPageProps {
  account: Account;
  onBack: () => void;
}

export const ManageCatalogPage: React.FC<ManageCatalogPageProps> = ({ account, onBack }) => {
  const { addCatalogItems, removeCatalogItem } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const showConfirmation = useConfirmationModal();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      setIsSubmitting(true);
      await addCatalogItems(selectedFiles);
      setIsSubmitting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const requestRemove = (id: string, name: string) => {
    showConfirmation({
      title: 'Remove Item',
      message: `Are you sure you want to remove "${name}" from your catalog?`,
      onConfirm: async () => { await removeCatalogItem(id); },
      confirmText: 'Remove',
    });
  };

  const catalog = account.catalog || [];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto animate-fade-in-down pb-28 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Manage Catalog</h1>
          <div className="space-y-6">
            <div
              className={cn("border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors", isSubmitting && "opacity-50 pointer-events-none")}
              onClick={() => !isSubmitting && fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" className="hidden" multiple accept=".pdf,image/*" onChange={handleFileChange} disabled={isSubmitting} />
              <PlusIcon className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-900">Click to add files</p>
              <p className="text-xs text-gray-500">PDF or Images (Max 10MB each)</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-3">Current Files ({catalog.length})</h3>
              {catalog.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No files in catalog.</p>
              ) : (
                <ul className="space-y-2 max-h-96 overflow-y-auto pr-1">
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
                      <Button variant="ghost" size="icon-sm" onClick={() => requestRemove(item.id, item.name)} disabled={isSubmitting} className="text-red-600" aria-label="Remove file">
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-[100] animate-slide-in-up" style={{ animationDelay: '200ms' }}>
        <div className="bg-white border-t border-gray-100">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <div className="py-3 flex items-center justify-end">
              <Button onClick={onBack} size="lg" variant="pill-red">Done</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageCatalogPage;
