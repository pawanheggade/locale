
import React, { useState, useReducer, useEffect } from 'react';
import { ForumPost } from '../types';
import { useForum } from '../contexts/ForumContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { FormField } from './FormField';
import { useNavigation } from '../contexts/NavigationContext';
import { FixedPageFooter } from './FixedPageFooter';

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

export const CreateForumPostPage: React.FC = () => {
    const { categories, addPost } = useForum();
    const { navigateTo, handleBack } = useNavigation();
    const [state, dispatch] = useReducer(reducer, initialState);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (categories.length > 0 && !state.category) {
            dispatch({ type: 'SET_FIELD', field: 'category', payload: categories[0] });
        }
    }, [categories, state.category]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { title, content, category } = state;

        if (!title.trim() || !content.trim() || !category) {
            dispatch({ type: 'SET_ERROR', payload: 'All fields are required.' });
            return;
        }

        setIsSubmitting(true);
        const newPost = addPost({ title, content, category });
        if (newPost) {
            navigateTo('forumPostDetail', { forumPostId: newPost.id });
        }
        setIsSubmitting(false);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto animate-fade-in-down pb-28 p-4 sm:p-6 lg:p-8">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6">Create Forum Discussion</h1>
                    <form id="create-forum-post-form" onSubmit={handleSubmit} className="space-y-6">
                        <FormField id="forum-post-title" label="Title" error={state.error && !state.title.trim() ? "Title is required" : ""}>
                            <Input
                                value={state.title}
                                onChange={e => dispatch({ type: 'SET_FIELD', field: 'title', payload: e.target.value })}
                                required
                                maxLength={150}
                                autoFocus
                            />
                        </FormField>

                        <FormField id="forum-post-category" label="Category">
                            <Select
                                value={state.category}
                                onChange={e => dispatch({ type: 'SET_FIELD', field: 'category', payload: e.target.value })}
                            >
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </Select>
                        </FormField>

                        <FormField id="forum-post-content" label="Content" error={state.error && !state.content.trim() ? "Content is required" : ""}>
                            <Textarea
                                value={state.content}
                                onChange={e => dispatch({ type: 'SET_FIELD', field: 'content', payload: e.target.value })}
                                required
                                rows={10}
                                placeholder="Share your thoughts, ask a question, or create a forum discussion..."
                            />
                        </FormField>
                    </form>
                </div>
            </div>
            <FixedPageFooter
                onCancel={handleBack}
                submitFormId="create-forum-post-form"
                isLoading={isSubmitting}
                submitText="Post"
            />
        </div>
    );
};

export default CreateForumPostPage;