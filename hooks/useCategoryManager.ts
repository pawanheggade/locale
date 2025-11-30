import React from 'react';

interface UseCategoryManagerProps<T> {
    items: T[];
    archivedItems?: T[];
    categories: string[];
    setCategories: React.Dispatch<React.SetStateAction<string[]>>;
    setItems: React.Dispatch<React.SetStateAction<T[]>>;
    setArchivedItems?: React.Dispatch<React.SetStateAction<T[]>>;
    addToast: (message: string, type?: 'success' | 'error') => void;
    itemTypeLabel: string; // e.g. 'Category', 'Unit'
    field: keyof T;
    shouldSort?: boolean;
}

export const useCategoryManager = <T>({
    items,
    archivedItems = [],
    categories,
    setCategories,
    setItems,
    setArchivedItems,
    addToast,
    itemTypeLabel,
    field,
    shouldSort = true,
}: UseCategoryManagerProps<T>) => {

    const addCategory = (name: string) => {
        if (name && !categories.find(c => c.toLowerCase() === name.toLowerCase())) {
            setCategories(prev => {
                const newCats = [...prev, name];
                return shouldSort ? newCats.sort((a, b) => a.localeCompare(b)) : newCats;
            });
            addToast(`${itemTypeLabel} added.`, 'success');
        } else {
            addToast(`${itemTypeLabel} already exists or name is invalid.`, 'error');
        }
    };

    const updateCategory = (oldName: string, newName: string) => {
        if (newName && oldName !== newName && !categories.find(c => c.toLowerCase() === newName.toLowerCase())) {
            setCategories(prev => {
                const newCats = prev.map(c => c === oldName ? newName : c);
                return shouldSort ? newCats.sort((a, b) => a.localeCompare(b)) : newCats;
            });
            
            setItems(prev => prev.map(p => p[field] === oldName ? { ...p, [field]: newName } : p));
            
            if (setArchivedItems) {
                setArchivedItems(prev => prev.map(p => p[field] === oldName ? { ...p, [field]: newName } : p));
            }
            addToast(`${itemTypeLabel} updated.`, 'success');
        } else {
            addToast('New name is invalid or already exists.', 'error');
        }
    };

    const deleteCategory = (name: string) => {
        const isUsed = items.some(p => p[field] === name) || archivedItems.some(p => p[field] === name);
        if (isUsed) {
            addToast(`Cannot delete ${itemTypeLabel.toLowerCase()} as it is in use.`, 'error');
            return;
        }
        setCategories(prev => prev.filter(c => c !== name));
        addToast(`${itemTypeLabel} deleted.`, 'success');
    };

    return { addCategory, updateCategory, deleteCategory };
};