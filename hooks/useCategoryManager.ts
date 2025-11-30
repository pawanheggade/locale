
import React from 'react';

interface UseCategoryManagerProps<T> {
    items: T[];
    archivedItems?: T[];
    categories: string[];
    setCategories: React.Dispatch<React.SetStateAction<string[]>>;
    setItems: React.Dispatch<React.SetStateAction<T[]>>;
    setArchivedItems?: React.Dispatch<React.SetStateAction<T[]>>;
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
        }
    };

    const deleteCategory = (name: string) => {
        const isUsed = items.some(p => p[field] === name) || archivedItems.some(p => p[field] === name);
        if (isUsed) {
            return;
        }
        setCategories(prev => prev.filter(c => c !== name));
    };

    return { addCategory, updateCategory, deleteCategory };
};
