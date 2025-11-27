
import React, { useState } from 'react';
import { TrashIcon, PencilIcon } from '../Icons';
import { Button } from '../ui/Button';
import { cn, inputBaseStyles } from '../../lib/utils';

interface CategoryManagerProps {
    title: string;
    categories: string[];
    onAdd: (name: string) => void;
    onUpdate: (oldName: string, newName: string) => void;
    onDelete: (name: string) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ title, categories, onAdd, onUpdate, onDelete }) => {
    const [newItem, setNewItem] = useState('');
    const [editing, setEditing] = useState<{ oldName: string, newName: string } | null>(null);

    const handleAdd = () => {
        onAdd(newItem);
        setNewItem('');
    };

    const handleUpdate = () => {
        if (editing) {
            onUpdate(editing.oldName, editing.newName);
            setEditing(null);
        }
    };

    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">{title} Categories</h3>
            <div className="flex gap-2 mb-4">
                <input 
                    type="text" 
                    value={newItem} 
                    onChange={e => setNewItem(e.target.value)} 
                    placeholder={`New ${title.toLowerCase()} category`}
                    className={cn(inputBaseStyles, "flex-grow")}
                    aria-label={`New ${title.toLowerCase()} category name`}
                />
                <Button onClick={handleAdd} variant="overlay-dark">Add</Button>
            </div>
            <ul className="space-y-2">
                {categories.map((cat) => (
                    <li key={cat} className="p-3 bg-white border rounded-md flex justify-between items-center">
                        {editing?.oldName === cat ? (
                            <input 
                                type="text" 
                                value={editing.newName} 
                                onChange={e => setEditing({ ...editing, newName: e.target.value })} 
                                autoFocus 
                                onBlur={handleUpdate}
                                onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                                className={cn(inputBaseStyles, "h-8 py-1 flex-grow mr-4")}
                                aria-label={`Edit name for category ${cat}`}
                            />
                        ) : (
                            <span className="font-medium text-gray-900">{cat}</span>
                        )}
                        <div className="flex gap-2">
                            <Button variant="overlay-dark" size="icon-sm" onClick={() => setEditing({ oldName: cat, newName: cat })} className="text-gray-600" title="Edit"><PencilIcon className="w-4 h-4"/></Button>
                            <Button variant="overlay-red" size="icon-sm" onClick={() => onDelete(cat)} className="text-red-600" title="Delete"><TrashIcon className="w-4 h-4"/></Button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};
