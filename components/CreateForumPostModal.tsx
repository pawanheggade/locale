import React, { useState, useRef, useEffect } from 'react';
import { ForumPost } from '../types';
import { useForum } from '../contexts/ForumContext';
import ModalShell from './ModalShell';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { FormField } from './FormField';

interface CreateForumPostModalProps {
    onClose: () => void;
    onSubmit: (postData: Omit<ForumPost, 'id' | 'authorId' | 'timestamp' | 'upvotes' | 'downvotes' | 'isPinned'>) => void;
}

export const CreateForumPostModal: React.FC<CreateForumPostModalProps> = ({ onClose, onSubmit }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { categories } = useForum();
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (categories.length > 0) {
            setCategory(categories[0]);
        }
    }, [categories]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim() || !category) {
            setError('All fields are required.');
            return;
        }
        setError('');
        setIsSubmitting(true);
        onSubmit({ title, content, category });
        onClose();
    };

    const renderFooter = () => (
        <>
            <Button variant="overlay-dark" onClick={onClose}>Cancel</Button>
            <Button type="submit" form="create-forum-post-form" isLoading={isSubmitting} variant="pill-red">Publish</Button>
        </>
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
                    <Input value={title} onChange={e => setTitle(e.target.value)} required autoFocus />
                </FormField>
                 <FormField id="post-category" label="Category">
                    <Select value={category} onChange={e => setCategory(e.target.value)} required>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </Select>
                 </FormField>
                <FormField id="post-content" label="Content" error={error && !content.trim() ? 'Content is required' : undefined}>
                    <Textarea value={content} onChange={e => setContent(e.target.value)} required rows={6} />
                </FormField>
            </form>
        </ModalShell>
    );
};
