
import React, { useState } from 'react';
import { PostCategory } from '../../types';
import { Button, TabButton } from '../ui/Button';
import { CategoryManager } from './CategoryManager';

interface CategoriesViewProps {
    categories: PostCategory[];
    onAddCategory: (name: string) => void;
    onUpdateCategory: (oldName: string, newName: string) => void;
    onDeleteCategory: (name: string) => void;
    // Forum props
    forumCategories: string[];
    onAddForumCategory: (name: string) => void;
    onUpdateForumCategory: (oldName: string, newName: string) => void;
    onDeleteForumCategory: (name: string) => void;
    // Price Unit props
    priceUnits: string[];
    onAddPriceUnit: (name: string) => void;
    onUpdatePriceUnit: (oldName: string, newName: string) => void;
    onDeletePriceUnit: (name: string) => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({ 
    categories, onAddCategory, onUpdateCategory, onDeleteCategory,
    forumCategories, onAddForumCategory, onUpdateForumCategory, onDeleteForumCategory,
    priceUnits, onAddPriceUnit, onUpdatePriceUnit, onDeletePriceUnit
}) => {
    const [activeTab, setActiveTab] = useState<'marketplace' | 'forums' | 'units'>('marketplace');

    return (
        <div>
            <div className="mb-4 border-b border-gray-200">
                <nav className="flex space-x-6 px-2 overflow-x-auto hide-scrollbar" role="tablist">
                    <TabButton onClick={() => setActiveTab('marketplace')} isActive={activeTab === 'marketplace'}>Marketplace</TabButton>
                    <TabButton onClick={() => setActiveTab('forums')} isActive={activeTab === 'forums'}>Forums</TabButton>
                    <TabButton onClick={() => setActiveTab('units')} isActive={activeTab === 'units'}>Units</TabButton>
                </nav>
            </div>
            {activeTab === 'marketplace' ? (
                <CategoryManager
                    title="Marketplace"
                    categories={categories}
                    onAdd={onAddCategory}
                    onUpdate={onUpdateCategory}
                    onDelete={onDeleteCategory}
                />
            ) : activeTab === 'forums' ? (
                <CategoryManager
                    title="Forums"
                    categories={forumCategories}
                    onAdd={onAddForumCategory}
                    onUpdate={onUpdateForumCategory}
                    onDelete={onDeleteForumCategory}
                />
            ) : (
                <CategoryManager
                    title="Price Units"
                    categories={priceUnits}
                    onAdd={onAddPriceUnit}
                    onUpdate={onUpdatePriceUnit}
                    onDelete={onDeletePriceUnit}
                />
            )}
        </div>
    );
};
