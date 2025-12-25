
import React, { useState, useRef } from 'react';
import ModalShell from './ModalShell';
import { EnvelopeIcon } from './Icons';
import { InputWithIcon } from './InputWithIcon';
import { FormField } from './FormField';
import { useIsMounted } from '../hooks/useIsMounted';
import { ModalFooter } from './ModalFooter';
import { useFormState } from '../hooks/useFormState';

interface ForgotPasswordModalProps {
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ onClose }) => {
    const { state, setField, errors, isSubmitting, handleSubmit } = useFormState({ email: '' });
    const modalRef = useRef<HTMLDivElement>(null);
    const isMounted = useIsMounted();

    const validate = (currentState: { email: string }) => {
        if (!currentState.email.trim() || !/\S+@\S+\.\S+/.test(currentState.email)) {
            return { email: 'Please enter a valid email address.' };
        }
        return {};
    };

    const handlePasswordReset = handleSubmit(async () => {
        // In a real app, this would be an API call.
        if (isMounted()) {
            onClose();
        }
    }, validate);

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
                <p className="text-sm text-gray-900 mb-4">Enter the email address associated with your account, and we'll send you a link to reset your password.</p>
                <form id="forgot-password-form" onSubmit={handlePasswordReset} className="space-y-2">
                    <FormField id="reset-email" label="Email Address" error={errors.email}>
                        <InputWithIcon
                            type="email"
                            value={state.email}
                            onChange={(e) => setField('email', e.target.value)}
                            icon={<EnvelopeIcon className="h-5 w-5 text-gray-600" />}
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
