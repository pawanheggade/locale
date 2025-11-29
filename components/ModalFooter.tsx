
import React from 'react';
import { Button, ButtonProps } from './ui/Button';

interface ModalFooterProps {
    onCancel: () => void;
    cancelText?: string;
    cancelDisabled?: boolean;
    onSubmit?: () => void;
    submitText?: React.ReactNode;
    isSubmitting?: boolean;
    isSubmitDisabled?: boolean;
    submitVariant?: ButtonProps['variant'];
    submitFormId?: string;
    submitClassName?: string;
    children?: React.ReactNode; // For extra buttons (like 'Remove')
}

export const ModalFooter: React.FC<ModalFooterProps> = ({
    onCancel,
    cancelText = 'Cancel',
    cancelDisabled = false,
    onSubmit,
    submitText = 'Save',
    isSubmitting = false,
    isSubmitDisabled = false,
    submitVariant = 'pill-red',
    submitFormId,
    submitClassName,
    children
}) => {
    return (
        <div className="flex w-full items-center gap-2">
            <Button 
                variant="overlay-dark" 
                onClick={onCancel} 
                disabled={cancelDisabled || isSubmitting} 
                className="mr-auto"
            >
                {cancelText}
            </Button>
            
            {children}
            
            {(onSubmit || submitFormId) && (
                <Button
                    type={submitFormId ? 'submit' : 'button'}
                    form={submitFormId}
                    onClick={submitFormId ? undefined : onSubmit}
                    isLoading={isSubmitting}
                    disabled={isSubmitDisabled}
                    variant={submitVariant}
                    className={`min-w-[100px] ${submitClassName || ''}`}
                >
                    {submitText}
                </Button>
            )}
        </div>
    );
};
