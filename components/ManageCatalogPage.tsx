import React, { useState, useRef, DragEvent } from 'react';
import { Account, CatalogItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { TrashIcon, PlusIcon, DocumentIcon, PencilIcon, CheckIcon, XMarkIcon } from './Icons';
import { cn } from '../lib/utils';
import { useConfirmationModal } from '../hooks/useConfirmationModal';
import { Input } from './ui/Input';
import { useNavigation } from '../contexts/NavigationContext';

// FIX: Remove props interface.
interface ManageCatalogPageProps {}

export const ManageCatalogPage: React.FC<ManageCatalogPageProps> = () => {
  // FIX: Get account from context.
  const { viewingAccount: account } = useNavigation();
  const { addCatalogItems, updateAccountDetails } = useAuth();
  const { handleBack } = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const showConfirmation = useConfirmationModal();

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', url: '' });

  // Drag State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);

  // FIX: Add guard clause for when account is not available.
  if (!account) {
    return <div className="p-8 text-center">Account not found.</div>;
  }
  const catalog = account.catalog || [];

  const updateCatalog = (newCatalog: CatalogItem[]) => {
      updateAccountDetails({ ...account, catalog: newCatalog });
  };

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
      onConfirm: () => { 
          const newCatalog = catalog.filter(item => item.id !== id);
          updateCatalog(newCatalog);
      },
      confirmText: 'Remove',
    });
  };

  const startEditing = (item: CatalogItem) => {
      setEditingId(item.id);
      setEditForm({ name: item.name, url: item.url });
  };

  const handleSaveEdit = () => {
      if (!editingId) return;
      if (!editForm.name.trim() || !editForm.url.trim()) return;

      const newCatalog = catalog.map(item => 
          item.id === editingId 
              ? { ...item, name: editForm.name.trim(), url: editForm.url.trim() }
              : item
      );
      updateCatalog(newCatalog);
      setEditingId(null);
  };

  // Drag Handlers
  const handleDragStart = (e: DragEvent<HTMLLIElement>, index: number) => {
      dragItem.current = index;
      setDraggedIndex(index);
      // Required for Firefox
      e.dataTransfer.setData('text/plain', index.toString());
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent<HTMLLIElement>, index: number) => {
      e.preventDefault();
      // Only update drop target if we are dragging a valid item and it's not the same index
      if (dragItem.current !== null && dragItem.current !== index) {
          setDragOverIndex(index);
      }
  };

  const handleDrop = (e: DragEvent<HTMLLIElement>, targetIndex: number) => {
      e.preventDefault();
      if (dragItem.current === null) return;
      
      const sourceIndex = dragItem.current;
      if (sourceIndex !== targetIndex) {
          const newCatalog = [...catalog];
          const [movedItem] = newCatalog.splice(sourceIndex, 1);
          newCatalog.splice(targetIndex, 0, movedItem);
          updateCatalog(newCatalog);
      }
      resetDrag();
  };

  const handleDragEnd = () => {
      resetDrag();
  };

  const resetDrag = () => {
      dragItem.current = null;
      setDraggedIndex(null);
      setDragOverIndex(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto animate-fade-in-down pb-28 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Manage Catalog</h1>
          <div className="space-y-6">
            <div
              className={cn("border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer", isSubmitting && "opacity-50 pointer-events-none")}
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
                <ul className="space-y-2">
                  {catalog.map((item, index) => {
                    const isEditing = editingId === item.id;
                    const isDragging = draggedIndex === index;
                    const isDragOver = dragOverIndex === index && draggedIndex !== index;

                    return (
                        <li 
                            key={item.id} 
                            draggable={!isEditing}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragEnd={handleDragEnd}
                            className={cn(
                                "flex flex-col gap-2 p-3 bg-white rounded-lg border select-none",
                                isDragging ? "opacity-50 border-dashed" : "border-gray-200",
                                isDragOver ? "border-red-500 ring-2 ring-red-500 ring-opacity-50 z-10 scale-[1.01]" : ""
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="cursor-grab active:cursor-grabbing flex-shrink-0 p-1" title="Drag to reorder">
                                        <div className="flex flex-col gap-0.5 opacity-30">
                                            <div className="w-4 h-0.5 bg-gray-500 rounded"></div>
                                            <div className="w-4 h-0.5 bg-gray-500 rounded"></div>
                                            <div className="w-4 h-0.5 bg-gray-500 rounded"></div>
                                        </div>
                                    </div>
                                    
                                    {item.type === 'image' ? (
                                        <img src={item.url} alt="" className="w-10 h-10 object-cover rounded bg-gray-100 border border-gray-200" />
                                    ) : (
                                        <div className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-600 rounded border border-red-100">
                                            <DocumentIcon className="w-5 h-5" />
                                        </div>
                                    )}
                                    
                                    {!isEditing ? (
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate" title={item.name}>{item.name}</p>
                                            <p className="text-xs text-gray-500 truncate" title={item.url}>{item.url}</p>
                                        </div>
                                    ) : (
                                        <div className="flex-1 min-w-0 space-y-2">
                                            <Input 
                                                value={editForm.name} 
                                                onChange={e => setEditForm({...editForm, name: e.target.value})} 
                                                placeholder="Item Name" 
                                                className="h-8 text-sm"
                                                autoFocus
                                            />
                                            <Input 
                                                value={editForm.url} 
                                                onChange={e => setEditForm({...editForm, url: e.target.value})} 
                                                placeholder="URL" 
                                                className="h-8 text-xs"
                                            />
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex items-center gap-1 ml-2">
                                    {isEditing ? (
                                        <>
                                            <Button variant="ghost" size="icon-sm" onClick={handleSaveEdit} className="text-green-600" title="Save">
                                                <CheckIcon className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon-sm" onClick={() => setEditingId(null)} className="text-gray-500" title="Cancel">
                                                <XMarkIcon className="w-4 h-4" />
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button variant="ghost" size="icon-sm" onClick={() => startEditing(item)} disabled={isSubmitting} className="text-gray-500" title="Edit">
                                                <PencilIcon className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon-sm" onClick={() => requestRemove(item.id, item.name)} disabled={isSubmitting} className="text-red-600" title="Remove">
                                                <TrashIcon className="w-4 h-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </li>
                    );
                  })}
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
              <Button onClick={handleBack} size="lg" variant="pill-red">Done</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};