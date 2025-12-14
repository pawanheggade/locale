
import React, { useState, useReducer } from 'react';
import { TrashIcon, PencilIcon, PlusIcon, CheckIcon, XMarkIcon } from '../Icons';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn, inputBaseStyles } from '../../lib/utils';

interface CategoryManagerProps {
    title: string;
    categories: string[];
    onAdd: (name: string) => void;
    onUpdate: (oldName: string, newName: string) => void;
    onDelete: (name: string) => void;
}

const initialState = {
    newItem: '',
    editing: null as { oldName: string; newName: string } | null,
};
type State = typeof initialState;
type Action =
    | { type: 'SET_NEW_ITEM'; payload: string }
    | { type: 'SET_EDITING'; payload: { oldName: string; newName: string } | null }
    | { type: 'UPDATE_EDITING_NAME'; payload: string };

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SET_NEW_ITEM':
            return { ...state, newItem: action.payload };
        case 'SET_EDITING':
            return { ...state, editing: action.payload };
        case 'UPDATE_EDITING_NAME':
            return { ...state, editing: state.editing ? { ...state.editing, newName: action.payload } : null };
        default:
            return state;
    }
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ title, categories, onAdd, onUpdate, onDelete }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { newItem, editing } = state;

    const handleAdd = () => {
        if (newItem.trim()) {
            onAdd(newItem.trim());
            dispatch({ type: 'SET_NEW_ITEM', payload: '' });
        }
    };

    const handleUpdate = () => {
        if (editing && editing.newName.trim()) {
            onUpdate(editing.oldName, editing.newName.trim());
            dispatch({ type: 'SET_EDITING', payload: null });
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg border border-gray-300">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Manage {title}</h3>
            
            <div className="flex gap-2 mb-6">
                <Input
                    placeholder={`New ${title}...`}
                    value={newItem}
                    onChange={(e) => dispatch({ type: 'SET_NEW_ITEM', payload: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <Button onClick={handleAdd} disabled={!newItem.trim()}>
                    <PlusIcon className="w-5 h-5" />
                </Button>
            </div>

            <ul className="space-y-2 max-h-96 overflow-y-auto">
                {categories.map((category) => (
                    <li key={category} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded group">
                        {editing?.oldName === category ? (
                            <div className="flex items-center gap-2 flex-1">
                                <Input
                                    value={editing.newName}
                                    onChange={(e) => dispatch({ type: 'UPDATE_EDITING_NAME', payload: e.target.value })}
                                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                                    autoFocus
                                    className="h-8 text-sm"
                                />
                                <Button size="icon-sm" variant="ghost" onClick={handleUpdate} className="text-green-600">
                                    <CheckIcon className="w-4 h-4" />
                                </Button>
                                <Button size="icon-sm" variant="ghost" onClick={() => dispatch({ type: 'SET_EDITING', payload: null })} className="text-gray-600">
                                    <XMarkIcon className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <>
                                <span className="text-sm text-gray-900">{category}</span>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button 
                                        size="icon-sm" 
                                        variant="ghost" 
                                        onClick={() => dispatch({ type: 'SET_EDITING', payload: { oldName: category, newName: category } })}
                                        className="text-gray-600"
                                    >
                                        <PencilIcon className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                        size="icon-sm" 
                                        variant="ghost" 
                                        onClick={() => onDelete(category)}
                                        className="text-red-600"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </Button>
                                </div>
                            </>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};