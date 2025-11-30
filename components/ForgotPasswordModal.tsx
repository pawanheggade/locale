
import React, { useState, useRef, useReducer } from 'react';
import ModalShell from './ModalShell';
import { EnvelopeIcon } from './Icons';
import { InputWithIcon } from './InputWithIcon';
import { FormField } from './FormField';
import { useIsMounted } from '../hooks/useIsMounted';
import { ModalFooter } from './ModalFooter';

interface ForgotPasswordModalProps {
  onClose: () => void;
}

const initialState = { email: '', error: '' };
type State = typeof initialState;
type Action =
    | { type: 'SET_EMAIL'; payload: string }
    | { type: 'SET_ERROR'; payload: string };

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SET_EMAIL':
            return { ...state, email: action.payload, error: '' };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        default:
            return state;
    }
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ onClose }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const isMounted = useIsMounted();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch({ type: 'SET_ERROR', payload: '' });

        if (!state.email.trim() || !/\S+@\S+\.\S+/.test(state.email)) {
            dispatch({ type: 'SET_ERROR', payload: 'Please enter a valid email address.' });
            return;
        }

        setIsSubmitting(true);
        // In a real app, this would be an API call.
        if (isMounted()) {
            setIsSubmitting(false);
            onClose();
        }
    };

    const renderFooter = () => (
        <ModalFooter
            onCancel={onClose}
            submitText="Send Reset Link"
            isSubmitting={isSubmitting}
            isSubmitDisabled={!state.email.trim()}
            submitFormId="forgot-password-form"
            submitClassName="w-40"
        />
    );

    return (
        <ModalShell 
            panelRef={modalRef} 
            onClose={onClose} 
            title="Forgot Password" 
            footer={renderFooter()} 
            panelClassName="w-full max-w-md"
            titleId="forgot-password-title"
        >
            <div className="p-6">
                <p className="text-sm text-gray-800 mb-4">Enter the email address associated with your account, and we'll send you a link to reset your password.</p>
                <form id="forgot-password-form" onSubmit={handleSubmit} className="space-y-2">
                    <FormField id="reset-email" label="Email Address" error={state.error}>
                        <InputWithIcon
                            type="email"
                            value={state.email}
                            onChange={(e) => dispatch({ type: 'SET_EMAIL', payload: e.target.value })}
                            icon={<EnvelopeIcon className="h-5 w-5 text-gray-400" />}
                            placeholder="you@example.com"
                            required
                            autoFocus
                        />
                    </FormField>
                </form>
            </div>
        </ModalShell>
    );
};

export default ForgotPasswordModal;