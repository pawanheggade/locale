
import React, { useState, useRef } from 'react';
import ModalShell from './ModalShell';
import { EnvelopeIcon } from './Icons';
import { InputWithIcon } from './InputWithIcon';
import { useUI } from '../contexts/UIContext';
import { FormField } from './FormField';
import { useIsMounted } from '../hooks/useIsMounted';
import { ModalFooter } from './ModalFooter';

interface ForgotPasswordModalProps {
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ onClose }) => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const isMounted = useIsMounted();
    const { addToast } = useUI();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }

        setIsSubmitting(true);
        // In a real app, this would be an API call.
        if (isMounted()) {
            setIsSubmitting(false);
            addToast(`If an account exists for ${email}, a password reset link has been sent.`, 'success');
            onClose();
        }
    };

    const renderFooter = () => (
        <ModalFooter
            onCancel={onClose}
            submitText="Send Reset Link"
            isSubmitting={isSubmitting}
            isSubmitDisabled={!email.trim()}
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
                    <FormField id="reset-email" label="Email Address" error={error}>
                        <InputWithIcon
                            type="email"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setError(''); }}
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
