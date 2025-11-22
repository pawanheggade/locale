
import React, { useState, useRef, useEffect } from 'react';
import ModalShell from './ModalShell';
import { EnvelopeIcon } from './Icons';
import { InputWithIcon } from './InputWithIcon';
import { useUI } from '../contexts/UIContext';
import { Button } from './ui/Button';

interface ForgotPasswordModalProps {
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ onClose }) => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const isMountedRef = useRef(true);
    const { addToast } = useUI();

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
          isMountedRef.current = false;
        };
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }

        setIsSubmitting(true);
        // In a real app, this would be an API call.
        if (isMountedRef.current) {
            setIsSubmitting(false);
            addToast(`If an account exists for ${email}, a password reset link has been sent.`, 'success');
            onClose();
        }
    };

    const renderFooter = () => (
        <>
            <Button variant="glass" onClick={onClose} disabled={isSubmitting} className="mr-auto">
                Cancel
            </Button>
            <Button
                type="submit"
                form="forgot-password-form"
                isLoading={isSubmitting}
                disabled={!email.trim()}
                className="w-40"
                variant="glass-red"
            >
                Send Reset Link
            </Button>
        </>
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
                    <InputWithIcon
                      id="reset-email"
                      label="Email Address"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      icon={<EnvelopeIcon className="h-5 w-5 text-gray-400" />}
                      error={error}
                      placeholder="you@example.com"
                      required
                      autoFocus
                    />
                </form>
            </div>
        </ModalShell>
    );
};

export default ForgotPasswordModal;
