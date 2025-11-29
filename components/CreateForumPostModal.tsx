import React, { useState, useRef, useEffect, useReducer } from 'react';
import { ForumPost } from '../types';
import { useForum } from '../contexts/ForumContext';
import ModalShell from './ModalShell';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { FormField } from './FormField';
import { ModalFooter } from './ModalFooter';

interface CreateForumPostModalProps {
    onClose: () => void;
    onSubmit: (postData: Omit<ForumPost, 'id' | 'authorId' | 'timestamp' | 'upvotes' | 'downvotes' | 'isPinned'>) => void;
}

const initialState = {
    title: '',
    content: '',
    category: '',
    error: '',
};

type State = typeof initialState;
type Action = 
    | { type: 'SET_FIELD'; field: keyof State; payload: string }
    | { type: 'SET_ERROR'; payload: string };

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SET_FIELD':
            return { ...state, [action.field]: action.payload, error: '' };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        default:
            return state;
    }
}


export const CreateForumPostModal: React.FC<CreateForumPostModalProps> = ({ onClose, onSubmit }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { title, content, category, error } = state;
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { categories } = useForum();
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (categories.length > 0 && !category) {
            dispatch({ type: 'SET_FIELD', field: 'category', payload: categories[0] });
        }
    }, [categories, category]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim() || !category) {
            dispatch({ type: 'SET_ERROR', payload: 'All fields are required.'});
            return;
        }
        setIsSubmitting(true);
        onSubmit({ title, content, category });
        onClose();
    };

    const renderFooter = () => (
        <ModalFooter
            onCancel={onClose}
            submitText="Publish"
            isSubmitting={isSubmitting}
            submitFormId="create-forum-post-form"
        />
    );

    return (
        <ModalShell
            panelRef={modalRef}
            onClose={onClose}
            title="Create Discussion"
            footer={renderFooter()}
            panelClassName="w-full max-w-lg"
            titleId="create-forum-post-title"
        >
            <form id="create-forum-post-form" onSubmit={handleSubmit} className="p-6 space-y-4">
                <FormField id="post-title" label="Title" error={error && !title.trim() ? 'Title is required' : undefined}>
                    <Input value={title} onChange={e => dispatch({ type: 'SET_FIELD', field: 'title', payload: e.target.value })} required autoFocus />
                </FormField>
                 <FormField id="post-category" label="Category">
                    <Select value={category} onChange={e => dispatch({ type: 'SET_FIELD', field: 'category', payload: e.target.value })} required>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </Select>
                 </FormField>
                <FormField id="post-content" label="Content" error={error && !content.trim() ? 'Content is required' : undefined}>
                    <Textarea value={content} onChange={e => dispatch({ type: 'SET_FIELD', field: 'content', payload: e.target.value })} required rows={6} />
                </FormField>
            </form>
        </ModalShell>
    );
};