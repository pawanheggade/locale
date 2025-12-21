
import React, { useState, useRef, useEffect } from 'react';
import { PostCategory } from '../../types';
import { TabButton } from '../ui/Button';
import { CategoryManager } from './CategoryManager';
import { useSwipeToNavigateTabs } from '../../hooks/useSwipeToNavigateTabs';
import { useTabAnimation } from '../../hooks/useTabAnimation';

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

type CategoryTab = 'markets' | 'forums' | 'units';

export const CategoriesView: React.FC<CategoriesViewProps> = ({ 
    categories, onAddCategory, onUpdateCategory, onDeleteCategory,
    forumCategories, onAddForumCategory, onUpdateForumCategory, onDeleteForumCategory,
    priceUnits, onAddPriceUnit, onUpdatePriceUnit, onDeletePriceUnit
}) => {
    const [activeTab, setActiveTab] = useState<CategoryTab>('markets');
    const swipeRef = useRef<HTMLDivElement>(null);
    const tabs: CategoryTab[] = ['markets', 'forums', 'units'];
    const animationClass = useTabAnimation(activeTab, tabs);

    useSwipeToNavigateTabs({
        tabs,
        activeTab,
        setActiveTab: (tabId) => setActiveTab(tabId as CategoryTab),
        swipeRef
    });
    
    const renderContent = () => {
        switch (activeTab) {
            case 'markets':
                return <CategoryManager title="Markets" categories={categories} onAdd={onAddCategory} onUpdate={onUpdateCategory} onDelete={onDeleteCategory} />;
            case 'forums':
                return <CategoryManager title="Forums" categories={forumCategories} onAdd={onAddForumCategory} onUpdate={onUpdateForumCategory} onDelete={onDeleteForumCategory} />;
            case 'units':
                return <CategoryManager title="Price Units" categories={priceUnits} onAdd={onAddPriceUnit} onUpdate={onUpdatePriceUnit} onDelete={onDeletePriceUnit} />;
            default:
                return null;
        }
    }

    return (
        <div>
            <div className="mb-4 border-b border-gray-300">
                <nav className="flex space-x-6 px-2 overflow-x-auto hide-scrollbar" role="tablist">
                    <TabButton onClick={() => setActiveTab('markets')} isActive={activeTab === 'markets'}>Markets</TabButton>
                    <TabButton onClick={() => setActiveTab('forums')} isActive={activeTab === 'forums'}>Forums</TabButton>
                    <TabButton onClick={() => setActiveTab('units')} isActive={activeTab === 'units'}>Units</TabButton>
                </nav>
            </div>
            <div ref={swipeRef} className="relative overflow-x-hidden">
                <div key={activeTab} className={animationClass}>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};
