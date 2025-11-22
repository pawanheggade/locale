import React, { useState, useRef, useEffect } from 'react';
import { ForumPost } from '../types';
import { useForum } from '../contexts/ForumContext';
import ModalShell from './ModalShell';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';

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
            <Button variant="glass" onClick={onClose}>Cancel</Button>
            <Button type="submit" form="create-forum-post-form" isLoading={isSubmitting} variant="glass-red">Publish</Button>
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
                <div>
                    <Label htmlFor="post-title">Title</Label>
                    <Input id="post-title" value={title} onChange={e => setTitle(e.target.value)} required autoFocus />
                </div>
                 <div>
                    <Label htmlFor="post-category">Category</Label>
                    <Select id="post-category" value={category} onChange={e => setCategory(e.target.value)} required>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </Select>
                 </div>
                <div>
                    <Label htmlFor="post-content">Content</Label>
                    <Textarea id="post-content" value={content} onChange={e => setContent(e.target.value)} required rows={6} />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
            </form>
        </ModalShell>
    );
};